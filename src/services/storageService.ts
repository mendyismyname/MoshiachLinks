import { supabase } from '../integrations/supabase/client';
import { Node, NodeType, FolderNode, FileNode } from '../types';
import { INITIAL_DATA } from '../constants';

const LOCAL_STORAGE_KEY = 'moshiach_links_fs_v3';
const MIGRATION_KEY = 'moshiach_links_migrated_to_supabase';

export const storageService = {
  // Fetches all nodes from Supabase. If local storage has data and hasn't been migrated, it migrates it.
  getNodes: async (): Promise<Node[]> => {
    const hasMigrated = localStorage.getItem(MIGRATION_KEY);

    if (!hasMigrated) {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const nodesToMigrate: Node[] = JSON.parse(localData);
        console.log("Migrating existing local data to Supabase...", nodesToMigrate);
        await storageService.migrateNodesToSupabase(nodesToMigrate);
        localStorage.setItem(MIGRATION_KEY, 'true');
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear local storage after migration
      } else {
        // If no local data, but also no migration flag, seed initial data from constants
        console.log("No local data found, seeding initial data from constants to Supabase...");
        await storageService.migrateNodesToSupabase(INITIAL_DATA);
        localStorage.setItem(MIGRATION_KEY, 'true');
      }
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Error fetching nodes from Supabase:", error);
      return [];
    }
    return data as Node[];
  },

  // Helper to migrate nodes to Supabase
  migrateNodesToSupabase: async (nodes: Node[]) => {
    // Filter out nodes that might already exist if this is a partial migration or retry
    const existingSupabaseNodes = (await supabase.from('documents').select('id')).data?.map(n => n.id) || [];
    const newNodes = nodes.filter(node => !existingSupabaseNodes.includes(node.id));

    if (newNodes.length > 0) {
      const { error } = await supabase
        .from('documents')
        .insert(newNodes.map(node => ({
          ...node,
          createdAt: new Date(node.createdAt).toISOString(), // Ensure ISO string format
          parentId: node.parentId || null, // Ensure parentId is null if undefined
        })));

      if (error) {
        console.error("Error migrating nodes to Supabase:", error);
        throw error;
      }
      console.log(`Successfully migrated ${newNodes.length} nodes to Supabase.`);
    } else {
      console.log("No new nodes to migrate or all nodes already exist in Supabase.");
    }
  },
  
  // Adds a new node to Supabase
  addNode: async (node: Omit<FolderNode, 'id' | 'createdAt'> | Omit<FileNode, 'id' | 'createdAt'>): Promise<Node> => {
    const newNode = {
      ...node,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(), // Ensure ISO string format
      parentId: node.parentId || null, // Ensure parentId is null if undefined
    } as Node;

    const { data, error } = await supabase
      .from('documents')
      .insert([newNode])
      .select();

    if (error) {
      console.error("Error adding node to Supabase:", error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error("Failed to add node to Supabase.");
    }
    return data[0] as Node;
  },
  
  // Deletes a node and its children from Supabase
  deleteNode: async (id: string) => {
    // Supabase's CASCADE DELETE on parentId handles children automatically
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting node from Supabase:", error);
      throw error;
    }
  },
  
  // Updates an existing node in Supabase
  updateNode: async (id: string, updates: Partial<Node>) => {
    const { error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(), // Add an updatedAt timestamp
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating node in Supabase:", error);
      throw error;
    }
  }
};