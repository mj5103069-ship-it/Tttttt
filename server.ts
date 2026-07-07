import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing
  app.use(express.json());

  // API Routes - defined FIRST
  app.post("/api/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "API_KEY_MISSING",
          message: "GEMINI_API_KEY environment variable is not configured. Please add it via the Settings > Secrets panel in the top-right corner of the AI Studio UI.",
        });
      }

      const { messages, systemInstruction, webSearch } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: "INVALID_REQUEST",
          message: "The 'messages' field is required and must be an array of chat messages.",
        });
      }

      // Initialize GoogleGenAI SDK server-side
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Prepare contents payload
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));

      // Prepare config options
      const config: any = {};
      
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (webSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      // Generate content using gemini-3.5-flash as the professional, high-performance model
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: config,
      });

      // Extract results safely
      const replyText = response.text || "";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

      return res.json({
        content: replyText,
        groundingMetadata: {
          chunks: groundingChunks,
          queries: webSearchQueries,
        },
      });
    } catch (err: any) {
      console.error("Gemini API Error in /api/chat:", err);
      return res.status(500).json({
        error: "GEMINI_API_ERROR",
        message: err.message || "An unexpected error occurred while communicating with the Gemini AI service.",
      });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
