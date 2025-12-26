import { Node, NodeType, FolderNode, FileNode } from '../types';
import { INITIAL_DATA } from '../constants';

const STORAGE_KEY = 'moshiach_links_fs_v3';

export const storageService = {
  getNodes: (): Node[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(data);
  },
  
  saveNodes: (nodes: Node[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  },
  
  addNode: (node: Omit<FolderNode, 'id' | 'createdAt'> | Omit<FileNode, 'id' | 'createdAt'>): Node => {
    const nodes = storageService.getNodes();
    const newNode = {
      ...node,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    } as Node;
    
    const updated = [...nodes, newNode];
    storageService.saveNodes(updated);
    return newNode;
  },
  
  deleteNode: (id: string) => {
    const nodes = storageService.getNodes();
    const getIdsToDelete = (nodeId: string): string[] => {
      const children = nodes.filter(n => n.parentId === nodeId);
      return [nodeId, ...children.flatMap(c => getIdsToDelete(c.id))];
    };
    
    const idsToDelete = getIdsToDelete(id);
    const updated = nodes.filter(n => !idsToDelete.includes(n.id));
    storageService.saveNodes(updated);
  },
  
  updateNode: (id: string, updates: Partial<Node>) => {
    const nodes = storageService.getNodes();
    const updated = nodes.map(n => n.id === id ? { ...n, ...updates } : n) as Node[];
    storageService.saveNodes(updated);
  }
};