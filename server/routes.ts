import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImageSchema } from "@shared/schema";
import { z } from "zod";

const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  inputImageUrl: z.string().url().optional(),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
  aspectRatio: z.string().optional().default("match_input_image"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all generated images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getGeneratedImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Generate new image using Replicate API
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, inputImageUrl, width, height, aspectRatio } = generateImageSchema.parse(req.body);
      
      const replicateToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_TOKEN;
      
      if (!replicateToken) {
        return res.status(400).json({ 
          error: "Replicate API token not configured. Please set REPLICATE_API_TOKEN in your environment." 
        });
      }

      // Configuración de entrada para FLUX Kontext Max
      const input: any = {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        num_outputs: 1,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        max_sequence_length: 512,
        safety_tolerance: 2
      };

      // Si hay imagen de entrada, la incluimos
      if (inputImageUrl) {
        input.input_image = inputImageUrl;
      } else {
        // Solo establecer dimensiones si no hay imagen de entrada
        input.width = width;
        input.height = height;
      }

      // Call Replicate API con el modelo correcto FLUX Kontext Max
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${replicateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "dcd79a27c5834330dfdbff6e3bbcc0639e9b2f1b66ffb4e8fe969b4847b10dd8",
          input: input
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Replicate API error:", errorData);
        return res.status(response.status).json({ 
          error: `Replicate API error: ${response.status} ${response.statusText}` 
        });
      }

      const prediction = await response.json();
      
      // Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes maximum
      
      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            "Authorization": `Token ${replicateToken}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check prediction status: ${statusResponse.statusText}`);
        }

        const status = await statusResponse.json();
        
        if (status.status === "succeeded") {
          completed = true;
          
          // Save to storage
          const savedImage = await storage.createGeneratedImage({
            prompt,
            imageUrl: status.output[0],
            inputImageUrl,
            width: inputImageUrl ? 1024 : width,
            height: inputImageUrl ? 1024 : height,
            aspectRatio,
            cost: "0.05", // Approximate cost
          });
          
          res.json(savedImage);
          return;
        } else if (status.status === "failed" || status.status === "canceled") {
          return res.status(500).json({ 
            error: `Image generation failed: ${status.error || 'Unknown error'}` 
          });
        }
        
        attempts++;
      }
      
      if (!completed) {
        res.status(408).json({ error: "Image generation timed out. Please try again." });
      }
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });

  // Delete an image
  app.delete("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }
      
      const deleted = await storage.deleteGeneratedImage(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
