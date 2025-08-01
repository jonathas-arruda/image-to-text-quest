import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  file: File;
  type: 'image' | 'pdf';
  preview?: string;
  text?: string;
  wordCount?: number;
  processing?: boolean;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, files }) => {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        toast.error(`Arquivo ${file.name} não é suportado. Use apenas imagens ou PDFs.`);
        return null;
      }

      return {
        id: Math.random().toString(36).substring(7),
        file,
        type: isImage ? 'image' : 'pdf',
        preview: isImage ? URL.createObjectURL(file) : undefined,
        processing: true
      };
    }).filter(Boolean) as UploadedFile[];

    onFilesChange([...files, ...newFiles]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  });

  const removeFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-300 ease-in-out
              ${isDragActive || dragActive
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-upload-border bg-upload-zone hover:border-primary hover:bg-primary/5'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suporta imagens (JPG, PNG, GIF, etc.) e PDFs
                </p>
              </div>
              <Button variant="outline" type="button">
                Selecionar Arquivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Arquivos Carregados ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {file.type === 'image' ? (
                      <div className="relative">
                        <Image className="h-10 w-10 text-accent" />
                        {file.preview && (
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="absolute inset-0 h-10 w-10 object-cover rounded"
                          />
                        )}
                      </div>
                    ) : (
                      <FileText className="h-10 w-10 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={file.type === 'image' ? 'default' : 'destructive'}>
                        {file.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </span>
                      {file.wordCount !== undefined && (
                        <Badge variant="outline" className="text-accent">
                          {file.wordCount} palavras
                        </Badge>
                      )}
                    </div>
                    
                    {file.processing && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <Progress value={undefined} className="flex-1" />
                          <span className="text-xs text-muted-foreground">Processando...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.text && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info("Texto extraído", {
                            description: file.text?.substring(0, 100) + (file.text && file.text.length > 100 ? '...' : '')
                          });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};