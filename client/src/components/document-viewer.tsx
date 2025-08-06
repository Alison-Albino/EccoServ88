import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download } from "lucide-react";

interface DocumentViewerProps {
  documents: string[];
  trigger?: React.ReactNode;
  className?: string;
}

export function DocumentViewer({ documents, trigger, className = "" }: DocumentViewerProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={className}>
      <FileText className="h-4 w-4 mr-1" />
      Baixar Documentos ({documents.length})
    </Button>
  );

  const handleDownload = (documentName: string) => {
    // Extrair nome original removendo timestamp
    const originalName = documentName.includes('_') ? 
      documentName.substring(documentName.indexOf('_') + 1) : 
      documentName;
    
    // Download do documento mantendo formato original
    const link = window.document.createElement('a');
    link.href = `/uploads/${documentName}`;
    link.download = originalName;
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const getOriginalName = (filename: string) => {
    // Extrair nome original removendo timestamp
    return filename.includes('_') ? 
      filename.substring(filename.indexOf('_') + 1) : 
      filename;
  };

  const getFileExtension = (filename: string) => {
    const originalName = getOriginalName(filename);
    return originalName.split('.').pop()?.toUpperCase() || 'DOC';
  };

  const getFileIcon = (filename: string) => {
    const originalName = getOriginalName(filename);
    const ext = originalName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'txt':
        return '📃';
      default:
        return '📋';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documentos da Visita</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {documents.map((document, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(document)}</div>
                <div>
                  <p className="font-medium text-sm">{getOriginalName(document)}</p>
                  <p className="text-xs text-gray-500">
                    Arquivo {getFileExtension(document)} • Clique para baixar
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(document)}
                className="h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                Baixar
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}