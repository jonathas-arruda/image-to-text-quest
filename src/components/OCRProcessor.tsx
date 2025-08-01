import { useEffect } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadedFile } from './FileUpload';
import { toast } from 'sonner';

// Configure PDF.js worker - Solution 1: CDN Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface OCRProcessorProps {
  files: UploadedFile[];
  onFilesUpdate: (files: UploadedFile[]) => void;
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({ files, onFilesUpdate }) => {
  
  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Solution 1: PDF.js with CDN worker
  const processPDFWithWorker = async (file: UploadedFile): Promise<string> => {
    try {
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
      
      return extractedText.trim();
    } catch (error) {
      console.error('Solution 1 failed:', error);
      throw error;
    }
  };

  // Solution 2: PDF.js without worker (legacy mode)
  const processPDFLegacy = async (file: UploadedFile): Promise<string> => {
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      
      // Disable worker completely
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: true
      }).promise;
      
      let extractedText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n';
      }
      
      return extractedText.trim();
    } catch (error) {
      console.error('Solution 2 failed:', error);
      throw error;
    }
  };

  // Solution 3: PDF to Canvas + OCR
  const processPDFWithOCR = async (file: UploadedFile): Promise<string> => {
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      
      // Create a temporary PDF worker
      const originalWorkerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false
      }).promise;
      
      let extractedText = '';
      
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Limit to 3 pages for performance
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        
        // Convert canvas to image and run OCR
        const imageData = canvas.toDataURL();
        const ocrResult = await Tesseract.recognize(imageData, 'por+eng');
        extractedText += ocrResult.data.text + '\n';
      }
      
      // Restore worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = originalWorkerSrc;
      
      return extractedText.trim();
    } catch (error) {
      console.error('Solution 3 failed:', error);
      throw error;
    }
  };

  // Solution 4: Simple text extraction attempt
  const processPDFSimple = async (file: UploadedFile): Promise<string> => {
    try {
      const text = await file.file.text();
      
      // Try to extract readable text from PDF structure
      const lines = text.split('\n');
      let extractedText = '';
      
      for (const line of lines) {
        // Look for text patterns that might be readable content
        const cleaned = line.replace(/[^\w\s\-.,!?;:]/g, ' ').trim();
        if (cleaned.length > 3 && /[a-zA-Z]/.test(cleaned)) {
          extractedText += cleaned + ' ';
        }
      }
      
      return extractedText.trim();
    } catch (error) {
      console.error('Solution 4 failed:', error);
      throw error;
    }
  };

  // Solution 5: FileReader with manual parsing
  const processPDFManual = async (file: UploadedFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Convert to string and look for text patterns
          let text = '';
          for (let i = 0; i < uint8Array.length - 1; i++) {
            const char = String.fromCharCode(uint8Array[i]);
            if (char.match(/[a-zA-Z0-9\s.,!?;:-]/)) {
              text += char;
            }
          }
          
          // Clean up the extracted text
          const words = text.split(/\s+/).filter(word => 
            word.length > 2 && /[a-zA-Z]/.test(word)
          );
          
          resolve(words.join(' '));
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file.file);
    });
  };

  // Main PDF processing function that tries all solutions
  const processPDF = async (file: UploadedFile): Promise<UploadedFile> => {
    const solutions = [
      { name: 'PDF.js com Worker CDN', fn: processPDFWithWorker },
      { name: 'PDF.js Legacy', fn: processPDFLegacy },
      { name: 'PDF para Canvas + OCR', fn: processPDFWithOCR },
      { name: 'Extração Simples', fn: processPDFSimple },
      { name: 'Parser Manual', fn: processPDFManual }
    ];

    for (const solution of solutions) {
      try {
        toast.info(`Tentando: ${solution.name}...`);
        const text = await solution.fn(file);
        
        if (text && text.length > 10) {
          const wordCount = countWords(text);
          toast.success(`✅ ${solution.name} funcionou!`, {
            description: `${wordCount} palavras encontradas`
          });
          
          return {
            ...file,
            text: text,
            wordCount,
            processing: false
          };
        }
      } catch (error) {
        console.error(`${solution.name} falhou:`, error);
        toast.error(`❌ ${solution.name} falhou`);
      }
    }
    
    toast.error(`❌ Todas as 5 soluções falharam para ${file.file.name}`);
    return {
      ...file,
      text: '',
      wordCount: 0,
      processing: false
    };
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