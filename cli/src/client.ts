/**
 * PocketBase client for CLI use.
 * Handles authentication state persistence and API communication.
 */

import PocketBase from "pocketbase";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Config directory for storing auth state
const CONFIG_DIR = join(homedir(), ".signals-cli");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");

// Default PocketBase URL (can be overridden via env)
const PB_URL = process.env.GJ_POCKETBASE_URL || "http://127.0.0.1:8090";

// Create singleton PocketBase instance
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation
pb.autoCancellation(false);

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Save authentication state to disk
 */
export function saveAuthState(): void {
  ensureConfigDir();
  const authData = {
    token: pb.authStore.token,
    model: pb.authStore.model,
    url: PB_URL,
  };
  writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
}

/**
 * Load authentication state from disk
 */
export function loadAuthState(): boolean {
  try {
    if (!existsSync(AUTH_FILE)) {
      return false;
    }
    const data = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
    if (data.token && data.model) {
      pb.authStore.save(data.token, data.model);
      return pb.authStore.isValid;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clear authentication state
 */
export function clearAuthState(): void {
  pb.authStore.clear();
  try {
    if (existsSync(AUTH_FILE)) {
      writeFileSync(AUTH_FILE, "{}");
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Check if currently authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/**
 * Get current user info
 */
export function getCurrentUser(): { id: string; email: string; name?: string } | null {
  if (!pb.authStore.isValid || !pb.authStore.model) {
    return null;
  }
  const model = pb.authStore.model;
  return {
    id: model.id,
    email: model.email,
    name: model.name,
  };
}

/**
 * Authenticate with email and password
 */
export async function authenticate(email: string, password: string): Promise<boolean> {
  try {
    await pb.collection("users").authWithPassword(email, password);
    saveAuthState();
    return true;
  } catch (error) {
    console.error("Authentication failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Refresh authentication token
 */
export async function refreshAuth(): Promise<boolean> {
  try {
    await pb.collection("users").authRefresh();
    saveAuthState();
    return true;
  } catch {
    clearAuthState();
    return false;
  }
}

// Initialize: try to load saved auth state
loadAuthState();
