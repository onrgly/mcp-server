import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Troubleshooting & Analysis
  app.post("/api/ai/troubleshoot", async (req, res) => {
    const { errorLog } = req.body;
    if (!errorLog) return res.status(400).json({ error: "No logs provided" });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze this MCP integration error and provide a technical troubleshooting guide: "${errorLog}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      res.json({ suggestion: response.text });
    } catch (error: any) {
      res.status(500).json({ error: "AI analysis failed" });
    }
  });

  app.post("/api/ai/schema", async (req, res) => {
    const { description } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a valid JSON Schema for an MCP tool based on this description: "${description}". 
        Return ONLY the JSON object, no markdown, no explanation.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json"
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      res.status(500).json({ error: "Schema generation failed" });
    }
  });

  // General API Proxy for Netlify Backend (KB_Retrieval parity)
  app.all("/api/admin", async (req, res) => {
    let baseUrl = process.env.NETLIFY_BASE_URL || "https://mcp.smilecenterturkey.com";
    const token = process.env.NETLIFY_ADMIN_TOKEN;
    
    if (!token) {
      console.error("API Proxy Error: NETLIFY_ADMIN_TOKEN is missing.");
      return res.status(401).json({ error: "Administration token not configured." });
    }

    baseUrl = baseUrl.replace(/\/$/, "");
    const action = req.query.action || "tools";
    const targetUrl = `${baseUrl}/.netlify/functions/admin-api?${new URLSearchParams(req.query as any).toString()}`;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for complex operations

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-mcp-request-id": (req.headers["x-mcp-request-id"] as string) || crypto.randomUUID()
        },
        body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return res.status(response.status).json(data);
      } else {
        const text = await response.text();
        return res.status(response.status).send(text);
      }
    } catch (error: any) {
      console.error(`Proxy Error (${action}):`, error);
      res.status(500).json({ error: error.name === 'AbortError' ? "Request timed out" : "Backend connection failed" });
    }
  });

  // Playground Run API Proxy (Secures provider keys server-side & binds Gemini)
  app.post("/api/playground-run", async (req, res) => {
    const { systemPrompt, developerPrompt, userPrompt, messages, settings, tools, variables } = req.body;
    
    // 1. Substitute input variables
    let interpolatedUser = userPrompt || "";
    if (variables && typeof variables === "object") {
      for (const [key, val] of Object.entries(variables)) {
        interpolatedUser = interpolatedUser.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(val));
      }
    }
    
    // 2. Formulate consolidated System directives
    let finalSystem = systemPrompt || "";
    if (developerPrompt) {
      finalSystem += "\n\nDEVELOPER DIRECTIVES:\n" + developerPrompt;
    }
    
    if (tools && Array.isArray(tools) && tools.length > 0) {
      finalSystem += "\n\nACTIVE BOUND MCP TOOLS DEFINITION:\n" + JSON.stringify(tools, null, 2);
    }
    
    try {
      const start = Date.now();
      
      // Determine model to execute
      let targetModel = "gemini-2.5-flash"; // Default highly-performant fallback
      if (settings?.provider === "Gemini" && settings?.model) {
        targetModel = settings.model;
      }
      
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [
          ...(finalSystem ? [
            { role: "user", parts: [{ text: `[SYSTEM DIRECTIVE AND TOOLS SPECIFICATION]:\n${finalSystem}` }] },
            { role: "model", parts: [{ text: "System guidelines and active server MCP tools loaded successfully. Ready to interpret parameters." }] }
          ] : []),
          ...(messages || []).map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          { role: "user", parts: [{ text: interpolatedUser || "Hello" }] }
        ],
        config: {
          temperature: settings?.temperature ?? 0.3,
          maxOutputTokens: settings?.maxOutputTokens ?? 800,
        }
      });
      
      const latency = Date.now() - start;
      const responseText = response.text || "No response text generated.";
      
      // Math metrics (estimated tokens for the developer panel view)
      const inputChars = (finalSystem.length + (messages || []).reduce((acc: number, m: any) => acc + m.content.length, 0) + interpolatedUser.length);
      const inputTokens = Math.ceil(inputChars / 4) + 120;
      const outputTokens = Math.ceil(responseText.length / 4) + 20;
      const totalTokens = inputTokens + outputTokens;
      
      // Cost estimation based on standard proxy models
      const costEstimate = (inputTokens * 0.000015) + (outputTokens * 0.00006);
      
      res.json({
        ok: true,
        responseText,
        metrics: {
          inputTokens,
          outputTokens,
          totalTokens,
          costEstimate: Number(costEstimate.toFixed(5)),
          latencyMs: latency,
        },
        rawRequestPayload: {
          model: targetModel,
          temperature: settings?.temperature ?? 0.3,
          max_tokens: settings?.maxOutputTokens ?? 800,
          messages: [
            { role: "system", content: finalSystem },
            ...(messages || []).map((x: any) => ({ role: x.role, content: x.content })),
            { role: "user", content: interpolatedUser }
          ]
        },
        rawResponsePayload: response
      });
    } catch (error: any) {
      console.error("Playground Run Error:", error);
      res.status(500).json({ 
        ok: false, 
        error: error.message || "Model execution failed. Host admin credential check failed." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
