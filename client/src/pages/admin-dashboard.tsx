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
import { Users, Droplet, Bolt, CalendarCheck, Check, UserPlus, Clock, AlertTriangle, FileText, DollarSign, CheckCircle, FlaskConical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type VisitWithDetails, type WellWithClient, type InvoiceWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { InvoiceList } from "@/components/invoice-list";
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

  const { data: invoices } = useQuery<{ invoices: InvoiceWithDetails[] }>({
    queryKey: ['/api/invoices'],
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

  const getActivityIcon = (type: string) => {
    const icons = {
      visit_completed: Check,
      user_added: UserPlus,
      visit_scheduled: Clock,
      maintenance_needed: AlertTriangle,
    };
    const IconComponent = icons[type as keyof typeof icons] || Check;
    return IconComponent;
  };

  // Mock recent activity data since it's not in the schema
  const recentActivity = [
    {
      id: '1',
      type: 'visit_completed',
      message: 'Carlos Santos completou manutenção no Poço 01 de João Silva',
      time: 'Há 2 horas',
    },
    {
      id: '2',
      type: 'user_added',
      message: 'Novo cliente Ana Costa foi cadastrado no sistema',
      time: 'Há 4 horas',
    },
    {
      id: '3',
      type: 'visit_scheduled',
      message: 'Maria Oliveira agendou visita para Poço 02 - Industrial',
      time: 'Há 6 horas',
    },
    {
      id: '4',
      type: 'maintenance_needed',
      message: 'Poço 05 necessita manutenção urgente - Pedro Lima',
      time: 'Há 1 dia',
    },
  ];

  const totalInvoices = invoices?.invoices.length || 0;
  const paidInvoices = invoices?.invoices.filter(inv => inv.status === 'paid').length || 0;
  const pendingInvoices = invoices?.invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length || 0;
  const totalRevenue = invoices?.invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-2">Bem-vindo, {user?.name}! Visão geral do sistema EccoServ.</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Clientes"
            value={stats?.totalClients || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Poços"
            value={stats?.totalWells || 0}
            icon={Droplet}
            variant="success"
          />
          <StatsCard
            title="Prestadores"
            value={stats?.totalProviders || 0}
            icon={Bolt}
            variant="warning"
          />
          <StatsCard
            title="Receita Total"
            value={`R$ ${totalRevenue.toFixed(2).replace('.', ',')}`}
            icon={DollarSign}
            variant="error"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="wells">Poços</TabsTrigger>
            <TabsTrigger value="visits">Visitas</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="providers">Prestadores</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Atividade Recente</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const iconColorClass = {
                    visit_completed: 'bg-success/10 text-success',
                    user_added: 'bg-primary/10 text-primary',
                    visit_scheduled: 'bg-warning/10 text-warning',
                    maintenance_needed: 'bg-error/10 text-error',
                  }[activity.type] || 'bg-success/10 text-success';

                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColorClass}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Wells Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Status dos Poços</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {wells?.wells.slice(0, 6).map((well) => {
                  // Find the last visit for this well
                  const lastVisit = visits?.visits
                    .filter(v => v.wellId === well.id)
                    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

                  return (
                    <div key={well.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Droplet className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {well.name} - {well.client.user.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Última manutenção: {lastVisit ? format(new Date(lastVisit.visitDate), 'dd/MM/yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(well.status)}
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
                            {getStatusBadge(well.status)}
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

          <TabsContent value="visits">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Visitas Recentes</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {visits?.visits.slice(0, 10).map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {visit.well.name} - {visit.well.client.user.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(visit.visitDate), 'dd/MM/yyyy')} • Prestador: {visit.provider.user.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={visit.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                            {visit.status === 'completed' ? 'Concluída' : 'Em Andamento'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">{visit.observations}</p>
                    </div>
                  ))}
                  
                  {(!visits?.visits || visits.visits.length === 0) && (
                    <div className="text-center py-12">
                      <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma visita registrada.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
                      <p className="text-sm text-gray-600">Total de Faturas</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
                      <p className="text-sm text-gray-600">Faturas Pagas</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-warning" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{pendingInvoices}</p>
                      <p className="text-sm text-gray-600">Faturas Pendentes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Todas as Faturas</h2>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span>Receita Total: R$ {totalRevenue.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {invoices?.invoices ? (
                    <InvoiceList 
                      invoices={invoices.invoices} 
                      userType="admin"
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
