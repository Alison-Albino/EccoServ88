import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { StatsCard } from "@/components/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ImageViewer } from "@/components/image-viewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Droplet, CheckCircle, Clock, Search, Calendar, Wrench, MapPin, Camera, AlertCircle, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { type VisitWithDetails, type ScheduledVisitWithDetails, type Well } from "@shared/schema";
import { format } from "date-fns";

// Schema for well creation
const wellSchema = z.object({
  name: z.string().min(1, "Nome do poço é obrigatório"),
  type: z.string().min(1, "Tipo do poço é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  depth: z.string().min(1, "Profundidade é obrigatória"),
  diameter: z.string().min(1, "Diâmetro é obrigatório"),
  installationDate: z.string().min(1, "Data de instalação é obrigatória"),
  description: z.string().optional(),
});

type WellFormData = z.infer<typeof wellSchema>;

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visitFilters, setVisitFilters] = useState({
    searchQuery: "",
    startDate: "",
    endDate: "",
  });
  const [isWellDialogOpen, setIsWellDialogOpen] = useState(false);

  const { data: visits, isLoading } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/clients', user?.client?.id, 'visits'],
    enabled: !!user?.client?.id,
  });

  const { data: scheduledVisits, isLoading: isLoadingScheduled } = useQuery<{ scheduledVisits: ScheduledVisitWithDetails[] }>({
    queryKey: ['/api/clients', user?.client?.id, 'scheduled-visits'],
    enabled: !!user?.client?.id,
  });

  // Query for client's wells
  const { data: wells, refetch: refetchWells } = useQuery<{ wells: Well[] }>({
    queryKey: ['/api/clients', user?.client?.id, 'wells'],
    enabled: !!user?.client?.id,
  });

  // Form for creating wells
  const wellForm = useForm<WellFormData>({
    resolver: zodResolver(wellSchema),
    defaultValues: {
      name: "",
      type: "",
      location: "",
      depth: "",
      diameter: "",
      installationDate: "",
      description: "",
    },
  });

  // Mutation for creating wells
  const createWellMutation = useMutation({
    mutationFn: async (data: WellFormData) => {
      const wellData = {
        ...data,
        clientId: user?.client?.id,
        status: 'active' as const,
        depth: parseFloat(data.depth),
        diameter: parseFloat(data.diameter),
        installationDate: new Date(data.installationDate),
      };
      return await apiRequest('POST', '/api/wells', wellData);
    },
    onSuccess: () => {
      toast({
        title: "Poço cadastrado com sucesso!",
        description: "O seu poço foi adicionado ao sistema.",
      });
      wellForm.reset();
      setIsWellDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients', user?.client?.id, 'wells'] });
      refetchWells();
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao cadastrar o poço.",
        variant: "destructive",
      });
    },
  });

  // Filter visits based on search and date filters
  const filteredVisits = visits?.visits.filter(visit => {
    const matchesSearch = !visitFilters.searchQuery || 
      visit.id.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
      visit.well.name.toLowerCase().includes(visitFilters.searchQuery.toLowerCase()) ||
      visit.observations.toLowerCase().includes(visitFilters.searchQuery.toLowerCase());
    
    const matchesDate = (!visitFilters.startDate || new Date(visit.visitDate) >= new Date(visitFilters.startDate)) &&
      (!visitFilters.endDate || new Date(visit.visitDate) <= new Date(visitFilters.endDate));
    
    return matchesSearch && matchesDate;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
      in_progress: { label: "Em Andamento", className: "bg-blue-100 text-blue-800" },
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
      scheduled: { label: "Agendado", className: "bg-purple-100 text-purple-800" },
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

  const handleWellSubmit = (data: WellFormData) => {
    createWellMutation.mutate(data);
  };

  // Extract unique wells from visits
  const activeWells = visits?.visits.reduce((acc, visit) => {
    if (!acc.some(well => well.id === visit.well.id)) {
      acc.push(visit.well);
    }
    return acc;
  }, [] as any[]) || [];

  const totalVisits = visits?.visits.length || 0;
  const completedVisits = visits?.visits.filter(v => v.status === 'completed').length || 0;
  const scheduledVisitsCount = scheduledVisits?.scheduledVisits.length || 0;
  const lastVisit = visits?.visits
    .filter(v => v.status === 'completed')
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

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
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Meus Poços</h2>
                  <Dialog open={isWellDialogOpen} onOpenChange={setIsWellDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Cadastrar Novo Poço
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Cadastrar Novo Poço</DialogTitle>
                      </DialogHeader>
                      <Form {...wellForm}>
                        <form onSubmit={wellForm.handleSubmit(handleWellSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={wellForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome do Poço</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: Poço Principal" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={wellForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tipo do Poço</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
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
                          </div>
                          
                          <FormField
                            control={wellForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Localização</FormLabel>
                                <FormControl>
                                  <Input placeholder="Endereço completo do poço" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={wellForm.control}
                              name="depth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Profundidade (metros)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Ex: 120" {...field} />
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
                                  <FormLabel>Diâmetro (polegadas)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Ex: 6" {...field} />
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
                                  <FormLabel>Data de Instalação</FormLabel>
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
                                    placeholder="Informações adicionais sobre o poço..."
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsWellDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createWellMutation.isPending}
                            >
                              {createWellMutation.isPending ? "Cadastrando..." : "Cadastrar Poço"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="p-6">
                {wells?.wells && wells.wells.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wells.wells.map((well) => (
                      <div key={well.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <Droplet className="h-6 w-6 text-blue-600 mr-3" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{well.name}</h3>
                              <p className="text-sm text-gray-500 capitalize">{well.type}</p>
                            </div>
                          </div>
                          {getWellStatusBadge(well.status)}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{well.location}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <span className="font-medium">Profundidade:</span>
                              <p>{well.depth}m</p>
                            </div>
                            <div>
                              <span className="font-medium">Diâmetro:</span>
                              <p>{well.diameter}"</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="font-medium">Instalado em:</span>
                            <p>{format(new Date(well.installationDate), 'dd/MM/yyyy')}</p>
                          </div>
                          {well.description && (
                            <div className="mt-3">
                              <span className="font-medium">Descrição:</span>
                              <p className="text-xs text-gray-500 mt-1">{well.description}</p>
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
                      Clique em "Cadastrar Novo Poço" para adicionar seu primeiro poço.
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeWells.map((well) => (
                      <div key={well.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{well.name}</h3>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {well.location}
                            </p>
                          </div>
                          {getWellStatusBadge(well.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tipo:</span>
                            <span className="capitalize">{well.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Última Manutenção:</span>
                            <span>{well.lastMaintenanceDate ? format(new Date(well.lastMaintenanceDate), 'dd/MM/yyyy') : 'N/A'}</span>
                          </div>
                          {lastVisit && lastVisit.well.id === well.id && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500">Última visita: {format(new Date(lastVisit.visitDate), 'dd/MM/yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Visits Tab */}
          <TabsContent value="visits">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Visitas Prestadas</h2>
              </div>
              
              <div className="p-6">
                {/* Search and Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col">
                    <Label className="text-sm text-gray-600 mb-1">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="ID, poço ou observações..."
                        value={visitFilters.searchQuery}
                        onChange={(e) => setVisitFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <Label className="text-sm text-gray-600 mb-1">Data início</Label>
                    <Input
                      type="date"
                      value={visitFilters.startDate}
                      onChange={(e) => setVisitFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <Label className="text-sm text-gray-600 mb-1">Data fim</Label>
                    <Input
                      type="date"
                      value={visitFilters.endDate}
                      onChange={(e) => setVisitFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                {/* Results info */}
                <div className="text-sm text-gray-500 mb-4">
                  Mostrando {filteredVisits.length} de {totalVisits} visitas
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredVisits.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma visita encontrada.</p>
                    {totalVisits > 0 && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setVisitFilters({ searchQuery: "", startDate: "", endDate: "" })}
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVisits.map((visit) => (
                      <div key={visit.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {visit.well.name} - {getServiceTypeLabel(visit.serviceType)}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                                ID: {visit.id}
                              </span>
                              {format(new Date(visit.visitDate), 'dd/MM/yyyy')} • {visit.well.location}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                              <span className="flex items-center">
                                <Camera className="h-4 w-4 mr-1" />
                                {visit.photos?.length || 0} fotos
                              </span>
                              {visit.provider && (
                                <span>Técnico: {visit.provider.user.name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(visit.status)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{visit.observations}</p>
                        
                        {visit.photos && visit.photos.length > 0 && (
                          <div className="flex justify-end">
                            <ImageViewer images={visit.photos} className="text-sm" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Scheduled Visits Tab */}
          <TabsContent value="scheduled">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Próximos Agendamentos</h2>
              </div>
              
              <div className="p-6">
                {isLoadingScheduled ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : !scheduledVisits?.scheduledVisits.length ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum agendamento futuro.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledVisits.scheduledVisits.map((scheduled) => (
                      <div key={scheduled.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {scheduled.well.name} - {getServiceTypeLabel(scheduled.serviceType)}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(new Date(scheduled.scheduledDate), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {scheduled.well.location}
                            </p>
                            {scheduled.provider && (
                              <p className="text-sm text-gray-500 mt-1">
                                Técnico: {scheduled.provider.user.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(scheduled.status)}
                          </div>
                        </div>
                        
                        {scheduled.notes && (
                          <p className="text-sm text-gray-700">{scheduled.notes}</p>
                        )}
                      </div>
                    ))}
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


