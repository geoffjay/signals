/**
 * PocketBase client for CLI use.
 * Handles authentication state persistence and API communication.
 * Supports both email/password and OAuth2 authentication.
 */

import PocketBase from "pocketbase";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createServer, type Server } from "http";
import { URL } from "url";

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
export function getCurrentUser(): {
  id: string;
  email: string;
  name?: string;
} | null {
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
export async function authenticate(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    await pb.collection("users").authWithPassword(email, password);
    saveAuthState();
    return true;
  } catch (error) {
    console.error(
      "Authentication failed:",
      error instanceof Error ? error.message : error,
    );
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

/**
 * OAuth2 provider info returned by PocketBase
 */
export interface OAuthProvider {
  name: string;
  displayName: string;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  authUrl: string;
}

/**
 * List available OAuth2 providers
 */
export async function listOAuthProviders(): Promise<OAuthProvider[]> {
  try {
    const authMethods = await pb.collection("users").listAuthMethods();
    return authMethods.oauth2?.providers || [];
  } catch (error) {
    console.error(
      "Failed to list auth methods:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Find a specific OAuth provider by name
 */
export async function getOAuthProvider(
  providerName: string,
): Promise<OAuthProvider | null> {
  const providers = await listOAuthProviders();
  return (
    providers.find(
      (p) => p.name.toLowerCase() === providerName.toLowerCase(),
    ) || null
  );
}

/**
 * Start a local HTTP server to receive OAuth callback
 * Returns the redirect URL and a promise that resolves with the auth code
 */
function startCallbackServer(
  expectedState: string,
): Promise<{ server: Server; port: number; codePromise: Promise<string> }> {
  return new Promise((resolve, reject) => {
    let codeResolve: (code: string) => void;
    let codeReject: (error: Error) => void;

    const codePromise = new Promise<string>((res, rej) => {
      codeResolve = res;
      codeReject = rej;
    });

    const server = createServer((req, res) => {
      if (!req.url) {
        res.writeHead(400);
        res.end("Bad request");
        return;
      }

      const url = new URL(req.url, `http://localhost`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>❌ Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          codeReject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (state !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>❌ Authentication Failed</h1>
                <p>Invalid state parameter (possible CSRF attack)</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          codeReject(new Error("Invalid state parameter"));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>❌ Authentication Failed</h1>
                <p>No authorization code received</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          codeReject(new Error("No authorization code received"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: system-ui; padding: 2rem; text-align: center;">
              <h1>✅ Authentication Successful</h1>
              <p>You can close this window and return to the CLI.</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
        codeResolve(code);
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    // Listen on localhost with a fixed port for OAuth callbacks
    // This port must be registered in OAuth provider settings
    const OAUTH_CALLBACK_PORT = 8085;
    server.listen(OAUTH_CALLBACK_PORT, "localhost", () => {
      const address = server.address();
      if (typeof address === "object" && address) {
        resolve({ server, port: address.port, codePromise });
      } else {
        reject(new Error("Failed to get server address"));
      }
    });

    server.on("error", reject);
  });
}

/**
 * Open URL in the default browser
 */
async function openBrowser(url: string): Promise<void> {
  const { platform } = process;
  let command: string;

  if (platform === "darwin") {
    command = "open";
  } else if (platform === "win32") {
    command = "start";
  } else {
    command = "xdg-open";
  }

  const proc = Bun.spawn([command, url], {
    stdout: "ignore",
    stderr: "ignore",
  });
  await proc.exited;
}

/**
 * Authenticate using OAuth2 provider
 * Opens browser for authentication and handles callback
 */
export async function authenticateWithOAuth(
  providerName: string,
): Promise<boolean> {
  try {
    // Get provider info
    const provider = await getOAuthProvider(providerName);
    if (!provider) {
      console.error(
        `OAuth provider "${providerName}" not found or not enabled`,
      );
      const available = await listOAuthProviders();
      if (available.length > 0) {
        console.error(
          `Available providers: ${available.map((p) => p.name).join(", ")}`,
        );
      }
      return false;
    }

    console.log(`Starting ${provider.displayName} authentication...`);

    // Start local callback server
    const { server, port, codePromise } = await startCallbackServer(
      provider.state,
    );
    // Use localhost (not 127.0.0.1) - Google OAuth allows localhost for native apps
    const redirectUrl = `http://localhost:${port}/callback`;

    // Build the full auth URL with our redirect
    // PocketBase's authUrl ends with "&redirect_uri=" so we just append the value
    // But handle edge cases where it might not
    let authUrl: string;
    if (
      provider.authUrl.endsWith("&redirect_uri=") ||
      provider.authUrl.endsWith("?redirect_uri=")
    ) {
      authUrl = `${provider.authUrl}${encodeURIComponent(redirectUrl)}`;
    } else if (provider.authUrl.includes("redirect_uri=")) {
      // redirect_uri already has a value, replace it
      authUrl = provider.authUrl.replace(
        /redirect_uri=[^&]*/,
        `redirect_uri=${encodeURIComponent(redirectUrl)}`,
      );
    } else {
      // No redirect_uri parameter, add it
      const separator = provider.authUrl.includes("?") ? "&" : "?";
      authUrl = `${provider.authUrl}${separator}redirect_uri=${encodeURIComponent(redirectUrl)}`;
    }

    console.log(`Opening browser for authentication...`);
    console.log(`(If browser doesn't open, visit: ${authUrl})`);

    // Open browser
    await openBrowser(authUrl);

    // Wait for callback with timeout
    const timeoutMs = 120000; // 2 minutes
    let code: string;
    try {
      code = await Promise.race([
        codePromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Authentication timed out")),
            timeoutMs,
          ),
        ),
      ]);
    } finally {
      // Close the server and ensure all connections are destroyed
      server.close();
      server.closeAllConnections?.();
    }

    console.log(`Completing authentication...`);

    // Exchange code for auth token
    await pb
      .collection("users")
      .authWithOAuth2Code(
        provider.name,
        code,
        provider.codeVerifier,
        redirectUrl,
      );

    // Save auth state
    saveAuthState();

    return true;
  } catch (error) {
    console.error(
      "OAuth authentication failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

// Initialize: try to load saved auth state
loadAuthState();
