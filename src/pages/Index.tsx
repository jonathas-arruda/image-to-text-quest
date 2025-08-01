import React, { useState } from 'react';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { OCRProcessor } from '@/components/OCRProcessor';
import { WordCounter } from '@/components/WordCounter';

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Extrator de Texto e Contador de Palavras
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Faça upload de imagens e PDFs para extrair texto usando OCR (Tesseract) e contar palavras automaticamente
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload files={files} onFilesChange={handleFilesChange} />
        </div>

        {/* OCR Processor (hidden component) */}
        <OCRProcessor files={files} onFilesUpdate={setFiles} />

        {/* Word Counter and Statistics */}
        <WordCounter files={files} />
      </div>
    </div>
  );
};

export default Index;