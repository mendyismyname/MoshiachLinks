import { supabase } from '../integrations/supabase/client';
// @ts-ignore
import * as mammoth from 'mammoth';
import { FileNode } from '../types';

export const fileService = {
  processFile: async (file: File, parentId: string | null): Promise<FileNode> => {
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    let contentHtml = '';
    let contentType: 'text' | 'video' | 'link' = 'text';
    let url: string | undefined = undefined; // DOCX files are text, no URL initially

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
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            name: fileName,
            type: 'file',
            parentId: parentId,
            content: contentHtml,
            contentType: 'text', // DOCX is always text content
            url: url,
            createdAt: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to insert document into Supabase.");
      }

      return data[0] as FileNode; // Return the newly created node
    } catch (err) {
      console.error("File processing or Supabase upload error:", err);
      throw err;
    }
  }
};