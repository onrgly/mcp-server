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
    const baseUrl = process.env.NETLIFY_BASE_URL || "https://mcp.smilecenterturkey.com";
    const token = process.env.NETLIFY_ADMIN_TOKEN;

    if (!token) {
      return res.status(401).json({ error: "NETLIFY_ADMIN_TOKEN not configured in secrets." });
    }

    try {
      const action = req.query.action || "integrations";
      const targetUrl = `${baseUrl}/.netlify/functions/admin-api?action=${action}`;
      
      console.log(`Fetching from Netlify: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Netlify API error: ${errorText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ error: "Failed to fetch data from Netlify." });
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
