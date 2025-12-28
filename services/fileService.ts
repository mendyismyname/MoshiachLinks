
import { storageService } from './storageService';
import { translationService } from './translationService';
// @ts-ignore
import mammoth from 'https://esm.sh/mammoth';

export const fileService = {
  processFile: async (file: File, parentId: string | null, onProgress?: (status: string) => void): Promise<void> => {
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    let contentHtml = '';

    try {
      if (file.name.endsWith('.docx')) {
        onProgress?.('Extracting Hebrew text from DOCX...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        contentHtml = result.value;
      } else {
        onProgress?.('Reading text file...');
        contentHtml = await file.text();
        // Simple line-break to paragraph conversion for raw text
        contentHtml = contentHtml.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
      }

      // Initial save: treat the uploaded content as Hebrew (Source)
      const newNode = await storageService.addNode({
        name: fileName,
        type: 'file',
        parentId,
        contentHe: contentHtml,
        contentEn: '<p><em>Translating to English...</em></p>',
        contentType: 'text',
      });

      // Async Translation to English
      onProgress?.('Generating English translation via Gemini...');
      try {
        const translated = await translationService.translateToEnglish(contentHtml);
        await storageService.updateNode(newNode.id, { contentEn: translated });
      } catch (err) {
        console.error("Translation to English failed:", err);
        await storageService.updateNode(newNode.id, { 
          contentEn: '<p><span style="color: red;">Translation error. Please trigger manually in settings.</span></p>' 
        });
      }
    } catch (err) {
      console.error("File processing error:", err);
      throw err;
    }
  }
};
