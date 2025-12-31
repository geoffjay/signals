#!/usr/bin/env bun
/**
 * Signals CLI - Command line interface for managing instruments and interacting with PocketBase.
 *
 * Usage:
 *   bun run cli -- auth                           # Authenticate (prompts for credentials)
 *   bun run cli -- auth --user <email> --pass <password>  # Authenticate with credentials
 *   bun run cli -- auth status                    # Check authentication status
 *   bun run cli -- auth logout                    # Log out
 *
 *   bun run cli -- instruments list               # List your instruments
 *   bun run cli -- instruments list --all         # List all accessible instruments
 *   bun run cli -- instruments list --public      # List public instruments
 *   bun run cli -- instruments read --id <id>     # Read a single instrument
 *   bun run cli -- instruments create --file <path>  # Create from JSON file
 *   bun run cli -- instruments update --id <id> --file <path>  # Update from JSON file
 *   bun run cli -- instruments delete --id <id> --force  # Delete an instrument
 *   bun run cli -- instruments validate --file <path>  # Validate JSON file
 *
 * Environment Variables:
 *   GJ_POCKETBASE_URL   - PocketBase server URL (default: http://127.0.0.1:8090)
 *   GJ_ADMIN_USER       - Email for authentication
 *   GJ_ADMIN_PASS       - Password for authentication
 */

import { Command } from "commander";
import { createAuthCommand } from "./commands/auth";
import { createInstrumentsCommand } from "./commands/instruments";

const program = new Command();

program
  .name("signals-cli")
  .description("CLI for managing Signals instruments and PocketBase data")
  .version("1.0.0");

// Add commands
program.addCommand(createAuthCommand());
program.addCommand(createInstrumentsCommand());

// Parse arguments
program.parse();
