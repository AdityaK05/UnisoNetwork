import express, { type Express } from "express";
import { type Server } from "http";

// Production stub - real Vite setup only works in development with full dependencies

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  throw new Error("Vite setup is only available in development mode");
}
