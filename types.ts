export type NodeType = 'folder' | 'file';

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  createdAt: number;
}

export interface FolderNode extends BaseNode {
  type: 'folder';
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string; // Markdown or plain text
  translatedContent?: string; // New field for translated content
  contentType: 'text' | 'video' | 'link';
  url?: string;
}

export type Node = FolderNode | FileNode;

export interface FileSystemState {
  nodes: Node[];
  currentPath: string[]; // IDs of parent folders
}