/**
 * API layer for instrument persistence.
 * Handles both local draft storage (localStorage) and cloud storage (PocketBase).
 */

import { pb } from "./pocketbase";
import type {
  InstrumentDefinition,
  InstrumentDraft,
  InstrumentSummary,
  InstrumentRecord,
} from "@/types/instruments";
import { toInstrumentSummary } from "@/types/instruments";

const DRAFTS_STORAGE_KEY = "instrument-drafts";

/**
 * Local draft management using localStorage
 */
export const draftStorage = {
  /**
   * List all local drafts
   */
  list(): InstrumentDraft[] {
    try {
      const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as InstrumentDraft[];
    } catch {
      return [];
    }
  },

  /**
   * Get a specific draft by ID
   */
  get(draftId: string): InstrumentDraft | null {
    const drafts = this.list();
    return drafts.find((d) => d.id === draftId) ?? null;
  },

  /**
   * Save a draft (creates or updates)
   */
  save(definition: InstrumentDefinition): InstrumentDraft {
    const drafts = this.list();
    const existingIndex = drafts.findIndex(
      (d) => d.definition.metadata.id === definition.metadata.id,
    );

    const draft: InstrumentDraft = {
      id: definition.metadata.id,
      definition,
      lastModified: new Date().toISOString(),
      isDraft: true,
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }

    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    return draft;
  },

  /**
   * Delete a draft
   */
  delete(draftId: string): void {
    const drafts = this.list().filter((d) => d.id !== draftId);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  },

  /**
   * Clear all drafts
   */
  clear(): void {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
  },
};

/**
 * Cloud instrument storage using PocketBase
 */
export const instrumentApi = {
  /**
   * Save a new instrument to the cloud
   */
  async save(definition: InstrumentDefinition): Promise<string> {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error("Not authenticated");

    const result = await pb.collection("instruments").create({
      userId,
      name: definition.metadata.name,
      description: definition.metadata.description,
      instrumentData: definition,
      isPublic: definition.metadata.isPublic ?? false,
      tags: definition.metadata.tags ?? [],
    });

    return result.id;
  },

  /**
   * Update an existing instrument
   */
  async update(
    recordId: string,
    definition: InstrumentDefinition,
  ): Promise<void> {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error("Not authenticated");

    await pb.collection("instruments").update(recordId, {
      name: definition.metadata.name,
      description: definition.metadata.description,
      instrumentData: definition,
      isPublic: definition.metadata.isPublic ?? false,
      tags: definition.metadata.tags ?? [],
    });
  },

  /**
   * Load an instrument by record ID
   */
  async load(recordId: string): Promise<InstrumentDefinition> {
    const record = (await pb
      .collection("instruments")
      .getOne(recordId)) as unknown as InstrumentRecord;

    return record.instrumentData;
  },

  /**
   * List current user's instruments
   */
  async listMine(): Promise<InstrumentSummary[]> {
    const userId = pb.authStore.model?.id;
    if (!userId) return [];

    try {
      const result = await pb.collection("instruments").getList(1, 100, {
        filter: `userId = "${userId}"`,
        sort: "-updated",
      });

      return result.items.map((record) => {
        const data = record.instrumentData as InstrumentDefinition;
        const summary = toInstrumentSummary(data);
        // Use PocketBase record ID for cloud instruments, not internal metadata ID
        return { ...summary, id: record.id };
      });
    } catch (error) {
      // Collection may not exist yet - return empty array
      console.warn("Could not load cloud instruments:", error);
      return [];
    }
  },

  /**
   * List public instruments (community library)
   */
  async listPublic(): Promise<InstrumentSummary[]> {
    try {
      const result = await pb.collection("instruments").getList(1, 100, {
        filter: "isPublic = true",
        sort: "-updated",
      });

      return result.items.map((record) => {
        const data = record.instrumentData as InstrumentDefinition;
        return {
          ...toInstrumentSummary(data),
          // Use PocketBase record ID for cloud instruments
          id: record.id,
          author: record.userId, // TODO: Expand to get author name
        };
      });
    } catch (error) {
      // Collection may not exist yet - return empty array
      console.warn("Could not load public instruments:", error);
      return [];
    }
  },

  /**
   * Search instruments by name or tags
   */
  async search(query: string): Promise<InstrumentSummary[]> {
    const userId = pb.authStore.model?.id;

    // Build filter: user's own instruments OR public instruments, matching query
    const filters = [];
    if (userId) {
      filters.push(`userId = "${userId}"`);
    }
    filters.push("isPublic = true");

    const ownershipFilter = `(${filters.join(" || ")})`;
    const searchFilter = `(name ~ "${query}" || description ~ "${query}")`;

    try {
      const result = await pb.collection("instruments").getList(1, 50, {
        filter: `${ownershipFilter} && ${searchFilter}`,
        sort: "-updated",
      });

      return result.items.map((record) => {
        const data = record.instrumentData as InstrumentDefinition;
        const summary = toInstrumentSummary(data);
        // Use PocketBase record ID for cloud instruments
        return { ...summary, id: record.id };
      });
    } catch (error) {
      // Collection may not exist yet - return empty array
      console.warn("Could not search instruments:", error);
      return [];
    }
  },

  /**
   * Delete an instrument
   */
  async delete(recordId: string): Promise<void> {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error("Not authenticated");

    await pb.collection("instruments").delete(recordId);
  },

  /**
   * Check if user owns an instrument
   */
  async isOwner(recordId: string): Promise<boolean> {
    const userId = pb.authStore.model?.id;
    if (!userId) return false;

    try {
      const record = await pb.collection("instruments").getOne(recordId);
      return record.userId === userId;
    } catch {
      return false;
    }
  },

  /**
   * Duplicate an instrument (fork)
   */
  async duplicate(recordId: string): Promise<string> {
    const original = await this.load(recordId);

    // Create a copy with new ID and updated metadata
    const copy: InstrumentDefinition = {
      ...original,
      metadata: {
        ...original.metadata,
        id: crypto.randomUUID(),
        name: `${original.metadata.name} (Copy)`,
        author: pb.authStore.model?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false, // Copies start as private
      },
      defaultConfig: {
        ...original.defaultConfig,
        instrumentId: crypto.randomUUID(),
      },
    };

    return this.save(copy);
  },
};

/**
 * Combined API for convenience
 */
export const instruments = {
  drafts: draftStorage,
  cloud: instrumentApi,

  /**
   * Get all available instruments (drafts + saved)
   * Returns combined list for toolbar display
   */
  async getAll(): Promise<{
    drafts: InstrumentDraft[];
    saved: InstrumentSummary[];
    public: InstrumentSummary[];
  }> {
    const drafts = draftStorage.list();
    const saved = await instrumentApi.listMine();
    const publicInstruments = await instrumentApi.listPublic();

    return {
      drafts,
      saved,
      public: publicInstruments,
    };
  },
};
