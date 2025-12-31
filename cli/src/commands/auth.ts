/**
 * Authentication command for the CLI.
 * Handles login, logout, and status checking.
 */

import { Command } from "commander";
import {
  authenticate,
  clearAuthState,
  isAuthenticated,
  getCurrentUser,
  refreshAuth,
} from "../client";

/**
 * Prompt for input using Bun's readline
 */
async function prompt(message: string, hidden = false): Promise<string> {
  process.stdout.write(message);

  // For password input, we need to handle it differently
  if (hidden) {
    // Bun doesn't have a built-in way to hide input, so we'll use a workaround
    const input = await new Promise<string>((resolve) => {
      let data = "";
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onData = (char: string) => {
        if (char === "\n" || char === "\r") {
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(data);
        } else if (char === "\u0003") {
          // Ctrl+C
          process.exit(1);
        } else if (char === "\u007F" || char === "\b") {
          // Backspace
          if (data.length > 0) {
            data = data.slice(0, -1);
          }
        } else {
          data += char;
        }
      };

      process.stdin.on("data", onData);
    });
    return input;
  }

  // Regular visible input
  const input = await new Promise<string>((resolve) => {
    let data = "";
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onData = (chunk: string) => {
      data += chunk;
      if (data.includes("\n")) {
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        resolve(data.trim());
      }
    };

    process.stdin.on("data", onData);
  });
  return input;
}

/**
 * Login action
 */
async function loginAction(options: { user?: string; pass?: string }): Promise<void> {
  // Get credentials from options, env vars, or prompt
  let email = options.user || process.env.GJ_ADMIN_USER;
  let password = options.pass || process.env.GJ_ADMIN_PASS;

  if (!email) {
    email = await prompt("Email: ");
  }

  if (!password) {
    password = await prompt("Password: ", true);
  }

  if (!email || !password) {
    console.error("Email and password are required");
    process.exit(1);
  }

  console.log(`Authenticating as ${email}...`);

  const success = await authenticate(email, password);

  if (success) {
    const user = getCurrentUser();
    console.log(`✓ Authenticated successfully as ${user?.email}`);
  } else {
    console.error("✗ Authentication failed");
    process.exit(1);
  }
}

/**
 * Logout action
 */
function logoutAction(): void {
  clearAuthState();
  console.log("✓ Logged out successfully");
}

/**
 * Status action
 */
async function statusAction(): Promise<void> {
  if (!isAuthenticated()) {
    console.log("Not authenticated");
    process.exit(1);
  }

  // Try to refresh the token to verify it's still valid
  const valid = await refreshAuth();

  if (valid) {
    const user = getCurrentUser();
    console.log("✓ Authenticated");
    console.log(`  User ID: ${user?.id}`);
    console.log(`  Email: ${user?.email}`);
    if (user?.name) {
      console.log(`  Name: ${user.name}`);
    }
  } else {
    console.log("✗ Session expired. Please log in again.");
    process.exit(1);
  }
}

/**
 * Create the auth command
 */
export function createAuthCommand(): Command {
  const auth = new Command("auth")
    .description("Manage authentication");

  // Default action is login
  auth
    .option("-u, --user <email>", "User email")
    .option("-p, --pass <password>", "User password")
    .action(loginAction);

  // Subcommands
  auth
    .command("login")
    .description("Log in to PocketBase")
    .option("-u, --user <email>", "User email")
    .option("-p, --pass <password>", "User password")
    .action(loginAction);

  auth
    .command("logout")
    .description("Log out and clear saved credentials")
    .action(logoutAction);

  auth
    .command("status")
    .description("Check authentication status")
    .action(statusAction);

  return auth;
}
