import { supabase } from '../integrations/supabase/client';
import { Node, NodeType, FolderNode, FileNode } from '../types';
import { PLACEHOLDER_CONTENT_HEBREW, PLACEHOLDER_CONTENT_ENGLISH } from '../constants'; // Import placeholders

const LOCAL_STORAGE_KEY = 'moshiach_links_fs_v3';
const MIGRATION_KEY = 'moshiach_links_migrated_to_supabase';

export const storageService = {
  // Fetches all nodes from Supabase.
  getNodes: async (): Promise<Node[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Error fetching nodes from Supabase:", error);
      return [];
    }
    return data.map(item => ({
      ...item,
      translatedContent: item.translated_content, // Map translated_content from DB to translatedContent in type
      createdAt: new Date(item.createdAt).getTime(), // Ensure createdAt is a number
    })) as Node[];
  },

  // Adds a new node to Supabase
  addNode: async (node: Omit<FolderNode, 'id' | 'createdAt'> | Omit<FileNode, 'id' | 'createdAt'>): Promise<Node> => {
    const newNode = {
      ...node,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(), // Ensure ISO string format
      parentId: node.parentId || null, // Ensure parentId is null if undefined
    } as Node;

    // If it's a file node and content is empty, set placeholders
    if (newNode.type === 'file') {
      const fileNode = newNode as FileNode;
      if (!fileNode.content) {
        fileNode.content = PLACEHOLDER_CONTENT_HEBREW;
      }
      if (!fileNode.translatedContent) {
        fileNode.translatedContent = PLACEHOLDER_CONTENT_ENGLISH;
      }
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          ...newNode,
          translated_content: (newNode as FileNode).translatedContent || null, // Map translatedContent to DB column
        }
      ])
      .select();

    if (error) {
      console.error("Error adding node to Supabase:", error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error("Failed to add node to Supabase.");
    }
    return {
      ...data[0],
      translatedContent: data[0].translated_content,
      createdAt: new Date(data[0].createdAt).getTime(),
    } as Node;
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
    const updatePayload: any = {
      ...updates,
      updatedAt: new Date().toISOString(), // Add an updatedAt timestamp
    };
    if ('translatedContent' in updates) {
      updatePayload.translated_content = updates.translatedContent;
      delete updatePayload.translatedContent; // Remove frontend field before sending to DB
    }

    const { error } = await supabase
      .from('documents')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating node in Supabase:", error);
      throw error;
    }
  }
};