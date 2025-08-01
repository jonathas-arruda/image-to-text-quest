import { useEffect } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadedFile } from './FileUpload';
import { toast } from 'sonner';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface OCRProcessorProps {
  files: UploadedFile[];
  onFilesUpdate: (files: UploadedFile[]) => void;
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({ files, onFilesUpdate }) => {
  
  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const processImage = async (file: UploadedFile): Promise<UploadedFile> => {
    try {
      toast.info(`Iniciando OCR para ${file.file.name}...`);
      
      const result = await Tesseract.recognize(file.file, 'por', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const extractedText = result.data.text.trim();
      const wordCount = countWords(extractedText);

      toast.success(`OCR concluído para ${file.file.name}`, {
        description: `${wordCount} palavras encontradas`
      });

      return {
        ...file,
        text: extractedText,
        wordCount,
        processing: false
      };
    } catch (error) {
      console.error('Erro no OCR:', error);
      toast.error(`Erro ao processar ${file.file.name}`);
      return {
        ...file,
        text: '',
        wordCount: 0,
        processing: false
      };
    }
  };

  const processPDF = async (file: UploadedFile): Promise<UploadedFile> => {
    try {
      toast.info(`Extraindo texto do PDF ${file.file.name}...`);
      
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n';
      }

      const cleanText = extractedText.trim();
      const wordCount = countWords(cleanText);

      toast.success(`Texto extraído do PDF ${file.file.name}`, {
        description: `${wordCount} palavras encontradas`
      });

      return {
        ...file,
        text: cleanText,
        wordCount,
        processing: false
      };
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      toast.error(`Erro ao processar PDF ${file.file.name}`);
      return {
        ...file,
        text: '',
        wordCount: 0,
        processing: false
      };
    }
  };

  useEffect(() => {
    const processFiles = async () => {
      const filesToProcess = files.filter(f => f.processing && !f.text);
      
      if (filesToProcess.length === 0) return;

      for (const file of filesToProcess) {
        let processedFile: UploadedFile;
        
        if (file.type === 'image') {
          processedFile = await processImage(file);
        } else {
          processedFile = await processPDF(file);
        }

        // Update the specific file in the array
        const updatedFiles = files.map(f => f.id === file.id ? processedFile : f);
        onFilesUpdate(updatedFiles);
      }
    };

    processFiles();
  }, [files, onFilesUpdate]);

  return null; // This component doesn't render anything
};