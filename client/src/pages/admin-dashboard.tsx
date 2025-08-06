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

const clientRegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  address: z.string().min(5, "Endereço é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
});

const wellRegisterSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  name: z.string().min(2, "Nome do poço é obrigatório"),
  type: z.string().min(1, "Tipo do poço é obrigatório"),
  location: z.string().min(5, "Localização é obrigatória"),
  depth: z.string().min(1, "Profundidade é obrigatória"),
  diameter: z.string().min(1, "Diâmetro é obrigatório"),
  installationDate: z.string().min(1, "Data de instalação é obrigatória"),
  description: z.string().optional(),
});

type ProviderRegisterForm = z.infer<typeof providerRegisterSchema>;
type ClientRegisterForm = z.infer<typeof clientRegisterSchema>;
type WellRegisterForm = z.infer<typeof wellRegisterSchema>;

interface AdminStats {
  totalClients: number;
  totalProviders: number;
  totalWells: number;
  totalVisits: number;
  monthlyVisits: number;
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

  // Client search state for well registration
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);

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

  const clientForm = useForm<ClientRegisterForm>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      address: "",
      phone: "",
    },
  });

  const wellForm = useForm<WellRegisterForm>({
    resolver: zodResolver(wellRegisterSchema),
    defaultValues: {
      clientId: "",
      name: "",
      type: "",
      location: "",
      depth: "",
      diameter: "",
      installationDate: "",
      description: "",
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

  // Filter clients based on search term (name or CPF)
  const filteredClients = clients?.clients?.filter((client) => {
    if (!clientSearch) return true;
    const searchTerm = clientSearch.toLowerCase();
    return (
      client.user.name.toLowerCase().includes(searchTerm) ||
      client.cpf.toLowerCase().includes(searchTerm)
    );
  }) || [];

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

  // Client registration mutation
  const registerClientMutation = useMutation({
    mutationFn: async (data: ClientRegisterForm) => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          password: "123456", // Senha padrão
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao cadastrar cliente');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente cadastrado com sucesso!",
        description: "Cliente criado com senha padrão: 123456",
      });
      clientForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao cadastrar cliente",
        variant: "destructive",
      });
    },
  });

  // Well registration mutation
  const registerWellMutation = useMutation({
    mutationFn: async (data: WellRegisterForm) => {
      const wellData = {
        ...data,
        depth: parseFloat(data.depth),
        diameter: parseFloat(data.diameter),
        status: "active",
      };
      const response = await fetch('/api/wells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wellData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao cadastrar poço');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Poço cadastrado com sucesso!",
        description: "O poço foi adicionado ao sistema.",
      });
      wellForm.reset();
      setClientSearch("");
      setShowClientSearch(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wells'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao cadastrar poço",
        variant: "destructive",
      });
    },
  });

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
            variant="error"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max min-w-full h-auto p-1 space-x-1">
              <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="visits" className="whitespace-nowrap px-3 py-2 text-sm">
                Visitas
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="whitespace-nowrap px-3 py-2 text-sm">
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="clients" className="whitespace-nowrap px-3 py-2 text-sm">
                Clientes
              </TabsTrigger>
              <TabsTrigger value="wells" className="whitespace-nowrap px-3 py-2 text-sm">
                Poços
              </TabsTrigger>
              <TabsTrigger value="materials" className="whitespace-nowrap px-3 py-2 text-sm">
                Materiais
              </TabsTrigger>
              <TabsTrigger value="providers" className="whitespace-nowrap px-3 py-2 text-sm">
                Prestadores
              </TabsTrigger>
              <TabsTrigger value="register" className="whitespace-nowrap px-3 py-2 text-sm">
                Cadastrar Prestador
              </TabsTrigger>
              <TabsTrigger value="register-client" className="whitespace-nowrap px-3 py-2 text-sm">
                Cadastrar Cliente
              </TabsTrigger>
              <TabsTrigger value="register-well" className="whitespace-nowrap px-3 py-2 text-sm">
                Cadastrar Poço
              </TabsTrigger>
            </TabsList>
          </div>

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
                            {format(new Date(visit.visitDate), 'dd/MM/yyyy HH:mm')} • {getServiceTypeLabel(visit.serviceType)}
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
                                {well.client.user.name} • Última visita: {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy HH:mm') : 'N/A'}
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
                              <p><strong>Data:</strong> {format(new Date(visit.visitDate), 'dd/MM/yyyy HH:mm')}</p>
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
                          <p><strong>Última Manutenção:</strong> {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy HH:mm') : 'Nunca'}</p>
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
                              <strong>Data:</strong> {format(new Date(scheduled.scheduledDate), 'dd/MM/yyyy HH:mm')} • 
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
                                <span><strong>Última visita:</strong> {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy HH:mm') : 'Nunca'}</span>
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
                              <Input 
                                type="email" 
                                placeholder="Digite o email" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.value.toLowerCase());
                                }}
                              />
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

          <TabsContent value="register-client">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Cadastrar Novo Cliente
                </CardTitle>
                <CardDescription>
                  Adicione um novo cliente ao sistema com senha padrão 123456
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...clientForm}>
                  <form onSubmit={clientForm.handleSubmit((data) => registerClientMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={clientForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="João da Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00" 
                                {...field}
                                onChange={(e) => {
                                  // Auto format CPF
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 11) {
                                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                                    field.onChange(value);
                                  }
                                }}
                                maxLength={14}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={clientForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="joao@email.com" 
                                type="email" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.value.toLowerCase());
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(11) 99999-9999" 
                                {...field}
                                onChange={(e) => {
                                  // Auto format phone
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 11) {
                                    if (value.length <= 10) {
                                      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                                    } else {
                                      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                                    }
                                    field.onChange(value);
                                  }
                                }}
                                maxLength={15}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={clientForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço Completo *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Rua das Flores, 123, Centro, São Paulo - SP, CEP: 01234-567" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">i</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Senha Padrão</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            O cliente será criado com a senha padrão <strong>123456</strong>. 
                            Ele poderá alterar a senha após o primeiro login.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerClientMutation.isPending}
                    >
                      {registerClientMutation.isPending ? "Cadastrando..." : "Cadastrar Cliente"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register-well">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="h-5 w-5" />
                  Cadastrar Novo Poço
                </CardTitle>
                <CardDescription>
                  Adicione um novo poço para um cliente existente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...wellForm}>
                  <form onSubmit={wellForm.handleSubmit((data) => registerWellMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={wellForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente *</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Buscar por nome ou CPF..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowClientSearch(!showClientSearch)}
                                  >
                                    <Search className="h-4 w-4" />
                                  </Button>
                                </div>
                                {(showClientSearch || clientSearch) && (
                                  <div className="border rounded-md max-h-40 overflow-y-auto">
                                    {!clients?.clients ? (
                                      <div className="p-3 text-sm text-gray-500">Carregando clientes...</div>
                                    ) : filteredClients.length > 0 ? (
                                      filteredClients.map((client) => (
                                        <div
                                          key={client.id}
                                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                                            field.value === client.id ? 'bg-blue-50 border-blue-200' : ''
                                          }`}
                                          onClick={() => {
                                            field.onChange(client.id);
                                            setShowClientSearch(false);
                                            setClientSearch(client.user.name);
                                          }}
                                        >
                                          <div className="font-medium text-sm">{client.user.name}</div>
                                          <div className="text-xs text-gray-500">CPF: {client.cpf}</div>
                                          <div className="text-xs text-gray-500">{client.address}</div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-3 text-sm text-gray-500">
                                        {clientSearch ? 'Nenhum cliente encontrado para esta busca' : 'Nenhum cliente encontrado'}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={wellForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Poço *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Poço Principal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={wellForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo do Poço *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="artesiano">Artesiano</SelectItem>
                                <SelectItem value="semi-artesiano">Semi-artesiano</SelectItem>
                                <SelectItem value="freático">Freático</SelectItem>
                                <SelectItem value="tubular">Tubular</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={wellForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização *</FormLabel>
                            <FormControl>
                              <Input placeholder="Endereço completo do poço" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={wellForm.control}
                        name="depth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profundidade (m) *</FormLabel>
                            <FormControl>
                              <Input placeholder="100" type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={wellForm.control}
                        name="diameter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diâmetro (cm) *</FormLabel>
                            <FormControl>
                              <Input placeholder="15" type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={wellForm.control}
                        name="installationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Instalação *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={wellForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações sobre o poço..." 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerWellMutation.isPending}
                    >
                      {registerWellMutation.isPending ? "Cadastrando..." : "Cadastrar Poço"}
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
