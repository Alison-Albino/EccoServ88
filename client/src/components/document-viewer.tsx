import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Eye } from "lucide-react";

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
      Visualizar Documentos ({documents.length})
    </Button>
  );

  const handleDocumentClick = (document: string) => {
    // Abrir documento em nova aba
    window.open(`/uploads/${document}`, '_blank');
  };

  const handleDownload = (documentName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Download do documento
    const link = window.document.createElement('a');
    link.href = `/uploads/${documentName}`;
    link.download = documentName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
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
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handleDocumentClick(document)}
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">{document}</p>
                  <p className="text-xs text-gray-500">Clique para visualizar</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDocumentClick(document)}
                  className="h-8"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleDownload(document, e)}
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}