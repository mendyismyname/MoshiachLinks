import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { Node, NodeType, FolderNode, FileNode } from '../types';
import { X, FolderPlus, FilePlus, AlertCircle, Save, Trash2, Edit3, Upload, Plus, Folder, FileText, Video, Link } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  currentFolderId: string | null;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentFolderId, onRefresh }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isAdding, setIsAdding] = useState<NodeType | 'content' | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [content, setContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);

  useEffect(() => {
    setNodes(storageService.getNodes());
    setSelectedFolderId(currentFolderId);
  }, [currentFolderId]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, html);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      const file = files[0];
      setName(file.name.replace(/\.[^/.]+$/, ""));
      setIsAdding('file');
      
      try {
        await fileService.processFile(file, selectedFolderId);
        onRefresh();
        setNodes(storageService.getNodes());
        setName('');
        setUrl('');
        setIsAdding(null);
      } catch (err) {
        setError("Error processing document.");
      }
    }
  };

  const handleAdd = () => {
    if (!name) {
      setError("Name is required");
      return;
    }

    try {
      if (isAdding === 'folder') {
        storageService.addNode({
          name,
          type: 'folder',
          parentId: selectedFolderId
        });
      } else if (isAdding === 'file') {
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        const contentType = url ? (isYouTube ? 'video' : 'link') : 'text';
        
        storageService.addNode({
          name,
          type: 'file',
          parentId: selectedFolderId,
          content: content || '',
          contentType,
          url: url || undefined,
        });
      } else if (isAdding === 'content') {
        // Update existing content
        if (editingNode && editingNode.type === 'file') {
          storageService.updateNode(editingNode.id, {
            name,
            content,
            url: url || undefined
          });
        }
      }
      
      setName('');
      setUrl('');
      setContent('');
      setIsAdding(null);
      setEditingNode(null);
      onRefresh();
      setNodes(storageService.getNodes());
    } catch (err) {
      setError("Error saving content.");
    }
  };

  const handleEdit = (node: Node) => {
    setEditingNode(node);
    setName(node.name);
    setContent(node.type === 'file' ? node.content : '');
    setUrl(node.type === 'file' && node.url ? node.url : '');
    setIsAdding('content');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item and all its contents?")) {
      storageService.deleteNode(id);
      onRefresh();
      setNodes(storageService.getNodes());
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setName(file.name.replace(/\.[^/.]+$/, ""));
      setIsAdding('file');
      
      try {
        await fileService.processFile(file, selectedFolderId);
        onRefresh();
        setNodes(storageService.getNodes());
        setName('');
        setUrl('');
        setIsAdding(null);
      } catch (err) {
        setError("Error processing document.");
      }
    }
  };

  const folders = nodes.filter(n => n.type === 'folder') as FolderNode[];
  const files = nodes.filter(n => n.type === 'file') as FileNode[];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }} 
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        className={`w-full max-w-6xl bg-white border border-black/10 rounded-[3rem] overflow-hidden shadow-2xl transition-all ${dragActive ? 'scale-[1.02] border-blue-500 bg-blue-50/30' : ''}`}
      >
        <div className="flex items-center justify-between p-8 border-b border-black/5 bg-gray-50/50">
          <h2 className="text-2xl font-serif text-gray-900">Admin Portal</h2>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-black/5 rounded-full transition-colors text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-10 max-h-[80vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {!isAdding ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setIsAdding('folder')}
                  className="flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-white hover:shadow-xl border border-dashed border-gray-200 rounded-[2.5rem] transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FolderPlus className="w-8 h-8" />
                  </div>
                  <span className="font-serif text-xl">New Collection</span>
                </button>
                
                <button 
                  onClick={() => setIsAdding('file')}
                  className="flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-white hover:shadow-xl border border-dashed border-gray-200 rounded-[2.5rem] transition-all group"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FilePlus className="w-8 h-8" />
                  </div>
                  <span className="font-serif text-xl">New Entry</span>
                </button>
                
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem]">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8 text-purple-500" />
                  </div>
                  <span className="font-serif text-xl mb-4">Upload DOCX</span>
                  <label className="px-6 py-3 bg-purple-600 text-white rounded-full font-bold text-sm cursor-pointer hover:bg-purple-700 transition-colors">
                    Choose File
                    <input 
                      type="file" 
                      accept=".docx" 
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div className="border-t border-black/5 pt-10">
                <h3 className="text-xl font-serif mb-6">Content Structure</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Parent Folder</label>
                  <select
                    value={selectedFolderId || ''}
                    onChange={(e) => setSelectedFolderId(e.target.value || null)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                  >
                    <option value="">Root (No Parent)</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name.split('|')[0].trim()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {folders.filter(f => f.parentId === selectedFolderId).map(folder => (
                    <div key={folder.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <Folder className="w-6 h-6 text-blue-500" />
                        <div>
                          <div className="font-medium">{folder.name.split('|')[0].trim()}</div>
                          <div className="text-sm text-gray-500">{folder.name.split('|')[1]?.trim() || ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(folder)}
                          className="p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(folder.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {files.filter(f => f.parentId === selectedFolderId).map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        {file.contentType === 'video' ? 
                          <Video className="w-6 h-6 text-emerald-500" /> : 
                          file.contentType === 'link' ? 
                            <Link className="w-6 h-6 text-purple-500" /> : 
                            <FileText className="w-6 h-6 text-gray-500" />
                        }
                        <div>
                          <div className="font-medium">{file.name.split('|')[0].trim()}</div>
                          <div className="text-sm text-gray-500">{file.name.split('|')[1]?.trim() || ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(file)}
                          className="p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(file.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold">Document Title</label>
                <input 
                  autoFocus 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-2xl font-serif"
                  placeholder="Title..."
                />
              </div>
              
              {isAdding === 'file' && (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold">Primary Reference (URL)</label>
                    <input 
                      type="text" 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold">Content Narrative</label>
                    <div 
                      ref={editorRef}
                      contentEditable
                      onPaste={handlePaste}
                      className="w-full min-h-[350px] bg-gray-50 border border-gray-100 rounded-[2rem] px-8 py-8 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all rich-text-content overflow-y-auto text-gray-800 text-lg font-light leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: content }}
                      onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleAdd}
                  className="flex-[2] bg-black text-white font-bold py-5 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingNode ? 'Update' : 'Save'} Content
                </button>
                
                <button 
                  onClick={() => {
                    setIsAdding(null);
                    setEditingNode(null);
                    setError(null);
                    setName('');
                    setUrl('');
                    setContent('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-5 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};