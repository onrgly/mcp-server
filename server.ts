import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Netlify Migration
  app.get("/api/migrate", async (req, res) => {
    let baseUrl = process.env.NETLIFY_BASE_URL || "https://mcp.smilecenterturkey.com";
    const token = process.env.NETLIFY_ADMIN_TOKEN;
    const baseUrlEnv = process.env.NETLIFY_BASE_URL;
    
    console.log("Migration: Environment check:", {
      hasToken: !!token,
      hasBaseUrl: !!baseUrlEnv,
      allKeys: Object.keys(process.env).filter(k => k.startsWith("NETLIFY"))
    });

    if (!token) {
      console.error("Migration Error: NETLIFY_ADMIN_TOKEN is missing in environment.");
      return res.status(401).json({ error: "NETLIFY_ADMIN_TOKEN not configured in secrets." });
    }

    // Remove trailing slash from baseUrl if present
    baseUrl = baseUrl.replace(/\/$/, "");

    try {
      const action = req.query.action || "integrations";
      const targetUrl = `${baseUrl}/.netlify/functions/admin-api?action=${action}`;
      
      console.log(`Migration: Fetching ${action} from ${baseUrl}`);
      
      const response = await fetch(targetUrl, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Migration: Netlify API returned ${response.status}: ${errorText}`);
        return res.status(response.status).json({ error: `Netlify API error (${response.status}): ${errorText}` });
      }

      const data = await response.json();
      console.log(`Migration: Received data for ${action}:`, JSON.stringify(data).slice(0, 200));
      res.json(data);
    } catch (error) {
      console.error("Migration Critical Error:", error);
      res.status(500).json({ error: "Failed to connect to Netlify. Please check the URL and your internet connection." });
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
