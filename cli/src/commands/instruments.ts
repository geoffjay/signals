/**
 * Instruments command for the CLI.
 * Handles listing, reading, creating, updating, and deleting instruments.
 */

import { Command } from "commander";
import { readFileSync, existsSync } from "fs";
import { pb, isAuthenticated, getCurrentUser } from "../client";
import type { InstrumentDefinition, InstrumentRecord } from "../types";
import { toInstrumentSummary } from "../types";

/**
 * Ensure user is authenticated before running a command
 */
function requireAuth(): void {
  if (!isAuthenticated()) {
    console.error("✗ Not authenticated. Run 'auth' first.");
    process.exit(1);
  }
}

/**
 * List instruments action
 */
async function listAction(options: { all?: boolean; public?: boolean; json?: boolean }): Promise<void> {
  requireAuth();

  try {
    const userId = getCurrentUser()?.id;
    let filter = "";

    if (options.public) {
      filter = "isPublic = true";
    } else if (options.all) {
      // All instruments the user can see
      filter = userId ? `userId = "${userId}" || isPublic = true` : "isPublic = true";
    } else {
      // Default: user's own instruments
      if (!userId) {
        console.error("✗ No user ID found");
        process.exit(1);
      }
      filter = `userId = "${userId}"`;
    }

    const result = await pb.collection("instruments").getList(1, 100, {
      filter,
      sort: "-updated",
    });

    if (options.json) {
      // Output raw JSON for programmatic use
      console.log(JSON.stringify(result.items, null, 2));
      return;
    }

    if (result.items.length === 0) {
      console.log("No instruments found.");
      return;
    }

    console.log(`Found ${result.items.length} instrument(s):\n`);

    for (const record of result.items) {
      const data = record.instrumentData as InstrumentDefinition;

      // Handle case where instrumentData might be malformed
      let summary;
      try {
        summary = toInstrumentSummary(data);
      } catch (e) {
        console.log(`  ID: ${record.id}`);
        console.log(`  Name: ${record.name || "Unknown"}`);
        console.log(`  ⚠ Malformed instrument data: ${e instanceof Error ? e.message : e}`);
        console.log("");
        continue;
      }

      console.log(`  ID: ${record.id}`);
      console.log(`  Name: ${summary.name}`);
      console.log(`  Description: ${summary.description || "(none)"}`);
      console.log(`  Inputs: ${summary.inputCount}, Outputs: ${summary.outputCount}`);
      console.log(`  Public: ${record.isPublic ? "Yes" : "No"}`);
      console.log(`  Tags: ${(record.tags as string[])?.join(", ") || "(none)"}`);
      console.log(`  Updated: ${record.updated}`);
      console.log("");
    }
  } catch (error) {
    console.error("✗ Failed to list instruments:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Read a single instrument action
 */
async function readAction(options: { id: string; json?: boolean; raw?: boolean }): Promise<void> {
  requireAuth();

  if (!options.id) {
    console.error("✗ Instrument ID is required. Use --id <id>");
    process.exit(1);
  }

  try {
    const record = await pb.collection("instruments").getOne(options.id) as unknown as InstrumentRecord;

    if (options.raw) {
      // Output the raw record including all PocketBase fields
      console.log(JSON.stringify(record, null, 2));
      return;
    }

    if (options.json) {
      // Output just the instrument data
      console.log(JSON.stringify(record.instrumentData, null, 2));
      return;
    }

    // Pretty print
    const data = record.instrumentData;
    console.log("Instrument Details:");
    console.log(`  Record ID: ${record.id}`);
    console.log(`  User ID: ${record.userId}`);
    console.log(`  Name: ${record.name}`);
    console.log(`  Description: ${record.description || "(none)"}`);
    console.log(`  Public: ${record.isPublic ? "Yes" : "No"}`);
    console.log(`  Tags: ${record.tags?.join(", ") || "(none)"}`);
    console.log(`  Created: ${record.created}`);
    console.log(`  Updated: ${record.updated}`);
    console.log("");
    console.log("Instrument Data:");
    console.log(`  Metadata ID: ${data.metadata.id}`);
    console.log(`  Version: ${data.metadata.version || "(none)"}`);
    console.log(`  Internal Nodes: ${data.internalNodes?.length || 0}`);
    console.log(`  Internal Edges: ${data.internalEdges?.length || 0}`);
    console.log(`  External Ports: ${data.externalPorts?.length || 0}`);
    console.log(`  Port Mappings: ${data.portMappings?.length || 0}`);

    // Show external ports if any
    if (data.externalPorts?.length > 0) {
      console.log("\n  External Ports:");
      for (const port of data.externalPorts) {
        console.log(`    - ${port.id}: ${port.label} (${port.type})`);
      }
    }
  } catch (error) {
    console.error("✗ Failed to read instrument:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Create a new instrument from a JSON file
 */
async function createAction(options: { file: string; public?: boolean }): Promise<void> {
  requireAuth();

  if (!options.file) {
    console.error("✗ File path is required. Use --file <path>");
    process.exit(1);
  }

  if (!existsSync(options.file)) {
    console.error(`✗ File not found: ${options.file}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(options.file, "utf-8");
    const definition = JSON.parse(content) as InstrumentDefinition;

    // Validate basic structure
    if (!definition.metadata?.name) {
      console.error("✗ Invalid instrument: metadata.name is required");
      process.exit(1);
    }

    if (!Array.isArray(definition.externalPorts)) {
      console.error("✗ Invalid instrument: externalPorts must be an array");
      process.exit(1);
    }

    if (!Array.isArray(definition.portMappings)) {
      console.error("✗ Invalid instrument: portMappings must be an array");
      process.exit(1);
    }

    const userId = getCurrentUser()?.id;
    if (!userId) {
      console.error("✗ No user ID found");
      process.exit(1);
    }

    // Ensure metadata has required fields
    if (!definition.metadata.id) {
      definition.metadata.id = crypto.randomUUID();
    }
    if (!definition.metadata.createdAt) {
      definition.metadata.createdAt = new Date().toISOString();
    }
    definition.metadata.updatedAt = new Date().toISOString();

    const isPublic = options.public ?? definition.metadata.isPublic ?? false;

    const result = await pb.collection("instruments").create({
      userId,
      name: definition.metadata.name,
      description: definition.metadata.description || "",
      instrumentData: definition,
      isPublic,
      tags: definition.metadata.tags || [],
    });

    console.log(`✓ Instrument created successfully`);
    console.log(`  ID: ${result.id}`);
    console.log(`  Name: ${definition.metadata.name}`);
  } catch (error) {
    console.error("✗ Failed to create instrument:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Update an existing instrument
 */
async function updateAction(options: { id: string; file?: string; public?: boolean }): Promise<void> {
  requireAuth();

  if (!options.id) {
    console.error("✗ Instrument ID is required. Use --id <id>");
    process.exit(1);
  }

  try {
    const updateData: Record<string, unknown> = {};

    if (options.file) {
      if (!existsSync(options.file)) {
        console.error(`✗ File not found: ${options.file}`);
        process.exit(1);
      }

      const content = readFileSync(options.file, "utf-8");
      const definition = JSON.parse(content) as InstrumentDefinition;

      // Validate
      if (!Array.isArray(definition.externalPorts)) {
        console.error("✗ Invalid instrument: externalPorts must be an array");
        process.exit(1);
      }

      definition.metadata.updatedAt = new Date().toISOString();

      updateData.name = definition.metadata.name;
      updateData.description = definition.metadata.description || "";
      updateData.instrumentData = definition;
      updateData.tags = definition.metadata.tags || [];

      if (options.public !== undefined) {
        updateData.isPublic = options.public;
      } else {
        updateData.isPublic = definition.metadata.isPublic ?? false;
      }
    } else if (options.public !== undefined) {
      updateData.isPublic = options.public;
    } else {
      console.error("✗ Nothing to update. Provide --file or --public");
      process.exit(1);
    }

    await pb.collection("instruments").update(options.id, updateData);

    console.log(`✓ Instrument ${options.id} updated successfully`);
  } catch (error) {
    console.error("✗ Failed to update instrument:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Delete an instrument
 */
async function deleteAction(options: { id: string; force?: boolean }): Promise<void> {
  requireAuth();

  if (!options.id) {
    console.error("✗ Instrument ID is required. Use --id <id>");
    process.exit(1);
  }

  try {
    // First get the instrument to show what we're deleting
    const record = await pb.collection("instruments").getOne(options.id);

    if (!options.force) {
      console.log(`About to delete instrument:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  Name: ${record.name}`);
      console.log("");
      console.log("Use --force to confirm deletion.");
      process.exit(0);
    }

    await pb.collection("instruments").delete(options.id);
    console.log(`✓ Instrument ${options.id} deleted successfully`);
  } catch (error) {
    console.error("✗ Failed to delete instrument:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Validate an instrument JSON file without creating it
 */
async function validateAction(options: { file: string }): Promise<void> {
  if (!options.file) {
    console.error("✗ File path is required. Use --file <path>");
    process.exit(1);
  }

  if (!existsSync(options.file)) {
    console.error(`✗ File not found: ${options.file}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(options.file, "utf-8");
    const definition = JSON.parse(content) as InstrumentDefinition;
    const errors: string[] = [];

    // Check required fields
    if (!definition.metadata) {
      errors.push("Missing 'metadata' object");
    } else {
      if (!definition.metadata.name?.trim()) {
        errors.push("metadata.name is required");
      }
      if (!definition.metadata.id) {
        errors.push("metadata.id is required (will be auto-generated on create)");
      }
    }

    if (!Array.isArray(definition.externalPorts)) {
      errors.push("externalPorts must be an array (can be empty)");
    }

    if (!Array.isArray(definition.portMappings)) {
      errors.push("portMappings must be an array (can be empty)");
    }

    if (!Array.isArray(definition.internalNodes)) {
      errors.push("internalNodes must be an array");
    }

    if (!Array.isArray(definition.internalEdges)) {
      errors.push("internalEdges must be an array");
    }

    if (typeof definition.nodeIdCounter !== "number") {
      errors.push("nodeIdCounter must be a number");
    }

    if (definition.defaultConfig === undefined) {
      errors.push("defaultConfig is required (can be empty object)");
    }

    if (errors.length > 0) {
      console.log("✗ Validation failed:");
      for (const error of errors) {
        console.log(`  - ${error}`);
      }
      process.exit(1);
    }

    console.log("✓ Instrument file is valid");
    console.log(`  Name: ${definition.metadata.name}`);
    console.log(`  Nodes: ${definition.internalNodes.length}`);
    console.log(`  Edges: ${definition.internalEdges.length}`);
    console.log(`  External Ports: ${definition.externalPorts.length}`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("✗ Invalid JSON:", error.message);
    } else {
      console.error("✗ Validation failed:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

/**
 * Create the instruments command
 */
export function createInstrumentsCommand(): Command {
  const instruments = new Command("instruments")
    .description("Manage instruments");

  instruments
    .command("list")
    .description("List instruments")
    .option("-a, --all", "Show all accessible instruments (own + public)")
    .option("-p, --public", "Show only public instruments")
    .option("--json", "Output as JSON")
    .action(listAction);

  instruments
    .command("read")
    .description("Read a single instrument")
    .requiredOption("--id <id>", "Instrument ID")
    .option("--json", "Output instrument data as JSON")
    .option("--raw", "Output raw record including PocketBase fields")
    .action(readAction);

  instruments
    .command("create")
    .description("Create a new instrument from a JSON file")
    .requiredOption("-f, --file <path>", "Path to instrument JSON file")
    .option("-p, --public", "Make the instrument public")
    .action(createAction);

  instruments
    .command("update")
    .description("Update an existing instrument")
    .requiredOption("--id <id>", "Instrument ID")
    .option("-f, --file <path>", "Path to updated instrument JSON file")
    .option("-p, --public [boolean]", "Set public visibility", (val) => val !== "false")
    .action(updateAction);

  instruments
    .command("delete")
    .description("Delete an instrument")
    .requiredOption("--id <id>", "Instrument ID")
    .option("--force", "Confirm deletion")
    .action(deleteAction);

  instruments
    .command("validate")
    .description("Validate an instrument JSON file without creating it")
    .requiredOption("-f, --file <path>", "Path to instrument JSON file")
    .action(validateAction);

  return instruments;
}
