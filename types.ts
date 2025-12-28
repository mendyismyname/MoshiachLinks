
export type NodeType = 'folder' | 'file';
export type FileContentType = 'text' | 'video' | 'link' | 'book';

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
  contentEn: string;
  contentHe?: string;
  contentType: FileContentType;
  url?: string;
  isTranslating?: boolean;
}

export type Node = FolderNode | FileNode;

export interface FileSystemState {
  nodes: Node[];
  currentPath: string[];
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseKey: string;
  adminPasscode: string;
  translationTone: 'scholarly' | 'literal' | 'modern';
  translationComplexity: 'detailed' | 'concise';
}
