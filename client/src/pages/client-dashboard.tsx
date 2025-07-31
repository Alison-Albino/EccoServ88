import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, CheckCircle, Clock, Copy, ExternalLink, FileText, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type VisitWithDetails, type InvoiceWithDetails } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { InvoiceList } from "@/components/invoice-list";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: visits, isLoading } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/clients', user?.client?.id, 'visits'],
    enabled: !!user?.client?.id,
  });

  const { data: invoices } = useQuery<{ invoices: InvoiceWithDetails[] }>({
    queryKey: ['/api/clients', user?.client?.id, 'invoices'],
    enabled: !!user?.client?.id,
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { label: "Concluído", className: "bg-success/10 text-success" },
      in_progress: { label: "Em Andamento", className: "bg-warning/10 text-warning" },
      pending: { label: "Pendente", className: "bg-gray-100 text-gray-700" },
      cancelled: { label: "Cancelado", className: "bg-error/10 text-error" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const labels = {
      'manutencao-preventiva': 'Manutenção Preventiva',
      'manutencao-corretiva': 'Manutenção Corretiva',
      'limpeza': 'Limpeza',
      'instalacao': 'Instalação',
      'reparo': 'Reparo',
      'inspecao': 'Inspeção',
    };
    return labels[serviceType as keyof typeof labels] || serviceType;
  };

  const handleCopyBoleto = () => {
    navigator.clipboard.writeText('https://exemplo.com/boleto/123456');
    toast({
      title: "Link copiado!",
      description: "Link do boleto copiado para a área de transferência",
    });
  };

  const handleOpenBoleto = () => {
    window.open('https://exemplo.com/boleto/123456', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeWells = visits?.visits.reduce((acc, visit) => {
    if (!acc.some(well => well.id === visit.well.id)) {
      acc.push(visit.well);
    }
    return acc;
  }, [] as any[]) || [];

  const lastMaintenance = visits?.visits
    .filter(v => v.status === 'completed')
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

  const nextVisit = visits?.visits
    .filter(v => v.status === 'pending')
    .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())[0];

  const totalVisits = visits?.visits.length || 0;
  const completedVisits = visits?.visits.filter(v => v.status === 'completed').length || 0;
  const inProgressVisits = visits?.visits.filter(v => v.status === 'in_progress').length || 0;
  const pendingVisits = visits?.visits.filter(v => v.status === 'pending').length || 0;
  
  const totalInvoices = invoices?.invoices.length || 0;
  const paidInvoices = invoices?.invoices.filter(inv => inv.status === 'paid').length || 0;
  const pendingInvoices = invoices?.invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length || 0;
  const totalAmount = invoices?.invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel do Cliente</h1>
          <p className="text-gray-600 mt-2">Bem-vindo, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Poços Ativos"
            value={activeWells.length}
            icon={Droplet}
            variant="primary"
          />
          <StatsCard
            title="Faturas Pagas"
            value={paidInvoices}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Faturas Pendentes"
            value={pendingInvoices}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Total Pago"
            value={`R$ ${totalAmount.toFixed(2).replace('.', ',')}`}
            icon={DollarSign}
            variant="primary"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Resumo dos Serviços</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total de Visitas:</span>
                    <span className="font-semibold">{totalVisits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Concluídas:</span>
                    <span className="font-semibold text-success">{completedVisits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Em Andamento:</span>
                    <span className="font-semibold text-warning">{inProgressVisits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pendentes:</span>
                    <span className="font-semibold text-gray-600">{pendingVisits}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Atividade Recente</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {lastMaintenance && (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <div>
                          <p className="text-sm font-medium">Última Manutenção</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(lastMaintenance.visitDate), 'dd/MM/yyyy')} - {lastMaintenance.well.name}
                          </p>
                        </div>
                      </div>
                    )}
                    {nextVisit && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-warning" />
                        <div>
                          <p className="text-sm font-medium">Próxima Visita</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(nextVisit.visitDate), 'dd/MM/yyyy')} - {nextVisit.well.name}
                          </p>
                        </div>
                      </div>
                    )}
                    {invoices?.invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').slice(0, 2).map((invoice) => (
                      <div key={invoice.id} className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Fatura Pendente</p>
                          <p className="text-xs text-gray-500">
                            {invoice.invoiceNumber} - R$ {parseFloat(invoice.totalAmount).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Histórico de Serviços</h2>
                  <div className="flex space-x-2">
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Todos os poços" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os poços</SelectItem>
                        {activeWells.map((well) => (
                          <SelectItem key={well.id} value={well.id}>
                            {well.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Buscar serviços..." 
                      className="w-64"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {visits?.visits.map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {visit.well.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(visit.visitDate), 'dd/MM/yyyy')} • {getServiceTypeLabel(visit.serviceType)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Prestador: {visit.provider.user.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(visit.status)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{visit.observations}</p>
                      
                      {visit.photos && visit.photos.length > 0 && (
                        <div className="flex space-x-2 mt-3">
                          {visit.photos.slice(0, 4).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ))}
                          {visit.photos.length > 4 && (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                              <span className="text-xs text-gray-500">+{visit.photos.length - 4}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!visits?.visits || visits.visits.length === 0) && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum serviço encontrado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Minhas Faturas</h2>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span>Total Pago: R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {invoices?.invoices ? (
                    <InvoiceList 
                      invoices={invoices.invoices} 
                      userType="client"
                      showActions={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma fatura encontrada.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


