import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { imageStorage } from "./imageStorage";
import { insertImageSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import Replicate from "replicate";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import session from 'express-session';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable gzip compression for better performance
  app.use(express.json({ limit: '10mb' }));
  
  // CORS configuration for production
  const isProduction = process.env.NODE_ENV === 'production';
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'tattoo-generator-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: isProduction ? 'none' : 'lax' // Allow cross-site cookies in production
    }
  }));

  // JWT Secret
  const JWT_SECRET = process.env.JWT_SECRET || 'tattoo-generator-jwt-secret-key';

  // Middleware to check JWT authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Auth routes
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      req.session.userId = user.id;
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username },
        token: token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', (req: any, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.json({ authenticated: false });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      res.json({ 
        authenticated: true, 
        userId: decoded.userId,
        username: decoded.username 
      });
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // Create initial admin user (unprotected for setup)
  app.post('/api/setup/admin', async (req, res) => {
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername('admin');
      if (existingAdmin) {
        return res.json({ success: true, message: 'Admin already exists' });
      }

      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = await storage.createUser({ username: 'admin', password: hashedPassword });
      
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ error: 'Error creating admin' });
    }
  });

  // Admin route to create test users (protected)
  app.post('/api/admin/create-user', requireAuth, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });
      
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Error creating user' });
    }
  });

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

  // Get all generated images (protected)
  app.get("/api/images", requireAuth, async (req, res) => {
    try {
      console.log("Fetching images for user:", req.user);
      const images = await storage.getGeneratedImages();
      console.log(`Found ${images.length} images`);
      
      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch images", details: error.message });
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

  // Generate new image using Replicate API (protected)
  app.post("/api/generate", requireAuth, async (req, res) => {
    try {
      const { prompt, inputImageUrl, width, height, aspectRatio } = generateImageSchema.parse(req.body);
      
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

      // Usar el SDK de Replicate con reintentos para manejar interrupciones
      let output;
      let retries = 3;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Generating image (attempt ${attempt}/${retries})...`);
          output = await replicate.run("black-forest-labs/flux-kontext-max", { input });
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
          
          // Save as static file to avoid base64 URL issues in deployment
          try {
            const imageDir = join(process.cwd(), 'public', 'images');
            if (!existsSync(imageDir)) {
              mkdirSync(imageDir, { recursive: true });
            }
            
            const fileName = `${nanoid()}.png`;
            const thumbnailFileName = `thumb_${fileName}`;
            const filePath = join(imageDir, fileName);
            const thumbnailPath = join(imageDir, thumbnailFileName);
            
            // Generate thumbnail for faster loading
            await sharp(imageBuffer)
              .png({ 
                quality: 60,
                compressionLevel: 9
              })
              .resize(400, 400, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .toFile(thumbnailPath);
            
            // Save full resolution image
            await sharp(imageBuffer)
              .png({ 
                quality: 85,
                compressionLevel: 9
              })
              .resize(1024, 1024, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .toFile(filePath);
            
            // Use static file URL that works in deployment
            imageUrl = `/images/${fileName}`;
            console.log("Saved image and thumbnail as static files:", imageUrl);
          } catch (fileError) {
            console.error("Failed to save as static file:", fileError);
            // Fallback to compressed base64
            const compressedBuffer = await sharp(imageBuffer)
              .png({ quality: 75, compressionLevel: 9 })
              .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
              .toBuffer();
            
            const base64 = compressedBuffer.toString('base64');
            imageUrl = `data:image/png;base64,${base64}`;
            console.log("Fallback to compressed base64, length:", imageUrl.length);
          }
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

      // Save to storage
      const savedImage = await storage.createGeneratedImage({
        prompt,
        imageUrl: imageUrl as string,
        inputImageUrl,
        width: inputImageUrl ? 1024 : width,
        height: inputImageUrl ? 1024 : height,
        aspectRatio,
        cost: "0.05", // Approximate cost
      });
      
      res.json(savedImage);
      
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

  // Delete an image (protected)
  app.delete("/api/images/:id", requireAuth, async (req, res) => {
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
