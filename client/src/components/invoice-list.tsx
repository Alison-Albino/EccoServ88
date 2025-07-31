import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  DollarSign, 
  Filter,
  Eye,
  Calendar
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type InvoiceWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface InvoiceListProps {
  invoices: InvoiceWithDetails[];
  showActions?: boolean;
  userType?: 'admin' | 'provider' | 'client';
}

export function InvoiceList({ invoices, showActions = true, userType = 'admin' }: InvoiceListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest('PATCH', `/api/invoices/${invoiceId}/send`);
    },
    onSuccess: () => {
      toast({
        title: "Fatura enviada!",
        description: "A fatura foi enviada ao cliente com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar fatura",
        description: "Não foi possível enviar a fatura. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentMethod }: { invoiceId: string; paymentMethod: string }) => {
      return apiRequest('PATCH', `/api/invoices/${invoiceId}/paid`, { paymentMethod });
    },
    onSuccess: () => {
      toast({
        title: "Pagamento confirmado!",
        description: "A fatura foi marcada como paga.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: () => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: "Não foi possível confirmar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", className: "bg-gray-100 text-gray-700" },
      sent: { label: "Enviada", className: "bg-primary/10 text-primary" },
      paid: { label: "Paga", className: "bg-success/10 text-success" },
      overdue: { label: "Vencida", className: "bg-error/10 text-error" },
      cancelled: { label: "Cancelada", className: "bg-gray-300 text-gray-600" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const handleCopyPaymentLink = (paymentUrl: string | null) => {
    const url = paymentUrl || 'https://exemplo.com/pagamento/123456';
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Link de pagamento copiado para a área de transferência",
    });
  };

  const handleOpenPaymentLink = (paymentUrl: string | null) => {
    const url = paymentUrl || 'https://exemplo.com/pagamento/123456';
    window.open(url, '_blank');
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.visit.well.client.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status da fatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="Buscar por número, cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">{invoice.invoiceNumber}</span>
                    {getStatusBadge(invoice.status)}
                    {invoice.isFree && (
                      <Badge className="bg-success/10 text-success">Gratuito</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Cliente:</strong> {invoice.visit.well.client.user.name}</p>
                      <p><strong>Poço:</strong> {invoice.visit.well.name}</p>
                      <p><strong>Prestador:</strong> {invoice.visit.provider.user.name}</p>
                    </div>
                    <div>
                      <p><strong>Criada em:</strong> {format(new Date(invoice.createdAt!), 'dd/MM/yyyy')}</p>
                      <p><strong>Vencimento:</strong> {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</p>
                      {invoice.paidDate && (
                        <p><strong>Paga em:</strong> {format(new Date(invoice.paidDate), 'dd/MM/yyyy')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {!invoice.isFree ? (
                    <div className="text-2xl font-bold text-primary">
                      R$ {parseFloat(invoice.totalAmount).toFixed(2).replace('.', ',')}
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-success">
                      Gratuito
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    {invoice.paymentMethod && `via ${invoice.paymentMethod.toUpperCase()}`}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Descrição:</strong> {invoice.description}
                </p>
                {invoice.notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Observações:</strong> {invoice.notes}
                  </p>
                )}
              </div>

              {showActions && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {userType === 'admin' && (
                    <>
                      {invoice.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                          disabled={sendInvoiceMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                      )}
                      
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && !invoice.isFree && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsPaidMutation.mutate({ 
                            invoiceId: invoice.id, 
                            paymentMethod: invoice.paymentMethod || 'boleto' 
                          })}
                          disabled={markAsPaidMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marcar como Paga
                        </Button>
                      )}
                    </>
                  )}

                  {userType === 'provider' && invoice.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                      disabled={sendInvoiceMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Enviar ao Cliente
                    </Button>
                  )}

                  {(invoice.status === 'sent' || invoice.status === 'paid') && !invoice.isFree && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyPaymentLink(invoice.paymentUrl)}
                        title="Copiar link de pagamento"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenPaymentLink(invoice.paymentUrl)}
                        title="Abrir link de pagamento"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {userType === 'client' && (
                    <div className="flex space-x-2">
                      {!invoice.isFree && (invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOpenPaymentLink(invoice.paymentUrl)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pagar Agora
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyPaymentLink(invoice.paymentUrl)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Link
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma fatura encontrada.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}