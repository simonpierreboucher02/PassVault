import { users, credentials, type User, type InsertUser, type Credential, type InsertCredential, type UpdateCredential } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { recoveryKey: string }): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  
  getCredentials(userId: string): Promise<Credential[]>;
  getCredential(id: string, userId: string): Promise<Credential | undefined>;
  createCredential(credential: InsertCredential & { userId: string }): Promise<Credential>;
  updateCredential(id: string, userId: string, updates: UpdateCredential): Promise<Credential | undefined>;
  deleteCredential(id: string, userId: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

// Legacy MemStorage removed - using DatabaseStorage for persistence

// Database storage implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { recoveryKey: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await db.update(users)
      .set({ password })
      .where(eq(users.id, id));
  }

  async verifyRecoveryKey(username: string, recoveryKey: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const { compareRecoveryKeys } = await import("./auth");
    const isValid = await compareRecoveryKeys(recoveryKey, user.recoveryKey);
    return isValid ? user : undefined;
  }

  async getCredentials(userId: string): Promise<Credential[]> {
    return await db.select()
      .from(credentials)
      .where(eq(credentials.userId, userId));
  }

  async getCredential(id: string, userId: string): Promise<Credential | undefined> {
    const [credential] = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, id), eq(credentials.userId, userId)));
    return credential || undefined;
  }

  async createCredential(insertCredential: InsertCredential & { userId: string }): Promise<Credential> {
    const [credential] = await db
      .insert(credentials)
      .values({
        ...insertCredential,
        url: insertCredential.url || null,
        category: insertCredential.category || "other",
      })
      .returning();
    return credential;
  }

  async updateCredential(id: string, userId: string, updates: UpdateCredential): Promise<Credential | undefined> {
    const [credential] = await db
      .update(credentials)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(credentials.id, id), eq(credentials.userId, userId)))
      .returning();
    return credential || undefined;
  }

  async deleteCredential(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(credentials)
      .where(and(eq(credentials.id, id), eq(credentials.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
