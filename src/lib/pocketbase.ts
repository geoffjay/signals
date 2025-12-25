import PocketBase from 'pocketbase';

// Environment variable with fallback for development
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create singleton instance
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation to prevent issues with React Strict Mode
pb.autoCancellation(false);

// Export type for PocketBase user record
export interface PBUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  verified: boolean;
  created: string;
  updated: string;
}
