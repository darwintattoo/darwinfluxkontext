import { users, generatedImages, type User, type InsertUser, type GeneratedImage, type InsertImage } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getGeneratedImages(): Promise<GeneratedImage[]>;
  createGeneratedImage(image: InsertImage): Promise<GeneratedImage>;
  getGeneratedImage(id: number): Promise<GeneratedImage | undefined>;
  deleteGeneratedImage(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private images: Map<number, GeneratedImage>;
  private currentUserId: number;
  private currentImageId: number;

  constructor() {
    this.users = new Map();
    this.images = new Map();
    this.currentUserId = 1;
    this.currentImageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    return Array.from(this.images.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createGeneratedImage(insertImage: InsertImage): Promise<GeneratedImage> {
    const id = this.currentImageId++;
    const image: GeneratedImage = { 
      id,
      prompt: insertImage.prompt,
      imageUrl: insertImage.imageUrl,
      inputImageUrl: insertImage.inputImageUrl ?? null,
      width: insertImage.width,
      height: insertImage.height,
      aspectRatio: insertImage.aspectRatio ?? "match_input_image",
      cost: insertImage.cost ?? null,
      createdAt: new Date() 
    };
    this.images.set(id, image);
    return image;
  }

  async getGeneratedImage(id: number): Promise<GeneratedImage | undefined> {
    return this.images.get(id);
  }

  async deleteGeneratedImage(id: number): Promise<boolean> {
    return this.images.delete(id);
  }
}

export const storage = new MemStorage();
