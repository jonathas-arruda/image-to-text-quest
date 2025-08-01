import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadedFile } from './FileUpload';
import { FileText, Image, BarChart3, Target } from 'lucide-react';

interface WordCounterProps {
  files: UploadedFile[];
}

export const WordCounter: React.FC<WordCounterProps> = ({ files }) => {
  const processedFiles = files.filter(f => !f.processing && f.wordCount !== undefined);
  const totalWords = processedFiles.reduce((sum, file) => sum + (file.wordCount || 0), 0);
  const imageFiles = processedFiles.filter(f => f.type === 'image');
  const pdfFiles = processedFiles.filter(f => f.type === 'pdf');
  
  const imageWords = imageFiles.reduce((sum, file) => sum + (file.wordCount || 0), 0);
  const pdfWords = pdfFiles.reduce((sum, file) => sum + (file.wordCount || 0), 0);

  const averageWordsPerFile = processedFiles.length > 0 ? Math.round(totalWords / processedFiles.length) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8" />
              <div>
                <p className="text-2xl font-bold">{totalWords.toLocaleString()}</p>
                <p className="text-sm opacity-90">Total de Palavras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-accent-foreground">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8" />
              <div>
                <p className="text-2xl font-bold">{processedFiles.length}</p>
                <p className="text-sm opacity-90">Arquivos Processados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Image className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{imageWords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Palavras de Imagens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{pdfWords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Palavras de PDFs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      {processedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{averageWordsPerFile}</p>
                  <p className="text-sm text-muted-foreground">Média por Arquivo</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{imageFiles.length}</p>
                  <p className="text-sm text-muted-foreground">Imagens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{pdfFiles.length}</p>
                  <p className="text-sm text-muted-foreground">PDFs</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Detalhes por Arquivo:</h4>
                {processedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {file.type === 'image' ? (
                        <Image className="h-4 w-4 text-accent" />
                      ) : (
                        <FileText className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium truncate max-w-xs">
                        {file.file.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={file.type === 'image' ? 'default' : 'destructive'}>
                        {file.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-accent">
                        {file.wordCount} palavras
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {processedFiles.length === 0 && files.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse-glow">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Processando arquivos...</p>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto extraímos o texto dos seus arquivos
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};