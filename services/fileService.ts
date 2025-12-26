import { storageService } from './storageService';
// @ts-ignore
import * as mammoth from 'mammoth';

export const fileService = {
  processFile: async (file: File, parentId: string | null): Promise<void> => {
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    let contentHtml = '';
    let contentType: 'text' | 'video' | 'link' = 'text';
    
    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ 
          arrayBuffer,
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Center'] => p.text-center:fresh",
            "p[style-name='Centered'] => p.text-center:fresh",
            "p[style-name='Normal Center'] => p.text-center:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
            "r[style-name='Bold'] => strong",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "b => strong",
            "i => em"
          ]
        });
        contentHtml = result.value;
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        contentHtml = text
          .split(/\n\s*\n/)
          .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('');
      } else {
        throw new Error("Unsupported format");
      }
      
      storageService.addNode({
        name: fileName,
        type: 'file',
        parentId,
        content: contentHtml,
        contentType,
      });
    } catch (err) {
      console.error("File processing error:", err);
      throw err;
    }
  }
};