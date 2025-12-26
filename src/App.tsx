import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from './services/storageService';
import { fileService } from './services/fileService';
import { Node, FileNode, FolderNode } from './types';
import { TransitionWrapper } from './components/TransitionWrapper';
import { AdminPanel } from './components/AdminPanel';
import { Folder, FileText, Play, Link2, ArrowRight, Search, ChevronRight, PlayCircle, ChevronDown, ExternalLink, Plus, Video, Menu as MenuIcon, X, Globe, ArrowUpRight, Library, BookOpen, MessageSquare, Sparkles, Settings, AlertCircle, Upload, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/]{11})/);
  return match ? match[1] : null;
};

const linkifyContent = (content: string) => {
  if (!content) return '';
  const urlRegex = /((?:https?:\/\/|www\.)[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<]*)*|[a-z0-9.-]+\.(?:com|org|net|edu|gov|io|info)(?:\/[^\s<]*)?)/gi;
  return content.replace(urlRegex, (match) => {
    let url = match;
    if (!url.startsWith('http')) url = 'https://' + url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rich-link-inline">🔗 ${match}</a>`;
  });
};

const DualLabel: React.FC<{ name: string; className?: string; subClassName?: string; invert?: boolean }> = ({ name, className = "", subClassName = "", invert = false }) => {
  const parts = name.split('|').map(s => s.trim());
  if (parts.length < 2) return <span dir="auto" className={className}>{name}</span>;
  const [english, hebrew] = parts;
  
  return (
    <div className={`flex flex-col ${invert ? 'items-end text-right' : 'items-start text-left'}`}>
      <span className={`leading-tight ${className}`}>{english}</span>
      <span 
        className={`opacity-80 leading-tight mt-0.5 ${subClassName} whitespace-normal font-sans ${invert ? 'text-right' : ''} break-words`} 
        dir="rtl"
      >
        {hebrew}
      </span>
    </div>
  );
};

const ContentCard: React.FC<{ node: FileNode; onClick: () => void }> = ({ node, onClick }) => {
  const isVideo = node.contentType === 'video';
  const isLink = node.contentType === 'link';
  const ytId = isVideo ? getYouTubeId(node.url || '') : null;
  
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="group bg-white border border-black/5 rounded-[2rem] overflow-hidden cursor-pointer transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)]"
    >
      <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
        {ytId ? (
          <div className="w-full h-full relative">
            <img 
              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              alt={node.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-[2px]">
              <PlayCircle className="w-14 h-14 text-white drop-shadow-2xl" />
            </div>
          </div>
        ) : isLink ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
            <Globe className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform" />
            <ArrowUpRight className="absolute top-6 right-6 w-6 h-6 opacity-40" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200">
            {isVideo ? <Video className="w-16 h-16" /> : <FileText className="w-16 h-16" />}
          </div>
        )}
      </div>
      <div className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[9px] font-mono tracking-widest uppercase opacity-30 font-black px-2 py-0.5 border border-black/10 rounded">
            {node.contentType}
          </span>
        </div>
        <div className="mb-4">
          <DualLabel 
            name={node.name} 
            className="text-xl font-serif text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1" 
            subClassName="text-xs" 
          />
        </div>
        <p className="text-sm text-gray-400 font-light line-clamp-2 leading-relaxed">
          {node.content.replace(/<[^>]*>?/gm, '').slice(0, 100)}...
        </p>
      </div>
    </motion.div>
  );
};

const NavDropdown: React.FC<{ nodes: Node[]; parent: FolderNode; onSelect: (n: Node) => void; }> = ({ nodes, parent, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const children = useMemo(() => 
    nodes.filter(n => n.parentId === parent.id).sort((a,b) => b.createdAt - a.createdAt), 
    [nodes, parent.id]
  );
  
  return (
    <div className="relative h-full flex items-center" 
         onMouseEnter={() => setIsOpen(true)} 
         onMouseLeave={() => setIsOpen(false)}>
      <button 
        onClick={() => onSelect(parent)}
        className="px-4 py-3 hover:text-blue-600 transition-colors flex items-center gap-3 whitespace-nowrap group h-full"
      >
        <DualLabel 
          name={parent.name} 
          className="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate max-w-[140px] 2xl:max-w-[180px]" 
          subClassName="text-[10px] font-bold opacity-40" 
        />
        {children.length > 0 && <ChevronDown className={`w-4 h-4 opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>
      
      <AnimatePresence>
        {isOpen && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 pt-2 z-[200]"
          >
            <div className="w-80 bg-white rounded-2xl border border-black/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] p-2 backdrop-blur-3xl overflow-hidden">
              {children.map(node => (
                <button
                  key={node.id}
                  onClick={() => {
                    onSelect(node);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl nav-dropdown-item flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      node.type === 'folder' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {node.type === 'folder' ? 
                        <Folder className="w-4 h-4" /> : 
                        (node as FileNode).contentType === 'video' ? 
                          <Video className="w-4 h-4" /> : 
                          <FileText className="w-4 h-4" />
                      }
                    </div>
                    <DualLabel 
                      name={node.name} 
                      className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 truncate" 
                      subClassName="text-[10px]" 
                    />
                  </div>
                  {node.type === 'folder' && <ChevronRight className="w-3.5 h-3.5 opacity-20" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileNavAccordion: React.FC<{ nodes: Node[]; parent: FolderNode; onSelect: (n: Node) => void; }> = ({ nodes, parent, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const children = useMemo(() => 
    nodes.filter(n => n.parentId === parent.id).sort((a,b) => b.createdAt - a.createdAt), 
    [nodes, parent.id]
  );
  
  return (
    <div className="border-b border-black/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 px-6 group"
      >
        <DualLabel 
          name={parent.name} 
          className="text-lg font-serif font-bold text-gray-900 group-hover:text-blue-600" 
          subClassName="text-xs" 
        />
        {children.length > 0 && <ChevronDown className={`w-5 h-5 opacity-30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>
      
      <AnimatePresence>
        {isOpen && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gray-50/50"
          >
            <div className="px-6 pb-4 space-y-2">
              <button 
                onClick={() => onSelect(parent)}
                className="w-full text-left py-3 px-4 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                View Collection
              </button>
              {children.map(node => (
                <button
                  key={node.id}
                  onClick={() => onSelect(node)}
                  className="w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 hover:bg-black/5"
                >
                  <div className="shrink-0">
                    {node.type === 'folder' ? 
                      <Folder className="w-4 h-4 opacity-40" /> : 
                      (node as FileNode).contentType === 'video' ? 
                        <Video className="w-4 h-4 opacity-40" /> : 
                        <FileText className="w-4 h-4 opacity-40" />
                    }
                  </div>
                  <DualLabel 
                    name={node.name} 
                    className="text-sm font-medium text-gray-600" 
                    subClassName="text-[10px]" 
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTranslatedContent, setShowTranslatedContent] = useState(false); 
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const storedNodes = await storageService.getNodes(); 
      setNodes(storedNodes);
      setIsLoading(false);
    };
    loadData();
  }, []);
  
  const refreshData = async () => {
    const updatedNodes = await storageService.getNodes();
    setNodes(updatedNodes);
  };
  
  const topLevelFolders = useMemo(() => 
    nodes.filter(n => n.type === 'folder' && !n.parentId) as FolderNode[], 
    [nodes]
  );
  
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return nodes.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [nodes, searchQuery]);
  
  const featuredVideos = useMemo(() => 
    nodes.filter(n => n.type === 'file' && (n as FileNode).contentType === 'video')
         .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
         .slice(0, 5) as FileNode[], 
    [nodes]
  );
  
  const breadcrumbs = useMemo(() => {
    const crumbs: Node[] = [];
    let curr = currentFolderId;
    while (curr) {
      const node = nodes.find(n => n.id === curr);
      if (node) {
        crumbs.unshift(node);
        curr = node.parentId;
      } else break;
    }
    return crumbs;
  }, [nodes, currentFolderId]);
  
  const handleSelectNode = (n: Node) => {
    if (n.type === 'folder') {
      setCurrentFolderId(n.id);
      setSelectedFile(null);
    } else {
      setSelectedFile(n as FileNode);
    }
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const getCleanName = (name: string) => name.split('|')[0].trim();

  const handleFileUploadFromEmptyState = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setUploadError(null);
    setIsUploadingFile(true);

    const files = 'dataTransfer' in e ? Array.from(e.dataTransfer.files) : Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const file = files[0];
      try {
        const { contentHtml, translatedContent } = await fileService.processFileContent(file);
        
        await storageService.addNode({
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: 'file',
          parentId: currentFolderId,
          content: contentHtml,
          translatedContent: translatedContent,
          contentType: 'text', // Assuming DOCX are text content
        });

        refreshData();
        setIsUploadingFile(false);
      } catch (err) {
        console.error("Upload error:", err);
        setUploadError("Error processing document. Please try again.");
        setIsUploadingFile(false);
      }
    } else {
      setIsUploadingFile(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-serif text-gray-700 dark:text-gray-300 animate-pulse">Loading Moshiach Links...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-[160] glass h-24 flex items-center px-6 md:px-12">
        <div className="max-w-[1900px] mx-auto w-full flex items-center justify-between h-full">
          <div className="flex items-center gap-4 md:gap-8 h-full">
            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-2.5 bg-black/[0.03] rounded-full hover:bg-black/[0.08] transition-all"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            
            <div 
              className="flex flex-col cursor-pointer group"
              onClick={() => {
                setCurrentFolderId(null);
                setSelectedFile(null);
              }}
            >
              <span className="font-serif italic text-xl md:text-2xl font-black leading-none text-blue-700 tracking-tighter">Moshiach Links</span>
              <span className="hidden sm:block text-[9px] md:text-[10px] font-mono tracking-[0.2em] opacity-40 font-black mt-1 uppercase">Studies on Redemption</span>
            </div>
            
            <nav className="hidden xl:flex items-center gap-0 h-full ml-4 2xl:ml-10 border-l border-black/5 pl-4 2xl:pl-10 overflow-x-auto no-scrollbar flex-shrink-0">
              {topLevelFolders.map(folder => (
                <NavDropdown 
                  key={folder.id} 
                  nodes={nodes} 
                  parent={folder} 
                  onSelect={handleSelectNode} 
                />
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex relative group w-[180px] xl:w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:text-blue-600 group-focus-within:opacity-100 transition-all" />
              <input
                type="text"
                placeholder="Search Archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/[0.03] rounded-full py-2 pl-11 pr-4 text-sm font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 border border-transparent focus:border-blue-600/10 transition-all"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full right-0 mt-4 w-80 glass rounded-2xl border border-black/5 shadow-2xl p-4 overflow-hidden"
                  >
                    {searchResults.length > 0 ? searchResults.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          handleSelectNode(n);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-3 hover:bg-black/5 rounded-xl flex items-center gap-4 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                          {n.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <DualLabel 
                          name={n.name} 
                          className="text-sm font-bold truncate" 
                          subClassName="text-[10px]" 
                        />
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs opacity-30">No results found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-full max-w-sm bg-white z-[220] shadow-2xl flex flex-col"
            >
              <div className="p-6 h-24 border-b border-black/5 flex items-center justify-between">
                <span className="font-serif italic text-2xl font-black text-blue-700">Explore Archive</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {topLevelFolders.map(folder => (
                  <MobileNavAccordion 
                    key={folder.id} 
                    nodes={nodes} 
                    parent={folder} 
                    onSelect={handleSelectNode} 
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <main className="flex-1 pt-32 px-6 md:px-12">
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <TransitionWrapper key={selectedFile.id}>
              <div className="max-w-4xl mx-auto py-16 md:py-24">
                <div className="flex items-center justify-between mb-12">
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all group"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
                    Back
                  </button>
                  <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="flex items-center gap-2 text-gray-500 font-medium text-sm hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Content
                  </button>
                </div>
                
                <header className="mb-20">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[10px] md:text-[12px] font-mono tracking-[0.4em] uppercase opacity-40 font-black px-4 py-1.5 bg-black/5 rounded-full">
                      {selectedFile.contentType}
                    </span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                  </div>
                  <h1 className="text-5xl md:text-8xl font-serif tracking-tight text-gray-900 leading-[1.05] mb-10">
                    <DualLabel 
                      name={selectedFile.name} 
                      className="text-5xl md:text-8xl" 
                      subClassName="text-xl md:text-3xl" 
                    />
                  </h1>
                  <div className="h-px w-32 bg-blue-600/30"></div>
                </header>
                
                {selectedFile.contentType === 'video' && getYouTubeId(selectedFile.url || '') && (
                  <div className="video-wrapper mb-20 rounded-[2.5rem] overflow-hidden shadow-[0_60px_120px_-20px_rgba(0,0,0,0.4)]">
                    <iframe 
                      src={`https://www.youtube.com/embed/${getYouTubeId(selectedFile.url || '')}?rel=0&modestbranding=1&hd=1`} 
                      allowFullScreen 
                      title={selectedFile.name} 
                    />
                  </div>
                )}
                
                {selectedFile.contentType === 'link' && selectedFile.url && (
                  <div className="mb-20 p-12 bg-blue-600 rounded-[2.5rem] text-white flex flex-col items-center text-center group transition-all hover:shadow-2xl shadow-blue-600/20">
                    <Globe className="w-16 h-16 mb-8 opacity-40 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-serif mb-4">External Resource</h3>
                    <p className="opacity-70 mb-10 text-lg max-w-sm">This content is hosted on an external platform. Click below to explore the full resource.</p>
                    <a 
                      href={selectedFile.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-10 py-4 bg-white text-blue-600 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                      Visit Site
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {selectedFile.contentType === 'text' && selectedFile.translatedContent && (
                  <div className="flex justify-end mb-8">
                    <button
                      onClick={() => setShowTranslatedContent(!showTranslatedContent)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      {showTranslatedContent ? 'Show Original' : 'Show Translation'}
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <article 
                  className={`rich-text-content text-xl md:text-3xl font-light opacity-95 leading-relaxed max-w-none prose prose-2xl prose-blue ${
                    (showTranslatedContent ? selectedFile.translatedContent : selectedFile.content)?.match(/[א-ת]/) ? 'font-serif text-right' : 'font-sans'
                  }`}
                  dir={(showTranslatedContent ? selectedFile.translatedContent : selectedFile.content)?.match(/[א-ת]/) ? "rtl" : "ltr"}
                  dangerouslySetInnerHTML={{ __html: linkifyContent(showTranslatedContent ? selectedFile.translatedContent || '' : selectedFile.content) }}
                />
              </div>
            </TransitionWrapper>
          ) : currentFolderId ? (
            <TransitionWrapper key={currentFolderId}>
              <div className="max-w-7xl mx-auto py-12">
                <div className="flex items-center gap-3 text-[10px] font-mono tracking-widest uppercase opacity-30 font-black mb-8">
                  <span 
                    onClick={() => setCurrentFolderId(null)} 
                    className="cursor-pointer hover:text-black"
                  >
                    Home
                  </span>
                  {breadcrumbs.map(b => (
                    <React.Fragment key={b.id}>
                      <ChevronRight className="w-3 h-3" />
                      <span 
                        onClick={() => setCurrentFolderId(b.id)} 
                        className="cursor-pointer hover:text-black"
                      >
                        {getCleanName(b.name)}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                
                <h1 className="text-6xl md:text-9xl font-serif tracking-tighter text-gray-900 mb-20 leading-[0.9]">
                  <DualLabel 
                    name={nodes.find(n => n.id === currentFolderId)?.name || ''} 
                    className="text-6xl md:text-9xl" 
                    subClassName="text-2xl md:text-4xl" 
                  />
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {nodes.filter(n => n.parentId === currentFolderId).map(node => (
                    node.type === 'folder' ? (
                      <div 
                        key={node.id} 
                        onClick={() => setCurrentFolderId(node.id)}
                        className="p-8 md:p-12 bg-white border border-black/5 rounded-[2.5rem] cursor-pointer hover:shadow-2xl hover:border-blue-500/10 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6 md:gap-8 overflow-hidden">
                          <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            <Folder className="w-7 h-7 md:w-8 md:h-8" />
                          </div>
                          <DualLabel 
                            name={node.name} 
                            className="text-xl md:text-2xl font-serif truncate" 
                            subClassName="text-xs md:text-sm" 
                          />
                        </div>
                        <ChevronRight className="w-7 h-7 opacity-0 -translate-x-6 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                      </div>
                    ) : (
                      <ContentCard 
                        key={node.id} 
                        node={node as FileNode} 
                        onClick={() => setSelectedFile(node as FileNode)} 
                      />
                    )
                  ))}
                </div>
                
                {nodes.filter(n => n.parentId === currentFolderId).length === 0 && (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">This folder is empty</h3>
                    <p className="text-gray-500 mb-4">Add content by uploading a DOCX file.</p>
                    
                    {uploadError && (
                      <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 justify-center">
                        <AlertCircle className="w-5 h-5" />
                        {uploadError}
                      </div>
                    )}

                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors mt-6"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={handleFileUploadFromEmptyState}
                    >
                      {isUploadingFile ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                          <p className="text-blue-600 font-medium">Uploading and translating...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-700 mb-2">Upload DOCX File</h3>
                          <p className="text-gray-500 mb-4">Drag and drop files here or click to browse</p>
                          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            Choose File
                            <input 
                              type="file" 
                              accept=".docx" 
                              onChange={handleFileUploadFromEmptyState} 
                              className="hidden" 
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TransitionWrapper>
          ) : (
            <div key="homepage" className="space-y-32 md:space-y-64 pb-40">
              <section className="flex flex-col items-center justify-center text-center pt-24 pb-12 min-h-[85vh] relative overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-[600px] md:w-[1200px] h-[600px] md:h-[1200px] bg-blue-600/5 blur-[120px] md:blur-[220px] rounded-full"></div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center space-y-4 md:space-y-8"
                >
                  <h2 className="text-5xl md:text-[9rem] font-serif tracking-tighter leading-[0.85] text-blue-950 max-w-7xl drop-shadow-sm px-4">
                    Studies on <br/><span className="italic">Redemption.</span>
                  </h2>
                  <p className="text-xl md:text-4xl font-light text-gray-400 max-w-4xl leading-relaxed italic px-6 font-serif" dir="rtl">
                    עיונים, ביאורים ומקורות בעניני גאולה ומשיח
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="mt-20 md:mt-24 flex flex-col md:flex-row items-center gap-6 md:gap-8"
                >
                  <button 
                    onClick={() => setCurrentFolderId(nodes.find(n => n.name.includes('Concepts'))?.id || null)}
                    className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-full font-bold text-sm tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/20"
                  >
                    Begin Exploration
                  </button>
                  {featuredVideos.length > 0 && (
                    <button 
                      onClick={() => setSelectedFile(featuredVideos[0])}
                      className="w-full md:w-auto px-12 py-5 bg-white text-black border border-black/5 rounded-full font-bold text-sm tracking-[0.2em] uppercase hover:bg-gray-50 hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Watch Latest
                    </button>
                  )}
                </motion.div>
              </section>
              
              {/* Quick Links Grid Section */}
              <section className="max-w-[1900px] mx-auto px-6 md:px-12">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="mb-16 border-b border-black/5 pb-12"
                >
                  <h5 className="text-[12px] font-mono uppercase tracking-[0.5em] opacity-40 font-black">Browse Archive by Section</h5>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {topLevelFolders.map((folder, i) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      onClick={() => handleSelectNode(folder)}
                      className="group p-10 bg-white border border-black/5 rounded-[2.5rem] cursor-pointer hover:shadow-2xl hover:border-blue-600/10 transition-all flex flex-col justify-between aspect-square lg:aspect-auto min-h-[300px]"
                    >
                      <div className="space-y-6">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          {folder.name.includes('Library') ? <Library className="w-6 h-6" /> : 
                           folder.name.includes('Multimedia') ? <PlayCircle className="w-6 h-6" /> : 
                           folder.name.includes('Concepts') ? <Sparkles className="w-6 h-6" /> : 
                           folder.name.includes('Belief') ? <BookOpen className="w-6 h-6" /> : 
                           <Folder className="w-6 h-6" />}
                        </div>
                        <div className="space-y-2">
                          <DualLabel 
                            name={folder.name} 
                            className="text-3xl font-serif text-gray-900 group-hover:text-blue-600 transition-colors leading-tight" 
                            subClassName="text-sm font-bold" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all">
                        Explore
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
              
              {/* Featured Video Series Section */}
              <section className="max-w-[1900px] mx-auto px-6 md:px-12">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="flex items-center justify-between mb-16 px-4 border-b border-black/5 pb-12"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                      <PlayCircle className="w-7 h-7" />
                    </div>
                    <h5 className="text-[12px] md:text-[14px] font-mono uppercase tracking-[0.3em] md:tracking-[0.5em] opacity-40 font-black">Featured Multimedia</h5>
                  </div>
                </motion.div>
                
                {featuredVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {featuredVideos.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      >
                        <ContentCard 
                          node={file} 
                          onClick={() => setSelectedFile(file)} 
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-20 font-mono text-sm tracking-widest">
                    ADD CONTENT TO FEATURE VIDEOS
                  </div>
                )}
              </section>
              
              {/* Highlighted Quote Section - Re-hierarchized */}
              <section className="max-w-7xl mx-auto px-4 py-12 md:py-24">
                <div className="p-12 md:p-24 bg-white rounded-[3rem] md:rounded-[4rem] text-center border border-black/5 relative overflow-hidden shadow-2xl shadow-gray-200">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/[0.03] blur-[120px] rounded-full"></div>
                  
                  {/* English First and Larger */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                    className="text-2xl md:text-5xl lg:text-6xl font-serif max-w-5xl mx-auto text-gray-900 italic leading-[1.3] md:leading-[1.2] tracking-tight relative z-10"
                  >
                    "In that era, there will be neither famine nor war, neither envy nor competition, for good will be plentiful and all delicacies available like dust..."
                  </motion.p>
                  
                  {/* Hebrew Below and Smaller */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.5 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className="text-lg md:text-2xl font-serif text-gray-500 mt-10 md:mt-16 max-w-4xl mx-auto leading-relaxed italic text-right"
                    dir="rtl"
                  >
                    "באותה העת לא יהיה שם לא רעב ולא מלחמה, ולא קנאה ותחרות, שהטובה תהיה מושפעת הרבה וכל המעדנים מצויין כעפר..."
                  </motion.p>
                </div>
              </section>
            </div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="mt-20 bg-[#111111] py-24 md:py-40 px-6 md:px-12 text-white/90">
        <div className="max-w-[1900px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
            <div className="lg:col-span-4 space-y-10 md:space-y-12">
              <div className="flex flex-col">
                <h3 className="text-4xl md:text-5xl font-serif italic font-black text-blue-500 tracking-tighter">Moshiach Links</h3>
                <span className="text-[10px] md:text-[11px] font-mono tracking-[0.3em] opacity-40 font-black mt-2 uppercase">עיונים, ביאורים ומקורות</span>
              </div>
              <p className="text-xl md:text-2xl font-light text-white/40 max-w-sm leading-relaxed" dir="rtl">
                "באותה העת לא יהיה שם לא רעב ולא מלחמה, ולא קנאה ותחרות..."
              </p>
              <div className="pt-8">
                <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.4em] font-black opacity-20">© 2025 Moshiach Links | בס"ד</span>
                <p className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] font-black opacity-20 mt-2">By Rabbi Sholom Zirkind</p>
              </div>
            </div>
            
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-20">
              <div className="space-y-8 md:space-y-10">
                <h5 className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.4em] md:tracking-[0.5em] font-black text-blue-500">אתרים מומלצים</h5>
                <ul className="space-y-4 md:space-y-5 text-base font-medium text-white/50" dir="rtl">
                  <li><a href="https://torathageulah.com" target="_blank" className="hover:text-blue-400 flex items-center gap-2 transition-colors">תורת הגאולה <ExternalLink className="w-3.5 h-3.5 opacity-20" /></a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">מאמרים מבוארים מהרבי מליובאוויטש</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">אוצרות אחרית הימים</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">משיח וגאולה - צעירי חב"ד</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">גאולה ומשיח - חב"דפדיה</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">רבי דרייב - ספרים ושיעורים</a></li>
                </ul>
              </div>
              
              <div className="space-y-8 md:space-y-10">
                <h5 className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.4em] md:tracking-[0.5em] font-black text-blue-500">ביאורי רמב"ם</h5>
                <ul className="space-y-4 md:space-y-5 text-base font-medium text-white/50" dir="rtl">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">מפרשי הרמב"ם על הלכות מלכים פי"א-י"ב</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">מפתח הלכות תשובה פ"ט ה"ב</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">מפתח הלכות שמיטה ויובל פי"ב</a></li>
                  <li className="pt-8 border-t border-white/5">
                    <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.4em] opacity-20 block mb-3">Resources</span>
                    <a href="#" className="hover:text-blue-400 transition-colors">מיקרופדיה תלמודית - ימות המשיח</a>
                    <a href="#" className="hover:text-blue-400 transition-colors block mt-2">אנציקלופדיה תלמודית - עולם הבא</a>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-8 md:space-y-10">
                <h5 className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.4em] md:tracking-[0.5em] font-black text-blue-500">English Library</h5>
                <ul className="space-y-4 md:space-y-5 text-base font-medium text-white/50">
                  <li><a href="https://moshiach.com" target="_blank" className="hover:text-blue-400 flex items-center gap-2 transition-colors">Moshiach.com <ExternalLink className="w-3.5 h-3.5 opacity-20" /></a></li>
                  <li><a href="https://chabad.org" target="_blank" className="hover:text-blue-400 transition-colors">Chabad: Moshiach 101</a></li>
                  <li><a href="https://learnmoshiach.com" target="_blank" className="hover:text-blue-400 transition-colors">LearnMoshiach.com</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors italic">Living with Moshiach</a></li>
                  <li className="pt-8">
                    <button 
                      onClick={() => setIsAdminOpen(true)}
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      Admin Portal
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-20 md:mt-40 pt-16 md:pt-24 border-t border-white/5">
            <h5 className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.4em] md:tracking-[0.5em] font-black text-white/10 mb-16 md:mb-20 text-center">רשימת ספרים נבחרים</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-10 text-sm font-light text-white/30" dir="rtl">
              {['אבקת רוכל לרבינו מכיר', 'אגרת הנחמה להרב מימון', 'אגרת תחיית המתים להרמב"ם', 'אגרת תימן להרמב"ם', 'אמונות ודעות לרס"ג', 'נצח ישראל למהר"ל', 'ישועות משיחו לאברבנאל', 'משמיע ישועה לאברבנאל', 'אור ה\' לר\' חסדאי קרשקש', 'בית אלקים להמבי"ט', 'מאמר הגאולה לרמח"ל', 'עבודת הקודש לראב"ג', 'חסד לאברהם (תפילת ישראל)', 'תורת הגאולה (סדרת ענינים)', 'ימות המשיח בהלכה'].map(book => (
                <a key={book} href="#" className="hover:text-blue-400 transition-colors">{book}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      <AnimatePresence>
        {isAdminOpen && (isAuthenticated ? (
          <AdminPanel onClose={() => { setIsAdminOpen(false); setIsAuthenticated(false); setAdminPassword(''); setAdminError(null); }} currentFolderId={currentFolderId} onRefresh={refreshData} editingNode={selectedFile} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-gray-50 flex items-center justify-center"
          >
            <div className="bg-white p-8 rounded-lg shadow-lg text-center border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Enter Admin Password</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
              />
              <button
                onClick={() => {
                  if (adminPassword === '770770') {
                    setIsAuthenticated(true);
                    setAdminError(null);
                  } else {
                    setAdminError("Incorrect password");
                  }
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Unlock Admin
              </button>
              {adminError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {adminError}
                </div>
              )}
              <button
                onClick={() => {
                  setIsAdminOpen(false);
                  setAdminPassword('');
                  setAdminError(null);
                }}
                className="mt-4 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default App;