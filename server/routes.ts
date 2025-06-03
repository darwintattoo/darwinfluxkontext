import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { imageStorage } from "./imageStorage";
import { insertImageSchema } from "@shared/schema";
import { z } from "zod";
import Replicate from "replicate";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';
import sharp from 'sharp';

const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  inputImageUrl: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Allow empty string
    try {
      new URL(val);
      return true;
    } catch {
      return val.startsWith('/images/'); // Allow static file paths
    }
  }, "Invalid URL or file path"),
  width: z.number().optional().default(1024),
  height: z.number().optional().default(1024),
  aspectRatio: z.string().optional().default("match_input_image"),
  model: z.enum(["max", "pro"]).optional().default("max"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static images from public directory
  app.use('/images', express.static(join(process.cwd(), 'public', 'images')));
  // Serve individual images (converts base64 to binary for better performance)
  app.get("/api/image/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      console.log(`Image request for ID: ${imageId} from ${req.headers.host}`);
      
      const image = await storage.getGeneratedImage(imageId);
      
      if (!image || !image.imageUrl) {
        console.log(`Image not found for ID: ${imageId}`);
        return res.status(404).json({ error: "Image not found" });
      }

      // If it's a base64 data URL, convert to binary
      if (image.imageUrl.startsWith('data:image/')) {
        const base64Data = image.imageUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        console.log(`Serving binary image for ID: ${imageId}, size: ${imageBuffer.length} bytes`);
        
        res.set({
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cross-Origin-Resource-Policy': 'cross-origin'
        });
        
        return res.send(imageBuffer);
      }
      
      // If it's a regular URL, redirect
      console.log(`Redirecting to URL for ID: ${imageId}`);
      res.redirect(image.imageUrl);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Get all generated images (optimized for deployment)
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getGeneratedImages();
      
      // Always return original base64 URLs - let the client handle optimization
      // The issue is that in deployment, the API endpoints don't resolve correctly
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Upload image file
  app.post("/api/upload", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      // Return the base64 data URL directly for Replicate API
      res.json({ imageUrl: imageData });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Generate new image using Replicate API
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, inputImageUrl, width, height, aspectRatio, model } = generateImageSchema.parse(req.body);
      
      const replicateToken = process.env.REPLICATE_API_TOKEN;
      
      if (!replicateToken) {
        return res.status(400).json({ 
          error: "Replicate API token not configured. Please set REPLICATE_API_TOKEN in your environment." 
        });
      }

      const replicate = new Replicate({
        auth: replicateToken,
      });

      // Configuración de entrada para FLUX Kontext Max
      const input: any = {
        prompt: prompt,
      };

      // Si hay imagen de entrada, la incluimos
      if (inputImageUrl) {
        console.log("Input image URL:", inputImageUrl);
        
        // Si la URL es local (empieza con /images/), convertir a base64
        if (inputImageUrl.startsWith('/images/')) {
          try {
            const imagePath = join(process.cwd(), 'public', inputImageUrl);
            if (existsSync(imagePath)) {
              const imageBuffer = readFileSync(imagePath);
              const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
              input.input_image = base64Image;
              console.log("Converted local image to base64");
            } else {
              console.error("Local image file not found:", imagePath);
              return res.status(400).json({ error: "Reference image not found" });
            }
          } catch (error) {
            console.error("Error reading local image:", error);
            return res.status(400).json({ error: "Failed to process reference image" });
          }
        } else {
          // Si ya es una URL externa o base64, usarla directamente
          input.input_image = inputImageUrl;
        }
        
        if (aspectRatio && aspectRatio !== "match_input_image") {
          input.aspect_ratio = aspectRatio;
        }
      } else {
        // Para generación desde texto, usar dimensiones específicas
        input.width = width;
        input.height = height;
      }

      console.log("Final input object:", JSON.stringify(input, null, 2));

      // Seleccionar el modelo basado en el parámetro
      const modelName = model === "pro" 
        ? "black-forest-labs/flux-kontext-pro" 
        : "black-forest-labs/flux-kontext-max";
      
      console.log(`Using model: ${modelName}`);

      // Usar el SDK de Replicate con reintentos para manejar interrupciones
      let output;
      let retries = 3;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Generating image (attempt ${attempt}/${retries}) with ${modelName}...`);
          output = await replicate.run(modelName, { input });
          break; // Éxito, salir del bucle
        } catch (error: any) {
          console.log(`Attempt ${attempt} failed:`, error.message);
          
          // Si es error de contenido sensible, no reintentar
          if (error.message?.includes("flagged as sensitive")) {
            throw new Error("Content was flagged as sensitive. Please try with a different prompt or image.");
          }
          
          if (attempt === retries || !error.message?.includes("Prediction interrupted")) {
            throw error; // Último intento o error diferente
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
      
      console.log("Replicate output received:", output);
      
      // Manejar diferentes formatos de output de FLUX Kontext Max
      let imageUrl: string;
      let optimizedImageBase64: string = "";
      let thumbnailBase64: string = "";
      
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (output && typeof (output as any)[Symbol.asyncIterator] === 'function') {
        // Es un stream iterable
        console.log("Processing async iterable stream from Replicate...");
        
        const chunks: Buffer[] = [];
        try {
          for await (const chunk of output as any) {
            chunks.push(Buffer.from(chunk));
          }
          
          const imageBuffer = Buffer.concat(chunks);
          console.log("Original image buffer size:", imageBuffer.length);
          
          // Optimizar y almacenar imagen directamente en base de datos para deployment
          
          try {
            // Optimizar imagen principal manteniendo buena calidad
            const optimizedBuffer = await sharp(imageBuffer)
              .jpeg({
                quality: 85,
                progressive: true
              })
              .resize(1200, 1200, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .toBuffer();
            
            optimizedImageBase64 = optimizedBuffer.toString('base64');
            
            // Generar thumbnail muy pequeño para la galería (200x200, calidad baja)
            const thumbnailBuffer = await sharp(imageBuffer)
              .jpeg({ 
                quality: 30,
                progressive: true
              })
              .resize(200, 200, { 
                fit: 'cover',
                withoutEnlargement: true 
              })
              .toBuffer();
            
            thumbnailBase64 = thumbnailBuffer.toString('base64');
            
            // Usar thumbnail pequeño para la galería
            imageUrl = `data:image/jpeg;base64,${thumbnailBase64}`;
            
            console.log("Image optimized for database storage");
          } catch (optimizeError) {
            console.error("Image optimization failed:", optimizeError);
            optimizedImageBase64 = imageBuffer.toString('base64');
            thumbnailBase64 = optimizedImageBase64;
            imageUrl = `data:image/png;base64,${optimizedImageBase64}`;
          }

          // Guardar en base de datos inmediatamente después de procesar
          const savedImage = await storage.createGeneratedImage({
            prompt,
            imageUrl: imageUrl as string,
            imageData: optimizedImageBase64,
            thumbnailData: thumbnailBase64,
            inputImageUrl,
            width: inputImageUrl ? 1024 : width,
            height: inputImageUrl ? 1024 : height,
            aspectRatio,
            cost: "0.05",
          });
          
          return res.json(savedImage);
        } catch (streamError) {
          console.error("Error reading async stream:", streamError);
          throw new Error("Failed to read image stream");
        }
      } else if (output && 'getReader' in output) {
        // Es un ReadableStream estándar
        console.log("Processing ReadableStream from Replicate...");
        
        const chunks: Buffer[] = [];
        const reader = (output as any).getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.from(value));
          }
          
          const imageBuffer = Buffer.concat(chunks);
          console.log("Image buffer size:", imageBuffer.length);
          
          // Convertir a base64 data URL
          const base64 = imageBuffer.toString('base64');
          imageUrl = `data:image/png;base64,${base64}`;
          console.log("Created data URL, length:", imageUrl.length);
        } catch (streamError) {
          console.error("Error reading stream:", streamError);
          throw new Error("Failed to read image stream");
        } finally {
          reader.releaseLock();
        }
      } else {
        console.error("Unexpected output format from FLUX Kontext Max:", output);
        return res.status(500).json({ 
          error: "No image URL was generated - unexpected output format" 
        });
      }
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error("Invalid image URL:", imageUrl);
        return res.status(500).json({ 
          error: "No valid image URL was generated" 
        });
      }

      // Para casos donde no se procesa stream (URL directa)
      if (typeof output === 'string' || Array.isArray(output)) {
        const savedImage = await storage.createGeneratedImage({
          prompt,
          imageUrl: imageUrl as string,
          imageData: "",
          thumbnailData: "",
          inputImageUrl,
          width: inputImageUrl ? 1024 : width,
          height: inputImageUrl ? 1024 : height,
          aspectRatio,
          cost: "0.05",
        });
        
        res.json(savedImage);
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



  // Servir imagen completa por ID
  app.get("/api/images/:id/full", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }
      
      const image = await storage.getGeneratedImage(id);
      
      if (!image || !image.imageData) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Convertir base64 a buffer y servir como imagen
      const imageBuffer = Buffer.from(image.imageData, 'base64');
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=3600'
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error serving full image:", error);
      res.status(500).json({ error: "Failed to serve image" });
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
