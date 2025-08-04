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
import { Users, Droplet, Bolt, CalendarCheck, Check, UserPlus, Clock, AlertTriangle, FileText, BarChart3, CheckCircle, FlaskConical, Search, MapPin, Camera, TrendingUp, Wrench, Activity } from "lucide-react";
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
  monthlyVisits: number;
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

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: visits } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/admin/visits'],
  });

  const { data: wells } = useQuery<{ wells: WellWithClient[] }>({
    queryKey: ['/api/admin/wells'],
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
      const userResponse = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Create provider profile
      await apiRequest('/api/providers', {
        method: 'POST',
        body: JSON.stringify({
          userId: userResponse.id,
          specialties: data.specialties.split(',').map(s => s.trim()),
          phone: data.phone,
        }),
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
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao cadastrar o prestador.",
        variant: "destructive",
      });
    },
  });

  const onSubmitProvider = (data: ProviderRegisterForm) => {
    registerProviderMutation.mutate(data);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-2">Bem-vindo, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
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
            title="Poços Ativos"
            value={activeWells}
            icon={Droplet}
            variant="primary"
          />
          <StatsCard
            title="Visitas Concluídas"
            value={completedVisits}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Visitas Pendentes"
            value={pendingVisits}
            icon={Clock}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="visits">Visitas Completas</TabsTrigger>
            <TabsTrigger value="wells">Status dos Poços</TabsTrigger>
            <TabsTrigger value="materials">Materiais Utilizados</TabsTrigger>
            <TabsTrigger value="providers">Prestadores</TabsTrigger>
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
                  <h2 className="text-xl font-semibold text-gray-900">Todas as Visitas do Sistema</h2>
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
                              Tipo: {well.wellType} • Profundidade: {well.depth}m
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getWellStatusBadge(well.status)}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>Última Manutenção:</strong> {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy') : 'Nunca'}</p>
                          {well.lastMaintenanceDate && (
                            <p><strong>Próxima Manutenção:</strong> {format(new Date(well.lastMaintenanceDate), 'dd/MM/yyyy')}</p>
                          )}
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

          <TabsContent value="materials">
            <MaterialConsumptionReport />
          </TabsContent>

          <TabsContent value="providers">
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
