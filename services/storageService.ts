
import { Node, NodeType, FolderNode, FileNode, AppSettings } from '../types';
import { INITIAL_DATA } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'moshiach_links_fs_v4';
const SETTINGS_KEY = 'moshiach_links_settings';

let supabaseInstance: SupabaseClient | null = null;

export const storageService = {
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    const defaults: AppSettings = { 
      supabaseUrl: '', 
      supabaseKey: '', 
      adminPasscode: '770',
      translationTone: 'scholarly', 
      translationComplexity: 'detailed' 
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    supabaseInstance = null; // Reset client on settings change
  },

  getSupabase: (): SupabaseClient | null => {
    if (supabaseInstance) return supabaseInstance;
    const settings = storageService.getSettings();
    if (settings.supabaseUrl && settings.supabaseKey) {
      try {
        supabaseInstance = createClient(settings.supabaseUrl, settings.supabaseKey);
        return supabaseInstance;
      } catch (e) {
        console.error("Supabase Client Init Failed", e);
        return null;
      }
    }
    return null;
  },

  getNodes: async (): Promise<Node[]> => {
    const sb = storageService.getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('nodes').select('*').order('createdAt', { ascending: true });
        if (!error && data) {
          storageService.saveNodesLocal(data as Node[]);
          return data as Node[];
        } else if (error) {
          console.warn("Supabase Fetch Error (falling back to local):", error.message);
        }
      } catch (e) {
        console.warn("Supabase connection issue (falling back to local):", e);
      }
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(data);
  },

  saveNodesLocal: (nodes: Node[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  },

  addNode: async (node: Omit<FolderNode, 'id' | 'createdAt'> | Omit<FileNode, 'id' | 'createdAt'>): Promise<Node> => {
    const nodes = await storageService.getNodes();
    const newNode = {
      ...node,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    } as Node;

    const sb = storageService.getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('nodes').insert(newNode);
        if (error) console.error("Supabase Real-time Sync (Insert) Failed:", error.message);
      } catch (e) {
        console.error("Supabase Real-time Sync (Insert) Exception:", e);
      }
    }

    const updated = [...nodes, newNode];
    storageService.saveNodesLocal(updated);
    return newNode;
  },

  deleteNode: async (id: string) => {
    const nodes = await storageService.getNodes();
    const getIdsToDelete = (nodeId: string): string[] => {
      const children = nodes.filter(n => n.parentId === nodeId);
      return [nodeId, ...children.flatMap(c => getIdsToDelete(c.id))];
    };
    const idsToDelete = getIdsToDelete(id);

    const sb = storageService.getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('nodes').delete().in('id', idsToDelete);
        if (error) console.error("Supabase Real-time Sync (Delete) Failed:", error.message);
      } catch (e) {
        console.error("Supabase Real-time Sync (Delete) Exception:", e);
      }
    }

    const updated = nodes.filter(n => !idsToDelete.includes(n.id));
    storageService.saveNodesLocal(updated);
  },

  updateNode: async (id: string, updates: Partial<Node>) => {
    const nodes = await storageService.getNodes();
    
    const sb = storageService.getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('nodes').update(updates).eq('id', id);
        if (error) console.error("Supabase Real-time Sync (Update) Failed:", error.message);
      } catch (e) {
        console.error("Supabase Real-time Sync (Update) Exception:", e);
      }
    }

    const updated = nodes.map(n => n.id === id ? { ...n, ...updates } : n) as Node[];
    storageService.saveNodesLocal(updated);
  },

  moveNode: async (id: string, newParentId: string | null) => {
    const nodes = await storageService.getNodes();
    const getDescendants = (nodeId: string): string[] => {
      return nodes.filter(n => n.parentId === nodeId).flatMap(c => [c.id, ...getDescendants(c.id)]);
    };
    if (id === newParentId || getDescendants(id).includes(newParentId || '')) {
      alert("Invalid move destination.");
      return;
    }

    const sb = storageService.getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('nodes').update({ parentId: newParentId }).eq('id', id);
        if (error) console.error("Supabase Real-time Sync (Move) Failed:", error.message);
      } catch (e) {
        console.error("Supabase Real-time Sync (Move) Exception:", e);
      }
    }

    const updated = nodes.map(n => n.id === id ? { ...n, parentId: newParentId } : n) as Node[];
    storageService.saveNodesLocal(updated);
  },

  syncToCloud: async () => {
    const sb = storageService.getSupabase();
    if (!sb) throw new Error("Supabase is not configured in settings.");
    
    const localNodes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (localNodes.length === 0) throw new Error("No local data found to sync.");

    const { error } = await sb.from('nodes').upsert(localNodes, { onConflict: 'id' });
    if (error) throw new Error(`Supabase Upsert Failed: ${error.message}`);
  },

  getSchemaSQL: () => {
    return `
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "parentId" UUID REFERENCES nodes(id) ON DELETE CASCADE,
  "createdAt" BIGINT NOT NULL,
  "contentEn" TEXT,
  "contentHe" TEXT,
  "contentType" TEXT,
  "url" TEXT,
  "isTranslating" BOOLEAN DEFAULT FALSE
);

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Full Access" ON nodes FOR ALL USING (true) WITH CHECK (true);
    `.trim();
  }
};
