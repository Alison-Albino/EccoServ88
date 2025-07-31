import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Droplet, CheckCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type VisitWithDetails } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: visits, isLoading } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/clients', user?.client?.id, 'visits'],
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Poços Ativos"
            value={activeWells.length}
            icon={Droplet}
            variant="primary"
          />
          <StatsCard
            title="Última Manutenção"
            value={lastMaintenance ? `${Math.ceil((Date.now() - new Date(lastMaintenance.visitDate).getTime()) / (1000 * 60 * 60 * 24))} dias` : 'N/A'}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Próxima Visita"
            value={nextVisit ? `${Math.ceil((new Date(nextVisit.visitDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias` : 'N/A'}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Service History */}
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
                <Input type="date" className="w-40" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prestador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fatura
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visits?.visits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(visit.visitDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visit.well.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getServiceTypeLabel(visit.serviceType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visit.provider.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(visit.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {visit.status === 'completed' ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyBoleto}
                            title="Copiar link do boleto"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOpenBoleto}
                            title="Abrir boleto"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!visits?.visits || visits.visits.length === 0) && (
            <div className="p-6 text-center text-gray-500">
              Nenhum histórico de serviços encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
