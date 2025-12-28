
import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { translationService } from '../services/translationService';
import { Node, FileNode, FolderNode, FileContentType, AppSettings, NodeType } from '../types';
import { 
  X, FolderPlus, FilePlus, Trash2, Edit3, Move, 
  ArrowLeft, Loader2, Save, Video, Link as LinkIcon, 
  BookOpen, FileText, Lock, ChevronRight, ChevronDown, 
  Languages, Upload, Eye, Folder, Settings as SettingsIcon, CloudUpload, Database, Copy, Check, Plus, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPanelProps {
  onClose: () => void;
  onRefresh: () => void;
}

const FolderTreeItem: React.FC<{
  node: FolderNode;
  nodes: Node[];
  depth: number;
  currentFolder: string | null;
  onSelect: (id: string | null) => void;
}> = ({ node, nodes, depth, currentFolder, onSelect }) => {
  const [isOpen, setIsOpen] = useState(true);
  const children = nodes.filter(n => n.parentId === node.id && n.type === 'folder') as FolderNode[];
  const isSelected = currentFolder === node.id;

  return (
    <div className="space-y-1">
      <button 
        onClick={() => onSelect(node.id)}
        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2 group transition-all ${
          isSelected ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-200' : 'hover:bg-black/5 text-gray-500'
        }`}
        style={{ paddingLeft: `${depth * 1 + 0.75}rem` }}
      >
        <span 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`p-1 rounded transition-colors ${isSelected ? 'hover:bg-white/20' : 'hover:bg-black/5'}`}
        >
          {children.length > 0 ? (
            isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : <div className="w-3 h-3" />}
        </span>
        <span className="truncate">{node.name.split('|')[0]}</span>
      </button>
      
      {isOpen && children.length > 0 && (
        <div className="space-y-1">
          {children.map(child => (
            <FolderTreeItem 
              key={child.id} 
              node={child} 
              nodes={nodes} 
              depth={depth + 1} 
              currentFolder={currentFolder} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsPanel: React.FC<{ onSync: () => void }> = ({ onSync }) => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = () => {
    storageService.saveSettings(settings);
    alert("Settings updated successfully.");
  };

  const handleSyncToCloud = async () => {
    if (!settings.supabaseUrl || !settings.supabaseKey) {
      alert("Please configure Supabase settings first.");
      return;
    }
    setIsSyncing(true);
    try {
      await storageService.syncToCloud();
      alert("Local data successfully synced to cloud!");
      onSync();
    } catch (err: any) {
      alert(err.message);
    }
    setIsSyncing(false);
  };

  const copySQL = () => {
    navigator.clipboard.writeText(storageService.getSchemaSQL());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-12 max-w-5xl mx-auto space-y-16 pb-32">
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
           <h3 className="text-3xl font-serif italic flex items-center gap-3"><KeyRound className="w-8 h-8 text-amber-600" /> Security Settings</h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Admin Panel Passcode</label>
            <input 
              type="text" 
              value={settings.adminPasscode} 
              onChange={e => setSettings({ ...settings, adminPasscode: e.target.value })} 
              className="w-full p-5 bg-gray-50 border-none rounded-[2rem] outline-none font-mono text-xl focus:ring-2 ring-blue-100 transition-all" 
              placeholder="770" 
            />
            <p className="text-[10px] text-gray-400 italic">This code will be required whenever you open the Management Console.</p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
           <h3 className="text-3xl font-serif italic flex items-center gap-3"><Languages className="w-8 h-8 text-blue-600" /> Translation AI Settings</h3>
           <p className="text-[10px] font-mono text-gray-400">GEMINI POWERED</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Translation Tone</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
              {(['scholarly', 'literal', 'modern'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setSettings({ ...settings, translationTone: t })}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${settings.translationTone === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Detail Level</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
              {(['detailed', 'concise'] as const).map(c => (
                <button 
                  key={c}
                  onClick={() => setSettings({ ...settings, translationComplexity: c })}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${settings.translationComplexity === c ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
           <h3 className="text-3xl font-serif italic flex items-center gap-3"><CloudUpload className="w-8 h-8 text-emerald-600" /> Supabase Connection</h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Project URL</label>
            <input value={settings.supabaseUrl} onChange={e => setSettings({ ...settings, supabaseUrl: e.target.value })} className="w-full p-5 bg-gray-50 border-none rounded-[2rem] outline-none font-mono text-sm focus:ring-2 ring-blue-100 transition-all" placeholder="https://yourproject.supabase.co" />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">API Key (Service/Anon)</label>
            <input type="password" value={settings.supabaseKey} onChange={e => setSettings({ ...settings, supabaseKey: e.target.value })} className="w-full p-5 bg-gray-50 border-none rounded-[2rem] outline-none font-mono text-sm focus:ring-2 ring-blue-100 transition-all" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={handleSave} className="flex-1 py-5 bg-black text-white font-bold rounded-[2rem] shadow-xl shadow-black/10 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-2">Update Settings</button>
             <button onClick={handleSyncToCloud} disabled={isSyncing} className="px-10 py-5 bg-emerald-600 text-white font-bold rounded-[2rem] shadow-xl shadow-emerald-200 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
               {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />} PUSH LOCAL TO CLOUD
             </button>
          </div>
        </div>
      </section>

      <section className="space-y-8 border-t pt-16">
        <div className="flex items-center justify-between">
           <h3 className="text-3xl font-serif italic flex items-center gap-3"><Database className="w-8 h-8 text-gray-400" /> Database Blueprint</h3>
           <button onClick={copySQL} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} {isCopied ? 'Copied' : 'Copy SQL'}
          </button>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl leading-relaxed italic">Run this in your Supabase SQL editor to create the necessary architecture for Moshiach Links.</p>
        <pre className="bg-gray-950 text-emerald-400/80 p-10 rounded-[2.5rem] text-[11px] overflow-x-auto font-mono leading-loose shadow-inner">
          {storageService.getSchemaSQL()}
        </pre>
      </section>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefresh }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState('');
  
  // Gatekeeper state
  const [isLocked, setIsLocked] = useState(true);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const settings = storageService.getSettings();

  // Creation States
  const [showCreationModal, setShowCreationModal] = useState<NodeType | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [movingNode, setMovingNode] = useState<Node | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '', contentType: 'text' as FileContentType });

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    setIsLoading(true);
    const data = await storageService.getNodes();
    setNodes(data);
    setIsLoading(false);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeAttempt === settings.adminPasscode) {
      setIsLocked(false);
    } else {
      alert("Invalid Passcode");
      setPasscodeAttempt('');
    }
  };

  const handleAdd = async () => {
    if (!formData.name) return;
    setStatus('Creating...');
    try {
      if (showCreationModal === 'folder') {
        await storageService.addNode({
          name: formData.name,
          type: 'folder',
          parentId: currentFolderId,
        });
      } else {
        await storageService.addNode({
          name: formData.name,
          type: 'file',
          parentId: currentFolderId,
          contentEn: '<p><em>Content will be generated or edited shortly.</em></p>',
          contentHe: '<p>תוכן בעברית...</p>',
          contentType: formData.contentType,
          url: formData.url,
        });
      }
      setShowCreationModal(null);
      setFormData({ name: '', url: '', contentType: 'text' });
      loadNodes();
      onRefresh();
    } catch (e) {
      alert("Error adding item");
    }
    setStatus('');
  };

  const handleUpdate = async () => {
    if (!editingNode || !formData.name) return;
    setStatus('Updating...');
    await storageService.updateNode(editingNode.id, {
      name: formData.name,
      ...(editingNode.type === 'file' ? { url: formData.url, contentType: (formData.contentType as FileContentType) } : {})
    });
    setEditingNode(null);
    setStatus('');
    loadNodes();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this item?')) return;
    await storageService.deleteNode(id);
    loadNodes();
    onRefresh();
  };

  const handleMove = async (newParentId: string | null) => {
    if (!movingNode) return;
    await storageService.moveNode(movingNode.id, newParentId);
    setMovingNode(null);
    loadNodes();
    onRefresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setStatus('Processing...');
    try {
      await fileService.processFile(file, currentFolderId, setStatus);
      setStatus('Completed');
      setTimeout(() => setStatus(''), 2000);
      loadNodes();
      onRefresh();
    } catch (err) {
      alert("Error processing file");
      setStatus('');
    }
    setIsLoading(false);
  };

  const currentNodes = nodes.filter(n => n.parentId === currentFolderId);
  const rootFolders = nodes.filter(n => !n.parentId && n.type === 'folder') as FolderNode[];

  // Gate UI
  if (isLocked) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -z-10" />
        <form onSubmit={handleUnlock} className="w-full max-w-sm text-center space-y-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-100">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-black italic mb-2">Management Console</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Passcode Required</p>
          </div>
          <input 
            type="password" 
            autoFocus
            value={passcodeAttempt}
            onChange={e => setPasscodeAttempt(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-[2rem] py-6 px-10 text-center text-4xl tracking-[0.5em] outline-none focus:ring-4 ring-blue-100 transition-all font-mono"
            placeholder="••••"
          />
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:-translate-y-1 transition-all">Authorize Access</button>
            <button type="button" onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">Return to Library</button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-white flex flex-col overflow-hidden"
    >
      {/* Top Navigation Bar */}
      <header className="h-24 glass px-12 flex items-center justify-between border-b border-black/5 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h2 className="text-2xl font-serif font-black italic text-blue-600 leading-none">Management Console</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse"></span>
               <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Active System Control</span>
            </div>
          </div>
          
          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0 }}
                className="bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
              >
                <Loader2 className="w-3 h-3 animate-spin" /> {status}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setCurrentFolderId(null); }} 
            className={`p-4 rounded-2xl transition-all ${isSettingsOpen ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-4 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all group">
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-80 border-r border-black/5 bg-[#FAFAFB] flex flex-col shrink-0">
          <div className="p-10 space-y-10 flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Hierarchy</span>
                  {!isSettingsOpen && <button onClick={() => setCurrentFolderId(null)} className="text-[10px] font-bold text-blue-600 hover:underline">Reset</button>}
               </div>
               <div className="space-y-1">
                  <button 
                    onClick={() => { setCurrentFolderId(null); setIsSettingsOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs flex items-center gap-3 transition-all ${!currentFolderId && !isSettingsOpen ? 'bg-blue-600 text-white font-bold' : 'hover:bg-black/5 text-gray-500'}`}
                  >
                    <Folder className="w-4 h-4 opacity-40" /> Archive Root
                  </button>
                  {rootFolders.map(f => (
                    <FolderTreeItem key={f.id} node={f} nodes={nodes} depth={0} currentFolder={currentFolderId} onSelect={(id) => { setCurrentFolderId(id); setIsSettingsOpen(false); }} />
                  ))}
               </div>
            </div>

            <div className="pt-10 border-t border-black/5 space-y-6">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Creation Suite</span>
               <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setShowCreationModal('folder')} className="flex items-center gap-3 p-4 bg-white border border-black/5 rounded-2xl hover:border-blue-200 hover:shadow-lg transition-all text-xs font-bold text-gray-600 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FolderPlus className="w-4 h-4" /></div>
                    New Folder
                  </button>
                  <button onClick={() => setShowCreationModal('file')} className="flex items-center gap-3 p-4 bg-white border border-black/5 rounded-2xl hover:border-emerald-200 hover:shadow-lg transition-all text-xs font-bold text-gray-600 group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
                    New Resource
                  </button>
                  <label className="flex items-center gap-3 p-4 bg-white border border-black/5 rounded-2xl hover:border-amber-200 hover:shadow-lg transition-all text-xs font-bold text-gray-600 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-4 h-4" /></div>
                    Smart Doc Import
                    <input type="file" className="hidden" accept=".docx,.txt" onChange={handleFileUpload} />
                  </label>
               </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 bg-white flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {isSettingsOpen ? (
               <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 overflow-hidden flex flex-col">
                  <SettingsPanel onSync={loadNodes} />
               </motion.div>
            ) : (
              <motion.div key="browser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-16 md:p-24 no-scrollbar">
                <div className="max-w-6xl mx-auto space-y-16">
                   <div className="flex items-end justify-between border-b border-black/5 pb-10">
                      <div>
                        <h1 className="text-6xl font-serif font-black tracking-tighter mb-4">
                          {currentFolderId ? nodes.find(n => n.id === currentFolderId)?.name.split('|')[0] : 'Master Archive'}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="font-mono uppercase tracking-widest">{currentNodes.length} Elements</span>
                          <span className="opacity-30">/</span>
                          <span>{currentFolderId ? 'Browsing Collection' : 'Archive Level 0'}</span>
                        </div>
                      </div>
                   </div>

                   {currentNodes.length === 0 && !isLoading && (
                     <div className="py-40 text-center border-4 border-dashed border-gray-50 rounded-[4rem]">
                        <p className="text-4xl font-serif italic text-gray-200">The archive is silent here...</p>
                        <button onClick={() => setShowCreationModal('file')} className="mt-8 px-10 py-4 bg-gray-900 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">Begin Creation</button>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentNodes.map(node => (
                        <motion.div 
                          key={node.id} 
                          initial={{ opacity: 0, scale: 0.98 }} 
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative p-8 bg-white border border-black/5 rounded-[3rem] hover:border-blue-200 hover:shadow-[0_40px_80px_-20px_rgba(0,0,255,0.08)] transition-all duration-500"
                        >
                          <div className="flex items-start justify-between mb-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${node.type === 'folder' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-600 group-hover:text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-900 group-hover:text-white'}`}>
                              {node.type === 'folder' ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                              <button onClick={() => { setEditingNode(node); setFormData({ name: node.name, url: (node as FileNode).url || '', contentType: (node as FileNode).contentType || 'text' }); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => setMovingNode(node)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"><Move className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(node.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>

                          <div className="cursor-pointer" onClick={() => node.type === 'folder' ? setCurrentFolderId(node.id) : null}>
                            <h4 className="text-2xl font-serif font-bold group-hover:text-blue-600 transition-colors mb-2 truncate pr-10">{node.name.split('|')[0]}</h4>
                            {node.name.includes('|') && <p className="text-[11px] text-gray-400 font-serif italic truncate" dir="rtl">{node.name.split('|')[1]}</p>}
                            
                            {node.type === 'file' && (
                              <div className="mt-8 flex items-center gap-4 text-[9px] font-mono font-bold uppercase tracking-widest text-gray-300">
                                 <span className="px-3 py-1 bg-gray-50 rounded-full">{(node as FileNode).contentType}</span>
                                 <span>{new Date(node.createdAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Creation/Edit Overlay Form */}
      <AnimatePresence>
        {(showCreationModal || editingNode) && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
              
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-4xl font-serif font-black italic">
                  {editingNode ? 'Refine Item' : `Craft New ${showCreationModal === 'folder' ? 'Category' : 'Element'}`}
                </h3>
                <button onClick={() => { setShowCreationModal(null); setEditingNode(null); }} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Visual Title (Dual Support)</label>
                  <input 
                    autoFocus 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full p-8 bg-gray-50 border-none rounded-[2rem] text-2xl font-serif focus:ring-4 ring-blue-100 outline-none transition-all" 
                    placeholder="English | Hebrew" 
                  />
                  <p className="text-[9px] text-gray-300 font-medium px-2 italic">Pro tip: Use the pipe symbol | to separate English and Hebrew labels.</p>
                </div>

                {(showCreationModal === 'file' || editingNode?.type === 'file') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Resource Classification</label>
                      <select 
                        value={formData.contentType} 
                        onChange={e => setFormData({ ...formData, contentType: e.target.value as FileContentType })} 
                        className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-bold outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <option value="text">Scholarly Article</option>
                        <option value="video">Cinematic Video</option>
                        <option value="link">External Portal</option>
                        <option value="book">Seforim Library</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Integrated URL</label>
                      <input 
                        value={formData.url} 
                        onChange={e => setFormData({ ...formData, url: e.target.value })} 
                        className="w-full p-6 bg-gray-50 border-none rounded-3xl text-sm font-mono outline-none focus:ring-2 ring-blue-100" 
                        placeholder="https://..." 
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-10">
                  <button 
                    onClick={() => editingNode ? handleUpdate() : handleAdd()} 
                    className="flex-1 py-6 bg-blue-600 text-white font-bold rounded-[2rem] shadow-2xl shadow-blue-200 hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]"
                  >
                    {status || (editingNode ? 'Confirm Evolution' : 'Initialize Creation')}
                  </button>
                  <button 
                    onClick={() => { setShowCreationModal(null); setEditingNode(null); }} 
                    className="px-10 py-6 bg-gray-100 text-gray-400 font-bold rounded-[2rem] hover:bg-gray-200 transition-all text-sm uppercase tracking-[0.1em]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Improved Move Dialog */}
        {movingNode && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-3xl rounded-[4rem] p-16 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-4xl font-serif font-black italic flex items-center gap-4"><Move className="w-8 h-8 text-amber-500" /> Relocate Element</h3>
                   <button onClick={() => setMovingNode(null)} className="p-4 bg-gray-50 rounded-full hover:bg-gray-100 transition-all"><X /></button>
                </div>
                
                <p className="text-gray-400 mb-10 italic">Destiny awaits. Where should <span className="text-black font-bold font-serif">"{movingNode.name.split('|')[0]}"</span> reside?</p>
                
                <div className="flex-1 overflow-y-auto no-scrollbar border border-black/5 rounded-[3rem] p-8 bg-gray-50 space-y-2">
                   <button 
                    onClick={() => handleMove(null)} 
                    className="w-full text-left p-6 bg-white hover:bg-blue-600 hover:text-white rounded-[2rem] font-bold text-sm shadow-sm hover:shadow-xl transition-all mb-4 flex items-center justify-between group"
                   >
                     Primary Root Archive
                     <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                   </button>
                   
                   {nodes.filter(n => n.type === 'folder' && n.id !== movingNode.id).map(f => (
                     <button 
                      key={f.id} 
                      onClick={() => handleMove(f.id)} 
                      className="w-full text-left p-5 hover:bg-blue-600 hover:text-white rounded-2xl transition-all text-xs font-bold flex items-center gap-4 group"
                     >
                        <Folder className="w-4 h-4 opacity-20 group-hover:opacity-100" /> {f.name.split('|')[0]}
                        {f.name.includes('|') && <span className="opacity-40 font-serif font-normal italic ml-auto group-hover:text-white/60" dir="rtl">{f.name.split('|')[1]}</span>}
                     </button>
                   ))}
                </div>
                
                <button onClick={() => setMovingNode(null)} className="mt-10 py-6 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-black transition-colors">Abort Relocation</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
