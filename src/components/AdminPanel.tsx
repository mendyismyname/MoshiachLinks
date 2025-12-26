import React, { useState, useRef, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { Node, NodeType, FolderNode, FileNode } from '../types';
import { PLACEHOLDER_CONTENT_HEBREW, PLACEHOLDER_CONTENT_ENGLISH } from '../constants'; // Import placeholders
import { 
  X, 
  FolderPlus, 
  FilePlus, 
  AlertCircle, 
  Save, 
  Trash2, 
  Edit3, 
  Upload, 
  Plus, 
  Folder, 
  FileText, 
  Video, 
  Link, 
  Move,
  ChevronRight,
  ChevronDown,
  Home,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  currentFolderId: string | null; 
  onRefresh: () => void;
  editingNode?: Node | null; 
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentFolderId: initialFolderId, onRefresh, editingNode: propEditingNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isAdding, setIsAdding] = useState<NodeType | 'content' | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(propEditingNode || null); 
  const [content, setContent] = useState('');
  const [translatedContent, setTranslatedContent] = useState(''); 
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set()); 
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false); 

  const editorRef = useRef<HTMLDivElement>(null);
  const translatedEditorRef = useRef<HTMLDivElement>(null); 

  // Effect to load nodes and initialize expanded folders
  useEffect(() => {
    const fetchNodes = async () => {
      const fetchedNodes = await storageService.getNodes();
      setNodes(fetchedNodes);

      // Initialize expanded folders based on the initialFolderId and its ancestors
      setExpandedFolders(prev => {
        const newSet = new Set(prev); // Keep existing expanded state
        let current = initialFolderId;
        while (current) {
          newSet.add(current);
          const parent = fetchedNodes.find(n => n.id === current)?.parentId;
          current = parent;
        }
        return newSet;
      });
    };
    fetchNodes();
  }, [initialFolderId, onRefresh]); 

  // Effect to handle propEditingNode changes
  useEffect(() => {
    if (propEditingNode) {
      setEditingNode(propEditingNode);
      setName(propEditingNode.name);
      setContent(propEditingNode.type === 'file' ? propEditingNode.content : '');
      setTranslatedContent(propEditingNode.type === 'file' ? (propEditingNode as FileNode).translatedContent || '' : '');
      setUrl(propEditingNode.type === 'file' && propEditingNode.url ? propEditingNode.url : '');
      setIsAdding('content'); 
      setSelectedFolderId(propEditingNode.parentId);
    } else {
      setEditingNode(null);
      setIsAdding(null);
      setName('');
      setUrl('');
      setContent('');
      setTranslatedContent('');
      setError(null);
    }
  }, [propEditingNode]);


  const handlePaste = (e: React.ClipboardEvent, targetEditor: 'original' | 'translated') => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, html);
    if (targetEditor === 'original') {
      setContent(e.currentTarget.innerHTML);
    } else {
      setTranslatedContent(e.currentTarget.innerHTML);
    }
  };

  const processAndSaveFile = async (file: File, targetNodeId: string | null) => {
    setError(null);
    setIsProcessingFile(true);
    try {
      const { contentHtml, translatedContent: newTranslatedContent } = await fileService.processFileContent(file);
      
      const nodeName = file.name.replace(/\.[^/.]+$/, "");

      if (targetNodeId && editingNode && editingNode.id === targetNodeId) {
        // Update existing node
        await storageService.updateNode(targetNodeId, {
          name: nodeName,
          content: contentHtml,
          translatedContent: newTranslatedContent,
          contentType: 'text', 
          url: undefined, 
        });
      } else {
        // Add new node
        await storageService.addNode({ 
          name: nodeName, 
          type: 'file', 
          parentId: selectedFolderId,
          content: contentHtml, 
          translatedContent: newTranslatedContent,
          contentType: 'text', 
        });
      }
      
      onRefresh();
      setNodes(await storageService.getNodes()); 
      setName('');
      setUrl('');
      setContent('');
      setTranslatedContent('');
      setIsAdding(null);
      setEditingNode(null);
    } catch (err) {
      console.error("File processing or Supabase upload error:", err);
      setError("Error processing document: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      await processAndSaveFile(files[0], editingNode?.id || null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAndSaveFile(files[0], editingNode?.id || null);
    }
  };

  const handleAdd = async () => {
    if (!name) {
      setError("Name is required");
      return;
    }
    
    try {
      if (isAdding === 'folder') {
        await storageService.addNode({ 
          name, 
          type: 'folder', 
          parentId: selectedFolderId 
        });
      } else if (isAdding === 'file') {
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        const contentType = url ? (isYouTube ? 'video' : 'link') : 'text';
        
        await storageService.addNode({ 
          name, 
          type: 'file', 
          parentId: selectedFolderId,
          content: content || PLACEHOLDER_CONTENT_HEBREW, // Use placeholder if content is empty
          translatedContent: translatedContent || PLACEHOLDER_CONTENT_ENGLISH, // Use placeholder if translated content is empty
          contentType, 
          url: url || undefined,
        });
      } else if (isAdding === 'content' && editingNode) {
        await storageService.updateNode(editingNode.id, { 
          name, 
          content: content || PLACEHOLDER_CONTENT_HEBREW, 
          translatedContent: translatedContent || PLACEHOLDER_CONTENT_ENGLISH, 
          url: url || undefined 
        });
      }
      
      setName('');
      setUrl('');
      setContent('');
      setTranslatedContent('');
      setIsAdding(null);
      setEditingNode(null);
      onRefresh();
      setNodes(await storageService.getNodes()); 
    } catch (err) {
      setError("Error saving content: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEdit = (node: Node) => {
    setEditingNode(node);
    setName(node.name);
    setContent(node.type === 'file' ? node.content : '');
    setTranslatedContent(node.type === 'file' ? (node as FileNode).translatedContent || '' : '');
    setUrl(node.type === 'file' && node.url ? node.url : '');
    setIsAdding('content');
    setSelectedFolderId(node.parentId); 
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item and all its contents?")) {
      try {
        await storageService.deleteNode(id);
        onRefresh();
        setNodes(await storageService.getNodes()); 
      } catch (err) {
        setError("Error deleting content: " + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const moveNode = async (nodeId: string, newParentId: string | null) => {
    try {
      await storageService.updateNode(nodeId, { parentId: newParentId });
      onRefresh();
      setNodes(await storageService.getNodes()); 
    } catch (err) {
      setError("Error moving node: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDragStart = (e: React.DragEvent, node: Node) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (draggedNode) {
      if (draggedNode.type === 'folder') {
        const isChild = (parentId: string | null): boolean => {
          if (!parentId) return false;
          if (parentId === draggedNode.id) return true;
          const parent = nodes.find(n => n.id === parentId);
          return parent ? isChild(parent.parentId) : false;
        };
        
        if (targetFolderId === draggedNode.id || isChild(targetFolderId)) {
          setError("Cannot move folder into itself or its subfolders");
          setDraggedNode(null);
          return;
        }
      }
      
      await moveNode(draggedNode.id, targetFolderId);
    }
    
    setDraggedNode(null);
  };

  const renderFolderTree = (parentId: string | null, depth: number = 0) => {
    const folders = nodes
      .filter(n => n.type === 'folder' && n.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name)) as FolderNode[];
      
    const files = nodes
      .filter(n => n.type === 'file' && n.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name)) as FileNode[];

    return (
      <div className="ml-4">
        {folders.map(folder => (
          <div key={folder.id} className="mb-1 group"> 
            <div 
              className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                selectedFolderId === folder.id ? 'bg-blue-50 border border-blue-200' : ''
              } ${dragOverFolder === folder.id ? 'bg-blue-100 border border-blue-300' : ''}`}
              onClick={() => setSelectedFolderId(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, folder)}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="mr-1 p-1 rounded hover:bg-gray-200"
              >
                {expandedFolders.has(folder.id) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </button>
              
              <Folder className="w-5 h-5 text-blue-500 mr-2" />
              <span className="flex-1 truncate">{folder.name.split('|')[0].trim()}</span>
              
              <div className="flex gap-1"> {/* Removed opacity-0 group-hover:opacity-100 */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(folder); }}
                  className="p-1 text-gray-500 hover:text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(folder.id); }}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {expandedFolders.has(folder.id) && (
              <div className="ml-4 border-l-2 border-gray-200 pl-2 py-1">
                {renderFolderTree(folder.id, depth + 1)}
              </div>
            )}
          </div>
        ))}
        
        {files.map(file => (
          <div 
            key={file.id}
            className={`flex items-center p-2 rounded-lg mb-1 hover:bg-gray-100 group ${ 
              dragOverFolder === file.id ? 'bg-blue-100 border border-blue-300' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, file)}
          >
            <div className="w-6"></div>
            {file.contentType === 'video' ? 
              <Video className="w-5 h-5 text-emerald-500 mr-2" /> : 
              file.contentType === 'link' ? 
                <Link className="w-5 h-5 text-purple-500 mr-2" /> : 
                <FileText className="w-5 h-5 text-gray-500 mr-2" />
            }
            <span className="flex-1 truncate">{file.name.split('|')[0].trim()}</span>
            
            <div className="flex gap-1"> {/* Removed opacity-0 group-hover:opacity-100 */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(file); }}
                className="p-1 text-gray-500 hover:text-blue-600"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                className="p-1 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Content Structure</h3>
            <div 
              className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                selectedFolderId === null ? 'bg-blue-50 border border-blue-200' : ''
              } ${dragOverFolder === null ? 'bg-blue-100 border border-blue-300' : ''}`}
              onClick={() => setSelectedFolderId(null)}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
            >
              <div className="flex items-center">
                <Home className="w-5 h-5 text-gray-500 mr-2" />
                <span>Root</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {renderFolderTree(null)}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedFolderId 
                    ? nodes.find(n => n.id === selectedFolderId)?.name.split('|')[0].trim() || 'Selected Folder' 
                    : 'Root Directory'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedFolderId ? 'Managing contents of selected folder' : 'Managing root contents'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsAdding('folder'); setEditingNode(null); setName(''); setUrl(''); setContent(''); setTranslatedContent(''); setError(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
                <button 
                  onClick={() => { setIsAdding('file'); setEditingNode(null); setName(''); setUrl(''); setContent(''); setTranslatedContent(''); setError(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FilePlus className="w-4 h-4" />
                  New Entry
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            
            {!isAdding ? (
              <div className="space-y-6">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={handleFileDrop}
                >
                  {isProcessingFile ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                      <p className="text-blue-600 font-medium">Processing and translating file...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Upload DOCX Files</h3>
                      <p className="text-gray-500 mb-4">Drag and drop files here or click to browse</p>
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                        Choose Files
                        <input 
                          type="file" 
                          accept=".docx" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nodes
                    .filter(n => n.parentId === selectedFolderId)
                    .sort((a, b) => {
                      if (a.type === b.type) return a.name.localeCompare(b.name);
                      return a.type === 'folder' ? -1 : 1;
                    })
                    .map(node => (
                      <div 
                        key={node.id} 
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            {node.type === 'folder' ? (
                              <Folder className="w-6 h-6 text-blue-500 mt-0.5 mr-3" />
                            ) : (node as FileNode).contentType === 'video' ? (
                              <Video className="w-6 h-6 text-emerald-500 mt-0.5 mr-3" />
                            ) : (node as FileNode).contentType === 'link' ? (
                              <Link className="w-6 h-6 text-purple-500 mt-0.5 mr-3" />
                            ) : (
                              <FileText className="w-6 h-6 text-gray-500 mt-0.5 mr-3" />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">{node.name.split('|')[0].trim()}</h4>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {node.type === 'file' 
                                  ? (node as FileNode).content.replace(/<[^>]*>?/gm, '').slice(0, 80) + '...' 
                                  : 'Folder'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-1"> {/* Removed opacity-0 group-hover:opacity-100 */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(node); }}
                              className="p-1 text-gray-500 hover:text-blue-600"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
                              className="p-1 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {node.type === 'folder' ? 'Folder' : (node as FileNode).contentType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(node.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                
                {nodes.filter(n => n.parentId === selectedFolderId).length === 0 && (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">This folder is empty</h3>
                    <p className="text-gray-500 mb-4">Add content by creating new entries or uploading files</p>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => { setIsAdding('folder'); setEditingNode(null); setName(''); setUrl(''); setContent(''); setTranslatedContent(''); setError(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FolderPlus className="w-4 h-4" />
                        New Folder
                      </button>
                      <button 
                        onClick={() => { setIsAdding('file'); setEditingNode(null); setName(''); setUrl(''); setContent(''); setTranslatedContent(''); setError(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <FilePlus className="w-4 h-4" />
                        New Entry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  {editingNode ? 'Edit Content' : isAdding === 'folder' ? 'Create New Folder' : 'Create New Entry'}
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter name..."
                    />
                  </div>
                  
                  {isAdding === 'file' || (isAdding === 'content' && editingNode?.type === 'file') ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL (Optional)</label>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com"
                        />
                        <p className="mt-1 text-sm text-gray-500">Leave blank for text content, add YouTube link for videos</p>
                      </div>
                      
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={handleFileDrop}
                      >
                        {isProcessingFile ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                            <p className="text-blue-600 font-medium">Processing and translating file...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload DOCX File to Update/Create</h3>
                            <p className="text-gray-500 mb-4">Drag and drop files here or click to browse</p>
                            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                              Choose File
                              <input 
                                type="file" 
                                accept=".docx" 
                                onChange={handleFileUpload} 
                                className="hidden" 
                              />
                            </label>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Original Content</label>
                        <div 
                          ref={editorRef}
                          contentEditable
                          onPaste={(e) => handlePaste(e, 'original')}
                          className="w-full min-h-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: content }}
                          onInput={(e) => setContent(e.currentTarget.innerHTML)}
                        />
                        <p className="mt-1 text-sm text-gray-500">Paste formatted text or type content here</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Translated Content (Optional)</label>
                        <div 
                          ref={translatedEditorRef}
                          contentEditable
                          onPaste={(e) => handlePaste(e, 'translated')}
                          className="w-full min-h-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: translatedContent }}
                          onInput={(e) => setTranslatedContent(e.currentTarget.innerHTML)}
                        />
                        <p className="mt-1 text-sm text-gray-500">Automatically generated for DOCX uploads, can be manually edited.</p>
                      </div>
                    </>
                  ) : null}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAdd}
                      className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
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
                        setTranslatedContent('');
                      }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};