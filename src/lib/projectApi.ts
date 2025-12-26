import { pb } from './pocketbase';
import type { Node, Edge } from '@xyflow/react';

export interface ProjectData {
  nodes: Node[];
  edges: Edge[];
  nodeIdCounter: number;
  selectedNodeId: string | null;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends ProjectMetadata {
  projectData: ProjectData;
}

export const projectApi = {
  /**
   * Save a new project
   */
  async save(name: string, data: ProjectData, description?: string): Promise<string> {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('Not authenticated');

    const result = await pb.collection('projects').create({
      userId,
      name,
      description: description || '',
      projectData: data,
      isPublic: false,
    });

    return result.id;
  },

  /**
   * Update an existing project
   */
  async update(
    projectId: string,
    name: string,
    data: ProjectData,
    description?: string
  ): Promise<void> {
    await pb.collection('projects').update(projectId, {
      name,
      description: description || '',
      projectData: data,
    });
  },

  /**
   * Load a project by ID
   */
  async load(projectId: string): Promise<Project> {
    const project = await pb.collection('projects').getOne(projectId);

    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      thumbnail: project.thumbnail,
      createdAt: project.created,
      updatedAt: project.updated,
      projectData: project.projectData,
    };
  },

  /**
   * List all projects for the current user
   */
  async list(): Promise<ProjectMetadata[]> {
    const userId = pb.authStore.model?.id;
    if (!userId) return [];

    const result = await pb.collection('projects').getList(1, 50, {
      filter: `userId = "${userId}"`,
      sort: '-updated',
    });

    return result.items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      thumbnail: p.thumbnail,
      createdAt: p.created,
      updatedAt: p.updated,
    }));
  },

  /**
   * Delete a project
   */
  async delete(projectId: string): Promise<void> {
    await pb.collection('projects').delete(projectId);
  },

  /**
   * Check if user owns a project
   */
  async isOwner(projectId: string): Promise<boolean> {
    const userId = pb.authStore.model?.id;
    if (!userId) return false;

    try {
      const project = await pb.collection('projects').getOne(projectId);
      return project.userId === userId;
    } catch {
      return false;
    }
  },
};
