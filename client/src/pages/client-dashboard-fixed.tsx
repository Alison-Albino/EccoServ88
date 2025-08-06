import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import {
  Calendar,
  CheckCircle,
  Droplet,
  MapPin,
  Wrench,
  Search,
  FileText,
  Camera,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import { DocumentViewer } from "@/components/document-viewer";

export default function ClientDashboard() {
  const [visitFilters, setVisitFilters] = useState({
    searchQuery: "",
    startDate: "",
    endDate: "",
  });

  // Get current user from auth
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Get visits for this client
  const { data: visits, isLoading } = useQuery<any>({
    queryKey: ["/api/visits/client", user?.client?.id],
    enabled: !!user?.client?.id,
  });

  // Get scheduled visits for this client
  const { data: scheduledVisits, isLoading: isLoadingScheduled } = useQuery<any>({
    queryKey: ["/api/scheduled-visits/client", user?.client?.id],
    enabled: !!user?.client?.id,
  });

  // Get wells for this client
  const { data: wells } = useQuery<any>({
    queryKey: ["/api/clients", user?.client?.id, "wells"],
    enabled: !!user?.client?.id,
  });



  // Filter visits based on search criteria
  const filteredVisits = useMemo(() => {
    if (!visits?.visits) return [];

    return visits.visits.filter((visit: any) => {
      const matchesSearch = !visitFilters.searchQuery || 
        visit.id.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
        visit.well?.name?.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
        visit.observations?.toLowerCase().includes(visitFilters.searchQuery.toLowerCase());

      const visitDate = new Date(visit.visitDate);
      const matchesStartDate = !visitFilters.startDate || visitDate >= new Date(visitFilters.startDate);
      const matchesEndDate = !visitFilters.endDate || visitDate <= new Date(visitFilters.endDate);

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [visits?.visits, visitFilters]);

  // Status badge functions
  const getVisitStatusBadge = (status: string) => {
    const variants = {
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pendente" },
      completed: { className: "bg-green-100 text-green-800", label: "Concluída" },
      in_progress: { className: "bg-blue-100 text-blue-800", label: "Em Andamento" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelada" }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getScheduledVisitStatusBadge = (status: string) => {
    const variants = {
      scheduled: { className: "bg-blue-100 text-blue-800", label: "Agendada" },
      confirmed: { className: "bg-green-100 text-green-800", label: "Confirmada" },
      completed: { className: "bg-gray-100 text-gray-800", label: "Concluída" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelada" }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.scheduled;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getWellStatusBadge = (status: string) => {
    const variants = {
      active: { className: "bg-green-100 text-green-800", label: "Ativo" },
      inactive: { className: "bg-gray-100 text-gray-800", label: "Inativo" },
      maintenance: { className: "bg-yellow-100 text-yellow-800", label: "Manutenção" }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (isLoading || isLoadingScheduled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }



  // Extract unique wells from visits or use wells from API
  const activeWells = wells?.wells || visits?.visits?.reduce((acc: any[], visit: any) => {
    if (!acc.some((well: any) => well.id === visit.well.id)) {
      acc.push(visit.well);
    }
    return acc;
  }, [] as any[]) || [];

  const totalVisits = visits?.visits?.length || 0;
  const completedVisits = visits?.visits?.filter((v: any) => v.status === 'completed').length || 0;
  const scheduledVisitsCount = scheduledVisits?.scheduledVisits?.length || 0;
  const lastVisit = visits?.visits
    ?.filter((v: any) => v.status === 'completed')
    .sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

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
            title="Visitas Realizadas"
            value={completedVisits}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Visitas Agendadas"
            value={scheduledVisitsCount}
            icon={Calendar}
            variant="warning"
          />
          <StatsCard
            title="Total de Visitas"
            value={totalVisits}
            icon={Wrench}
            variant="primary"
          />
        </div>

        <Tabs defaultValue="wells" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wells">Poços Ativos</TabsTrigger>
            <TabsTrigger value="visits">Visitas Prestadas</TabsTrigger>
            <TabsTrigger value="scheduled">Agendamentos</TabsTrigger>
          </TabsList>

          {/* Wells Tab */}
          <TabsContent value="wells">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Meus Poços</h2>
                <p className="text-sm text-gray-600 mt-1">Poços cadastrados pelo seu prestador de serviço</p>
              </div>
              
              <div className="p-6">
                {activeWells.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeWells.map((well: any) => (
                      <div key={well.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <Droplet className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{well.name}</h3>
                              <p className="text-sm text-gray-600">{well.type}</p>
                            </div>
                          </div>
                          {getWellStatusBadge(well.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{well.location}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <span className="text-gray-500">Profundidade:</span>
                              <p className="font-medium">{well.depth}m</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Diâmetro:</span>
                              <p className="font-medium">{well.diameter}cm</p>
                            </div>
                          </div>
                          {well.installationDate && (
                            <div className="mt-3">
                              <span className="text-gray-500">Instalado em:</span>
                              <p className="font-medium">{format(new Date(well.installationDate), 'dd/MM/yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum poço registrado.</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Entre em contato com um prestador de serviço para cadastrar seus poços.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Visits Tab */}
          <TabsContent value="visits">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Histórico de Visitas</h2>
                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar visitas..."
                        value={visitFilters.searchQuery}
                        onChange={(e) => setVisitFilters({ ...visitFilters, searchQuery: e.target.value })}
                        className="pl-10 w-full sm:w-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={visitFilters.startDate}
                        onChange={(e) => setVisitFilters({ ...visitFilters, startDate: e.target.value })}
                        className="w-full sm:w-auto"
                      />
                      <Input
                        type="date"
                        value={visitFilters.endDate}
                        onChange={(e) => setVisitFilters({ ...visitFilters, endDate: e.target.value })}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {filteredVisits.length > 0 ? (
                  <div className="space-y-6">
                    {filteredVisits.map((visit: any) => (
                      <div key={visit.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">Visita #{visit.id}</h3>
                            <p className="text-sm text-gray-600">{visit.well?.name || 'Poço não especificado'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getVisitStatusBadge(visit.status)}
                            <span className="text-sm text-gray-500">{format(new Date(visit.visitDate), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Informações da Visita</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tipo de Serviço:</span>
                                <span className="capitalize">{visit.serviceType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tipo de Visita:</span>
                                <span className="capitalize">{visit.visitType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Prestador:</span>
                                <span>{visit.provider?.user?.name || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {visit.observations || 'Nenhuma observação registrada.'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="text-sm text-gray-500">
                            Criada em {format(new Date(visit.createdAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                          <div className="flex gap-2">
                            {visit.invoiceUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={visit.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-1" />
                                  Ver Fatura
                                </a>
                              </Button>
                            )}
                            {visit.photos && visit.photos.length > 0 && (
                              <Button variant="outline" size="sm">
                                <Camera className="h-4 w-4 mr-1" />
                                Ver Fotos ({visit.photos.length})
                              </Button>
                            )}
                            {visit.documents && visit.documents.length > 0 && (
                              <DocumentViewer 
                                documents={visit.documents} 
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Baixar Documentos ({visit.documents.length})
                                  </Button>
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma visita encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Scheduled Visits Tab */}
          <TabsContent value="scheduled">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Visitas Agendadas</h2>
              </div>
              
              <div className="p-6">
                {scheduledVisits?.scheduledVisits && scheduledVisits.scheduledVisits.length > 0 ? (
                  <div className="space-y-4">
                    {scheduledVisits.scheduledVisits.map((scheduled: any) => (
                      <div key={scheduled.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">Agendamento #{scheduled.id}</h3>
                            <p className="text-sm text-gray-600">{scheduled.well?.name || 'Poço não especificado'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getScheduledVisitStatusBadge(scheduled.status)}
                            <span className="text-sm text-gray-500">{format(new Date(scheduled.scheduledDate), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Detalhes do Agendamento</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tipo de Serviço:</span>
                                <span className="capitalize">{scheduled.serviceType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Prestador:</span>
                                <span>{scheduled.provider?.user?.name || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {scheduled.notes || 'Nenhuma observação para este agendamento.'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500">
                            Agendado em {format(new Date(scheduled.createdAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma visita agendada.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}