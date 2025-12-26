
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';
import { NodeType } from '../types';
import { X, FolderPlus, FilePlus, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  currentFolderId: string | null;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentFolderId, onRefresh }) => {
  const [isAdding, setIsAdding] = useState<NodeType | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);

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
        await fileService.processFile(file, currentFolderId);
        // Special case: for the admin panel, we actually want to show the content in the editor 
        // if they dropped it while the modal is open, but usually dropping on modal is for 'New Entry' fast-tracking.
        // Let's just finish the add if they drop it here.
        onRefresh();
        onClose();
      } catch (err) {
        setError("Error processing document.");
      }
    }
  };

  const handleAdd = () => {
    if (!name) return;
    const contentHtml = editorRef.current?.innerHTML || '';

    if (isAdding === 'folder') {
      storageService.addNode({ name, type: 'folder', parentId: currentFolderId });
    } else {
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      const contentType = url ? (isYouTube ? 'video' : 'link') : 'text';
      storageService.addNode({
        name,
        type: 'file',
        parentId: currentFolderId,
        content: contentHtml,
        contentType,
        url: url || undefined,
      });
    }

    setName('');
    setUrl('');
    setIsAdding(null);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        className={`w-full max-w-3xl bg-white border border-black/10 rounded-[3rem] overflow-hidden shadow-2xl transition-all ${dragActive ? 'scale-[1.02] border-blue-500 bg-blue-50/30' : ''}`}
      >
        <div className="flex items-center justify-between p-8 border-b border-black/5 bg-gray-50/50">
          <h2 className="text-2xl font-serif text-gray-900">Archive Manager</h2>
          <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-full transition-colors text-gray-400">
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
            <div className="grid grid-cols-2 gap-8">
              <button
                onClick={() => setIsAdding('folder')}
                className="flex flex-col items-center justify-center p-16 bg-gray-50 hover:bg-white hover:shadow-xl border border-dashed border-gray-200 rounded-[2.5rem] transition-all group"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FolderPlus className="w-8 h-8" />
                </div>
                <span className="font-serif text-xl">New Collection</span>
              </button>
              <button
                onClick={() => setIsAdding('file')}
                className="flex flex-col items-center justify-center p-16 bg-gray-50 hover:bg-white hover:shadow-xl border border-dashed border-gray-200 rounded-[2.5rem] transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FilePlus className="w-8 h-8" />
                </div>
                <span className="font-serif text-xl">New Entry</span>
              </button>
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
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAdd}
                  className="flex-[2] bg-black text-white font-bold py-5 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl"
                >
                  Commit to Archive
                </button>
                <button
                  onClick={() => { setIsAdding(null); setError(null); }}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-5 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
