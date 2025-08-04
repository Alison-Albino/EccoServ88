import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImageViewer } from "@/components/image-viewer";
import { Users, Droplet, Bolt, CalendarCheck, Check, UserPlus, Clock, AlertTriangle, FileText, BarChart3, CheckCircle, FlaskConical, Search, MapPin, Camera, TrendingUp, Wrench, Activity, Trash2, Key, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type VisitWithDetails, type WellWithClient } from "@shared/schema";
import { format } from "date-fns";
import { MaterialConsumptionReport } from "@/components/material-consumption-report";

const providerRegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  specialties: z.string().min(1, "Especialidades são obrigatórias"),
});

type ProviderRegisterForm = z.infer<typeof providerRegisterSchema>;

interface AdminStats {
  totalClients: number;
  totalProviders: number;
  totalWells: number;
  totalVisits: number;
  monthlyVisits: number;
  scheduledVisits: number;
  scheduledVisits?: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [visitFilters, setVisitFilters] = useState({
    searchQuery: "",
    startDate: "",
    endDate: "",
    status: "all",
    wellId: "",
  });

  const providerForm = useForm<ProviderRegisterForm>({
    resolver: zodResolver(providerRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      specialties: "",
    },
  });

  const { data: stats, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: visits, refetch: refetchVisits } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/admin/visits'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: wells, refetch: refetchWells } = useQuery<{ wells: WellWithClient[] }>({
    queryKey: ['/api/admin/wells'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: providers, refetch: refetchProviders } = useQuery<{ providers: any[] }>({
    queryKey: ['/api/admin/providers'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: scheduledVisits, refetch: refetchScheduledVisits } = useQuery<{ scheduledVisits: any[] }>({
    queryKey: ['/api/admin/scheduled-visits'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: materialConsumption, refetch: refetchMaterialConsumption } = useQuery<{ consumption: any[] }>({
    queryKey: ['/api/admin/materials/all-consumption'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: clients, refetch: refetchClients } = useQuery<{ clients: any[] }>({
    queryKey: ['/api/admin/clients'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const registerProviderMutation = useMutation({
    mutationFn: async (data: ProviderRegisterForm) => {
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        userType: "provider",
      };

      // Register user
      const userResponse = await apiRequest('POST', '/api/register', userData);
      const user = await userResponse.json();

      // Create provider profile
      await apiRequest('POST', '/api/providers', {
        userId: user.id,
        specialties: data.specialties.split(',').map(s => s.trim()),
        phone: data.phone,
      });

      return userResponse;
    },
    onSuccess: () => {
      toast({
        title: "Prestador cadastrado com sucesso!",
        description: "O prestador foi adicionado ao sistema.",
      });
      providerForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao cadastrar o prestador.",
        variant: "destructive",
      });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      await apiRequest('DELETE', `/api/admin/providers/${providerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Prestador excluído com sucesso!",
        description: "O prestador foi removido do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wells'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir prestador",
        description: error.message || "Ocorreu um erro ao excluir o prestador.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (providerId: string) => {
      await apiRequest('PUT', `/api/admin/providers/${providerId}/reset-password`);
    },
    onSuccess: () => {
      toast({
        title: "Senha resetada com sucesso!",
        description: "A senha foi alterada para 123456.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Ocorreu um erro ao resetar a senha.",
        variant: "destructive",
      });
    },
  });

  const onSubmitProvider = (data: ProviderRegisterForm) => {
    registerProviderMutation.mutate(data);
  };

  const handleDeleteProvider = (providerId: string, providerName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o prestador "${providerName}"? Esta ação não pode ser desfeita.`)) {
      deleteProviderMutation.mutate(providerId);
    }
  };

  const handleResetPassword = (providerId: string, providerName: string) => {
    if (window.confirm(`Tem certeza que deseja resetar a senha do prestador "${providerName}" para 123456?`)) {
      resetPasswordMutation.mutate(providerId);
    }
  };

  // Reset client password mutation
  const resetClientPasswordMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await apiRequest('POST', `/api/admin/clients/${clientId}/reset-password`);
    },
    onSuccess: () => {
      toast({
        title: "Senha resetada!",
        description: "A senha do cliente foi alterada para '12345'.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Não foi possível resetar a senha do cliente.",
        variant: "destructive",
      });
    },
  });

  const resetClientPassword = (clientId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja resetar a senha de ${clientName} para '12345'?`)) {
      resetClientPasswordMutation.mutate(clientId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Ativo", className: "bg-success/10 text-success" },
      maintenance: { label: "Manutenção", className: "bg-warning/10 text-warning" },
      attention: { label: "Atenção", className: "bg-error/10 text-error" },
      inactive: { label: "Inativo", className: "bg-gray-100 text-gray-700" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Filter visits based on admin filters
  const filteredVisits = visits?.visits.filter(visit => {
    const matchesSearch = !visitFilters.searchQuery || 
      visit.id.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
      visit.well.name.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
      visit.well.client.user.name.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
      visit.provider.user.name.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
      visit.observations.toLowerCase().includes(visitFilters.searchQuery.toLowerCase());
    
    const matchesStatus = !visitFilters.status || visitFilters.status === 'all' || visit.status === visitFilters.status;
    const matchesWell = !visitFilters.wellId || visit.wellId === visitFilters.wellId;
    
    const matchesDate = (!visitFilters.startDate || new Date(visit.visitDate) >= new Date(visitFilters.startDate)) &&
      (!visitFilters.endDate || new Date(visit.visitDate) <= new Date(visitFilters.endDate));
    
    return matchesSearch && matchesStatus && matchesWell && matchesDate;
  }) || [];

  const getWellStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Ativo", className: "bg-green-100 text-green-800" },
      inactive: { label: "Inativo", className: "bg-gray-100 text-gray-800" },
      maintenance: { label: "Em Manutenção", className: "bg-yellow-100 text-yellow-800" },
      problem: { label: "Com Problema", className: "bg-red-100 text-red-800" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getVisitStatusBadge = (status: string) => {
    const variants = {
      completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
      in_progress: { label: "Em Andamento", className: "bg-blue-100 text-blue-800" },
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
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

  // Calculate stats from actual data
  const completedVisits = visits?.visits.filter(v => v.status === 'completed').length || 0;
  const pendingVisits = visits?.visits.filter(v => v.status === 'pending').length || 0;
  const inProgressVisits = visits?.visits.filter(v => v.status === 'in_progress').length || 0;
  const activeWells = wells?.wells.filter(w => w.status === 'active').length || 0;
  const problemWells = wells?.wells.filter(w => w.status === 'problem').length || 0;
  const totalScheduled = scheduledVisits?.scheduledVisits?.length || 0;

  // Manual refresh function
  const handleRefreshAll = () => {
    refetchStats();
    refetchVisits();
    refetchWells();
    refetchProviders();
    refetchScheduledVisits();
    refetchMaterialConsumption();
    refetchClients();
    toast({
      title: "Dados atualizados!",
      description: "Todas as informações foram recarregadas.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-600 mt-2">Bem-vindo, {user?.name}!</p>
          </div>
          <Button onClick={handleRefreshAll} variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Atualizar Dados
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total de Clientes"
            value={stats?.totalClients || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Prestadores Ativos"
            value={stats?.totalProviders || 0}
            icon={Bolt}
            variant="success"
          />
          <StatsCard
            title="Total de Poços"
            value={stats?.totalWells || 0}
            icon={Droplet}
            variant="primary"
          />
          <StatsCard
            title="Total de Visitas"
            value={stats?.totalVisits || 0}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Agendamentos"
            value={stats?.scheduledVisits || 0}
            icon={Calendar}
            variant="warning"
          />
          <StatsCard
            title="Poços com Problemas"
            value={problemWells}
            icon={AlertTriangle}
            variant="destructive"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="visits">Visitas</TabsTrigger>
            <TabsTrigger value="scheduled">Agendamentos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="wells">Poços</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="providers">Prestadores</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visitas Recentes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Visitas Recentes</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {visits?.visits.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {visit.id} - {visit.well.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Cliente: {visit.well.client.user.name} • Técnico: {visit.provider.user.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(visit.visitDate), 'dd/MM/yyyy')} • {getServiceTypeLabel(visit.serviceType)}
                          </p>
                        </div>
                        {getVisitStatusBadge(visit.status)}
                      </div>
                    ))}
                    
                    {(!visits?.visits || visits.visits.length === 0) && (
                      <p className="text-center text-gray-500 py-8">Nenhuma visita registrada.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status dos Poços - Resumo */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Resumo dos Poços</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {wells?.wells.slice(0, 6).map((well) => {
                      const lastVisit = visits?.visits
                        .filter(v => v.wellId === well.id)
                        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

                      return (
                        <div key={well.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Droplet className="text-blue-600 h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {well.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {well.client.user.name} • Última visita: {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          {getWellStatusBadge(well.status)}
                        </div>
                      );
                    })}
                    
                    {(!wells?.wells || wells.wells.length === 0) && (
                      <p className="text-center text-gray-500">Nenhum poço cadastrado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab de Visitas Completas */}
          <TabsContent value="visits">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Todas as Visitas ({visits?.visits?.length || 0})</h2>
                  <div className="flex space-x-3">
                    <Input 
                      placeholder="Buscar por ID, poço, cliente ou técnico..." 
                      className="w-80"
                      value={visitFilters.searchQuery}
                      onChange={(e) => setVisitFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    />
                    <Select value={visitFilters.status} onValueChange={(value) => setVisitFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {filteredVisits.map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              Visita {visit.id}
                            </h4>
                            {getVisitStatusBadge(visit.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Cliente:</strong> {visit.well.client.user.name}</p>
                              <p><strong>Poço:</strong> {visit.well.name}</p>
                              <p><strong>Localização:</strong> {visit.well.location}</p>
                            </div>
                            <div>
                              <p><strong>Técnico:</strong> {visit.provider.user.name}</p>
                              <p><strong>Data:</strong> {format(new Date(visit.visitDate), 'dd/MM/yyyy')}</p>
                              <p><strong>Tipo:</strong> {getServiceTypeLabel(visit.serviceType)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {visit.observations && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700"><strong>Observações:</strong> {visit.observations}</p>
                        </div>
                      )}
                      
                      {visit.photos && visit.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">Fotos da Visita ({visit.photos.length})</p>
                          <div className="flex space-x-2">
                            {visit.photos.map((photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={`/uploads/${photo}`}
                                  alt={`Foto ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                  onClick={() => {
                                    // Implementar visualização de imagem
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredVisits.length === 0 && (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma visita encontrada com os filtros aplicados.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wells">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Poços</h2>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {wells?.wells.map((well) => {
                    const lastVisit = visits?.visits
                      .filter(v => v.wellId === well.id)
                      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

                    return (
                      <div key={well.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{well.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Cliente: {well.client.user.name} • Localização: {well.location}
                            </p>
                            <p className="text-sm text-gray-600">
                              Tipo: {well.type || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getWellStatusBadge(well.status)}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>Última Manutenção:</strong> {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy') : 'Nunca'}</p>
                          <p><strong>Status:</strong> {well.status}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!wells?.wells || wells.wells.length === 0) && (
                    <div className="text-center py-12">
                      <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum poço cadastrado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Agendamentos Futuros</h2>
                  <div className="text-sm text-gray-500">
                    Total: {scheduledVisits?.scheduledVisits?.length || 0} agendamentos
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {scheduledVisits?.scheduledVisits && scheduledVisits.scheduledVisits.length > 0 ? (
                    scheduledVisits.scheduledVisits.map((scheduled) => (
                      <div key={scheduled.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {scheduled.well?.name || 'Poço sem nome'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Cliente: {scheduled.well?.client?.user?.name || 'N/A'} • 
                              Prestador: {scheduled.provider?.user?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Data:</strong> {format(new Date(scheduled.scheduledDate), 'dd/MM/yyyy')} • 
                              <strong>Tipo:</strong> {scheduled.visitType}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Agendado
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm text-gray-600">
                          <p><strong>Localização:</strong> {scheduled.well?.location || 'N/A'}</p>
                          <p><strong>Status do Poço:</strong> {scheduled.well?.status || 'N/A'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {scheduledVisits ? 'Nenhum agendamento futuro.' : 'Carregando agendamentos...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Todos os Clientes do Sistema</h2>
                  <div className="text-sm text-gray-500">
                    Total: {clients?.clients?.length || 0} clientes
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {clients?.clients && clients.clients.length > 0 ? (
                    clients.clients.map((client) => {
                      const clientWells = wells?.wells?.filter(w => w.clientId === client.id) || [];
                      const clientVisits = visits?.visits?.filter(v => clientWells.some(w => w.id === v.wellId)) || [];
                      const lastVisit = clientVisits
                        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

                      return (
                        <div key={client.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {client.user.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Email:</strong> {client.user.email} • 
                                <strong>Telefone:</strong> {client.phone || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Endereço:</strong> {client.address || 'N/A'}
                              </p>
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                <span><strong>Poços:</strong> {clientWells.length}</span>
                                <span><strong>Visitas:</strong> {clientVisits.length}</span>
                                <span><strong>Última visita:</strong> {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy') : 'Nunca'}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetClientPassword(client.id, client.user.name)}
                                className="text-xs px-3 py-1 h-7"
                              >
                                <Key className="h-3 w-3 mr-1" />
                                Resetar Senha
                              </Button>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ativo
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {clients ? 'Nenhum cliente cadastrado.' : 'Carregando clientes...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials">
            <div className="space-y-6">
              
              {/* Resumo do Consumo Total */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Consumido</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {materialConsumption?.consumption?.reduce((acc, item) => acc + item.totalKilograms, 0).toFixed(1) || 0} kg
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Tipos de Materiais</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {materialConsumption?.consumption?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Maior Consumo</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {materialConsumption?.consumption?.[0]?.materialType || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Consumo Total de Materiais */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Consumo por Material (Quilogramas)</h2>
                    <div className="text-sm text-gray-500">
                      Dados de {visits?.visits?.length || 0} visitas realizadas
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {materialConsumption?.consumption && materialConsumption.consumption.length > 0 ? (
                    <div className="space-y-6">
                      {materialConsumption.consumption.map((item, index) => {
                        const maxQuantity = Math.max(...materialConsumption.consumption.map(c => c.totalKilograms));
                        const percentage = maxQuantity > 0 ? (item.totalKilograms / maxQuantity) * 100 : 0;
                        
                        return (
                          <div key={index} className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="font-semibold text-gray-900 text-lg">{item.materialType}</span>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span>• {item.visitCount} visitas</span>
                                  <span>• Média: {item.averagePerVisit}g por visita</span>
                                  <span>• Total: {item.totalGrams?.toLocaleString() || 0}g</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-2xl text-blue-600">{item.totalKilograms} kg</div>
                                <div className="text-sm text-gray-500">
                                  {percentage.toFixed(1)}% do total
                                </div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2" 
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              >
                                {percentage > 15 && (
                                  <span className="text-white text-xs font-medium">
                                    {item.totalKilograms} kg
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        {materialConsumption ? 'Nenhum consumo de materiais registrado ainda.' : 'Carregando dados de consumo...'}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Os dados aparecerão quando os prestadores registrarem visitas com materiais utilizados.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="providers">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Prestadores Cadastrados</h2>
                  <div className="text-sm text-gray-500">
                    Total: {providers?.providers?.length || 0} prestadores
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {providers?.providers && providers.providers.length > 0 ? (
                    providers.providers.map((provider) => (
                      <div key={provider.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{provider.user.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Email: {provider.user.email} • Telefone: {provider.phone || 'Não informado'}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-700">
                                <strong>Especialidades:</strong> {provider.specialties?.join(', ') || 'Não informado'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(provider.id, provider.user.name)}
                              disabled={resetPasswordMutation.isPending}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Resetar Senha
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProvider(provider.id, provider.user.name)}
                              disabled={deleteProviderMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm text-gray-600">
                          <p><strong>ID do Prestador:</strong> {provider.id}</p>
                          <p><strong>Cadastrado em:</strong> {provider.user.userType}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {providers ? 'Nenhum prestador cadastrado ainda.' : 'Carregando prestadores...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Cadastrar Prestador de Serviço</span>
                </CardTitle>
                <CardDescription>
                  Apenas administradores podem cadastrar novos prestadores de serviço no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...providerForm}>
                  <form onSubmit={providerForm.handleSubmit(onSubmitProvider)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={providerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Digite o email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={providerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite a senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={providerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={providerForm.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Especialidades</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Manutenção preventiva, Limpeza de poços, Troca de bombas (separadas por vírgula)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerProviderMutation.isPending}
                    >
                      {registerProviderMutation.isPending ? "Cadastrando..." : "Cadastrar Prestador"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
