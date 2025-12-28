
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from './services/storageService';
import { Node, FileNode, FolderNode } from './types';
import { TransitionWrapper } from './components/TransitionWrapper';
import { AdminPanel } from './components/AdminPanel';
import { 
  Folder, FileText, Globe, ArrowRight, PlayCircle, 
  ChevronRight, Languages, Menu, X, Settings, 
  ExternalLink, Search, Sparkles, BookOpen, Library
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const getYouTubeId = (url: string) => {
  const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/]{11})/);
  return match ? match[1] : null;
};

const DualLabel: React.FC<{ name: string; className?: string }> = ({ name, className = "" }) => {
  const [en, he] = name.split('|').map(s => s.trim());
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-serif leading-tight">{en}</span>
      {he && <span className="text-[0.6em] opacity-40 font-serif italic mt-0.5" dir="rtl">{he}</span>}
    </div>
  );
};

const ArticleViewer: React.FC<{ file: FileNode; onBack: () => void }> = ({ file, onBack }) => {
  const [mode, setMode] = useState<'en' | 'he' | 'dual'>('dual');
  const ytId = getYouTubeId(file.url || '');

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-12 hover:gap-3 transition-all">
        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Archive
      </button>

      <header className="mb-16 border-b pb-12 border-black/5">
        <h1 className="text-5xl md:text-7xl font-serif tracking-tight mb-8">
          <DualLabel name={file.name} />
        </h1>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setMode('en')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'en' ? 'bg-white shadow-sm' : 'opacity-40'}`}>English</button>
            <button onClick={() => setMode('dual')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'dual' ? 'bg-white shadow-sm' : 'opacity-40'}`}>Dual</button>
            <button onClick={() => setMode('he')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'he' ? 'bg-white shadow-sm' : 'opacity-40'}`}>עברית</button>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">{file.contentType} / {new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
      </header>

      {file.contentType === 'video' && ytId && (
        <div className="mb-20 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-video bg-black">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} allowFullScreen />
        </div>
      )}

      {file.contentType === 'book' && file.url && (
        <div className="mb-20 p-16 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex flex-col items-center text-center">
          <BookOpen className="w-16 h-16 text-amber-600 mb-8" />
          <h3 className="text-3xl font-serif mb-4">Digital Reading Room</h3>
          <p className="max-w-md text-gray-500 mb-10 leading-relaxed italic">This classic work is available in our external digital library. Open the reader to continue your studies.</p>
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-amber-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-amber-700 transition-all">Open Full Volume <ExternalLink className="w-4 h-4" /></a>
        </div>
      )}

      {file.contentType === 'link' && file.url && (
        <div className="mb-20 p-16 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center">
          <Globe className="w-16 h-16 text-blue-600 mb-8" />
          <h3 className="text-3xl font-serif mb-4">External Portal</h3>
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-700 transition-all">Visit Resource <ExternalLink className="w-4 h-4" /></a>
        </div>
      )}

      <div className={`grid gap-16 ${mode === 'dual' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'en' || mode === 'dual') && (
          <motion.article 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="prose prose-2xl prose-blue max-w-none font-light leading-relaxed text-gray-800"
            dangerouslySetInnerHTML={{ __html: file.contentEn }}
          />
        )}
        {(mode === 'he' || mode === 'dual') && (
          <motion.article 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            dir="rtl"
            className="prose prose-2xl prose-blue max-w-none font-serif leading-relaxed text-gray-900 border-r-4 border-blue-50/50 pr-8"
            dangerouslySetInnerHTML={{ __html: file.contentHe || '<p class="opacity-30 italic">Translation pending...</p>' }}
          />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => { refreshData(); }, []);
  const refreshData = async () => {
    const data = await storageService.getNodes();
    setNodes(data);
  };

  const topLevelFolders = useMemo(() => nodes.filter(n => n.type === 'folder' && !n.parentId) as FolderNode[], [nodes]);
  const currentNodes = useMemo(() => nodes.filter(n => n.parentId === currentFolderId), [nodes, currentFolderId]);
  const featuredVideos = useMemo(() => nodes.filter(n => n.type === 'file' && (n as FileNode).contentType === 'video').slice(0, 4) as FileNode[], [nodes]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFD] selection:bg-blue-600 selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-[200] h-24 glass flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setCurrentFolderId(null); setSelectedFile(null); }}>
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tighter italic font-black text-gray-900">Moshiach Links</h1>
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-30">The Digital Archive</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsBrowserOpen(true)} className="px-8 py-3 bg-gray-50 text-gray-900 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-gray-100 transition-all border border-black/5">
            <Library className="w-4 h-4" /> Collections
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isBrowserOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-white p-10 md:p-20 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-20">
                <h3 className="text-4xl font-serif italic">Archive Index</h3>
                <button onClick={() => setIsBrowserOpen(false)} className="p-4 bg-gray-50 rounded-full"><X className="w-8 h-8" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topLevelFolders.map(f => (
                  <button key={f.id} onClick={() => { setCurrentFolderId(f.id); setIsBrowserOpen(false); setSelectedFile(null); }} className="p-10 text-left bg-gray-50 hover:bg-blue-600 hover:text-white transition-all rounded-[3rem] group">
                    <Folder className="w-10 h-10 mb-6 opacity-20 group-hover:opacity-100" />
                    <DualLabel name={f.name} className="text-2xl" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-32">
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <TransitionWrapper key="viewer">
              <ArticleViewer file={selectedFile} onBack={() => setSelectedFile(null)} />
            </TransitionWrapper>
          ) : currentFolderId ? (
            <TransitionWrapper key={currentFolderId}>
              <div className="max-w-7xl mx-auto px-6 py-12">
                <h2 className="text-6xl md:text-8xl font-serif tracking-tighter mb-20 leading-[0.85]"><DualLabel name={nodes.find(n => n.id === currentFolderId)?.name || ''} /></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {currentNodes.map(node => (
                    <motion.div key={node.id} whileHover={{ y: -8 }} onClick={() => node.type === 'folder' ? setCurrentFolderId(node.id) : setSelectedFile(node as FileNode)} className="group p-10 bg-white border border-black/5 rounded-[3rem] cursor-pointer hover:shadow-2xl transition-all">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${node.type === 'folder' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                        {node.type === 'folder' ? <Folder className="w-7 h-7" /> : node.type === 'file' && (node as FileNode).contentType === 'video' ? <PlayCircle className="w-7 h-7" /> : node.type === 'file' && (node as FileNode).contentType === 'book' ? <BookOpen className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                      </div>
                      <h3 className="text-2xl font-serif group-hover:text-blue-600 transition-colors"><DualLabel name={node.name} /></h3>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TransitionWrapper>
          ) : (
            <TransitionWrapper key="home">
              <div className="space-y-32 pb-40">
                <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full" />
                  <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-7xl md:text-[10rem] font-serif tracking-tighter leading-[0.85] mb-12 relative z-10">Studies on <br /><span className="italic">Redemption.</span></motion.h2>
                  <p className="text-xl md:text-3xl text-gray-400 max-w-2xl font-light italic font-serif" dir="rtl">עיונים, ביאורים ומקורות בעניני גאולה ומשיח</p>
                </section>

                <section className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                  {topLevelFolders.slice(0, 8).map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} onClick={() => setCurrentFolderId(f.id)} className="group aspect-square bg-white border border-black/5 rounded-[3rem] p-10 flex flex-col justify-between cursor-pointer hover:shadow-2xl transition-all hover:bg-blue-600">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-all"><Folder className="w-6 h-6" /></div>
                      <div className="group-hover:text-white"><h4 className="text-3xl font-serif leading-tight"><DualLabel name={f.name} /></h4></div>
                    </motion.div>
                  ))}
                </section>

                <section className="max-w-7xl mx-auto px-6 py-24 text-center">
                   <div className="p-20 bg-white border border-black/5 rounded-[4rem] relative overflow-hidden shadow-2xl">
                     <blockquote className="text-3xl md:text-5xl font-serif italic text-gray-800 leading-tight mb-16 relative z-10">"In that era, there will be neither famine nor war, neither envy nor competition, for good will be plentiful and all delicacies available like dust..."</blockquote>
                     <p className="text-xl md:text-3xl font-serif text-gray-400" dir="rtl">"באותה העת לא יהיה שם לא רעב ולא מלחמה, ולא קנאה ותחרות, שהטובה תהיה מושפעת הרבה וכל המעדנים מצויין כעפר..."</p>
                   </div>
                </section>
              </div>
            </TransitionWrapper>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-black py-40 px-12 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-8">
            <h3 className="font-serif italic text-4xl font-black text-blue-500">Moshiach Links</h3>
            <p className="text-white/40 font-light text-xl leading-relaxed max-w-sm italic">Curated with scholarly devotion by<br/><span className="text-white font-bold not-italic">Rabbi Sholom Zirkind.</span></p>
            <div className="pt-12 flex items-center gap-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">© 2025 Moshiach Links Archive</span>
              <button onClick={() => setIsAdminOpen(true)} className="text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-colors border-b border-white/10 pb-1">System Management</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">External Resources</h5>
              <ul className="space-y-4 text-sm font-bold">
                <li><a href="https://torathageulah.com" className="hover:text-blue-500 transition-all flex items-center gap-2">Torah Geulah <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://moshiach.com" className="hover:text-blue-500 transition-all flex items-center gap-2">Moshiach.com <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>
            <div className="space-y-6">
               <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Study Topics</h5>
               <ul className="space-y-4 text-sm font-bold text-white/60">
                 <li>Halechot Melachim</li>
                 <li>Maimonides Archive</li>
                 <li>Signs of Redemption</li>
               </ul>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isAdminOpen && <AdminPanel onClose={() => { setIsAdminOpen(false); refreshData(); }} onRefresh={refreshData} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
