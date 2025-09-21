import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCredentialSchema, updateCredentialSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Credential management routes
  app.get("/api/credentials", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const credentials = await storage.getCredentials(req.user!.id);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post("/api/credentials", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertCredentialSchema.parse(req.body);
      const credential = await storage.createCredential({
        ...validatedData,
        userId: req.user!.id,
      });
      res.status(201).json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid credential data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create credential" });
      }
    }
  });

  app.put("/api/credentials/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = updateCredentialSchema.parse(req.body);
      const credential = await storage.updateCredential(
        req.params.id,
        req.user!.id,
        validatedData
      );
      
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      
      res.json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid credential data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update credential" });
      }
    }
  });

  app.delete("/api/credentials/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const deleted = await storage.deleteCredential(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete credential" });
    }
  });

  // Recovery key validation route
  app.post("/api/validate-recovery-key", async (req, res) => {
    try {
      const { username, recoveryKey } = req.body;
      const user = await storage.verifyRecoveryKey(username, recoveryKey);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid username or recovery key" });
      }
      
      res.json({ valid: true, userId: user.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate recovery key" });
    }
  });

  // Reset password with recovery key
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { username, recoveryKey, newPassword } = req.body;
      const user = await storage.verifyRecoveryKey(username, recoveryKey);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid username or recovery key" });
      }
      
      // Import hash function from auth
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(newPassword);
      
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
