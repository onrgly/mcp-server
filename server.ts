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
