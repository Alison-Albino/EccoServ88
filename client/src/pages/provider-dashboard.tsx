import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CloudUpload, Wrench, Camera, Fan, Cog, FileText, Plus, DollarSign, FlaskConical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type VisitWithDetails, type InvoiceWithDetails, AVAILABLE_MATERIALS, type AvailableMaterial } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { InvoiceForm } from "@/components/invoice-form";
import { InvoiceList } from "@/components/invoice-list";


interface Client {
  id: string;
  user: { id: string; name: string; email: string };
}

interface Well {
  id: string;
  name: string;
  clientId: string;
  client: { user: { name: string } };
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [visitForm, setVisitForm] = useState({
    visitDate: "",
    clientId: "",
    wellId: "",
    serviceType: "",
    visitType: "", // 'periodic' ou 'unique'
    nextVisitDate: "",
    observations: "",
    materials: [] as Array<{ type: AvailableMaterial; quantity: number }>,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedVisitForInvoice, setSelectedVisitForInvoice] = useState<VisitWithDetails | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const { data: clients } = useQuery<{ clients: Client[] }>({
    queryKey: ['/api/clients'],
  });

  const { data: wells } = useQuery<{ wells: Well[] }>({
    queryKey: ['/api/wells'],
  });

  const { data: visits, isLoading } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/providers', user?.provider?.id, 'visits'],
    enabled: !!user?.provider?.id,
  });

  const { data: invoices } = useQuery<{ invoices: InvoiceWithDetails[] }>({
    queryKey: ['/api/providers', user?.provider?.id, 'invoices'],
    enabled: !!user?.provider?.id,
  });

  const createVisitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/visits', formData);
    },
    onSuccess: () => {
      toast({
        title: "Visita registrada!",
        description: "A visita foi registrada com sucesso.",
      });
      setVisitForm({
        visitDate: "",
        clientId: "",
        wellId: "",
        serviceType: "",
        visitType: "",
        nextVisitDate: "",
        observations: "",
        materials: [],
      });
      setPhotos([]);
      queryClient.invalidateQueries({ queryKey: ['/api/providers', user?.provider?.id, 'visits'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar visita",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Formulário submetido:', visitForm);
    console.log('User completo:', user);
    console.log('User provider:', user?.provider);
    
    if (!user?.provider?.id) {
      console.error('Provider ID não encontrado');
      toast({
        title: "Erro de autenticação",
        description: "Perfil de prestador não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    // Validação dos campos obrigatórios
    if (!visitForm.visitDate || !visitForm.clientId || !visitForm.wellId || !visitForm.serviceType || !visitForm.visitType || !visitForm.observations) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('wellId', visitForm.wellId);
    formData.append('providerId', user.provider.id);
    formData.append('visitDate', visitForm.visitDate);
    formData.append('serviceType', visitForm.serviceType);
    formData.append('visitType', visitForm.visitType);
    // Only append nextVisitDate if it has a value
    if (visitForm.nextVisitDate && visitForm.nextVisitDate.trim() !== '') {
      formData.append('nextVisitDate', visitForm.nextVisitDate);
    }
    formData.append('observations', visitForm.observations);
    formData.append('status', 'completed');
    formData.append('materials', JSON.stringify(visitForm.materials));

    photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    console.log('Enviando dados para o backend...');
    createVisitMutation.mutate(formData);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { label: "Concluído", className: "bg-success/10 text-success" },
      in_progress: { label: "Em Andamento", className: "bg-warning/10 text-warning" },
      pending: { label: "Em Análise", className: "bg-warning/10 text-warning" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getServiceIcon = (serviceType: string) => {
    const icons = {
      'manutencao-preventiva': Wrench,
      'manutencao-corretiva': Wrench,
      'limpeza': Fan,
      'instalacao': Cog,
      'reparo': Wrench,
      'inspecao': Wrench,
    };
    const IconComponent = icons[serviceType as keyof typeof icons] || Wrench;
    return <IconComponent className="h-4 w-4" />;
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

  const filteredWells = wells?.wells.filter(well => 
    !visitForm.clientId || well.clientId === visitForm.clientId
  ) || [];

  const handleCreateInvoice = (visit: VisitWithDetails) => {
    setSelectedVisitForInvoice(visit);
    setIsInvoiceDialogOpen(true);
  };

  const handleInvoiceSuccess = () => {
    setIsInvoiceDialogOpen(false);
    setSelectedVisitForInvoice(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="visits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visits">Registrar Visita</TabsTrigger>
            <TabsTrigger value="my-visits">Minhas Visitas</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          <TabsContent value="visits">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* New Visit Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Registrar Nova Visita</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitDate">Data da Visita *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={visitForm.visitDate}
                    onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientId">Cliente *</Label>
                  <Select
                    value={visitForm.clientId}
                    onValueChange={(value) => setVisitForm({ ...visitForm, clientId: value, wellId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="wellId">Poço *</Label>
                <Select
                  value={visitForm.wellId}
                  onValueChange={(value) => setVisitForm({ ...visitForm, wellId: value })}
                  disabled={!visitForm.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o poço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredWells.map((well) => (
                      <SelectItem key={well.id} value={well.id}>
                        {well.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="serviceType">Tipo de Serviço *</Label>
                <Select
                  value={visitForm.serviceType}
                  onValueChange={(value) => setVisitForm({ ...visitForm, serviceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manutencao-preventiva">Manutenção Preventiva</SelectItem>
                    <SelectItem value="manutencao-corretiva">Manutenção Corretiva</SelectItem>
                    <SelectItem value="limpeza">Limpeza</SelectItem>
                    <SelectItem value="instalacao">Instalação</SelectItem>
                    <SelectItem value="reparo">Reparo</SelectItem>
                    <SelectItem value="inspecao">Inspeção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitType">Tipo de Visita *</Label>
                  <Select
                    value={visitForm.visitType}
                    onValueChange={(value) => setVisitForm({ ...visitForm, visitType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unique">Visita Única</SelectItem>
                      <SelectItem value="periodic">Visita Periódica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {visitForm.visitType === 'periodic' && (
                  <div>
                    <Label htmlFor="nextVisitDate">Data da Próxima Visita</Label>
                    <Input
                      id="nextVisitDate"
                      type="date"
                      value={visitForm.nextVisitDate}
                      onChange={(e) => setVisitForm({ ...visitForm, nextVisitDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label>Materiais Utilizados</Label>
                <div className="mt-2 space-y-3 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">Marque os materiais químicos utilizados nesta visita:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_MATERIALS.map((material) => (
                      <div key={material} className="flex items-center space-x-2">
                        <Checkbox
                          id={material}
                          checked={visitForm.materials.some((m) => m.type === material)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setVisitForm({
                                ...visitForm,
                                materials: [...visitForm.materials, { type: material, quantity: 0 }]
                              });
                            } else {
                              setVisitForm({
                                ...visitForm,
                                materials: visitForm.materials.filter((m) => m.type !== material)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={material} className="text-sm font-normal">
                          {material}
                        </Label>
                        {visitForm.materials.some((m) => m.type === material) && (
                          <div className="flex items-center space-x-1 ml-2">
                            <Input
                              type="number"
                              placeholder="Quantidade (g)"
                              className="w-20 h-8 text-xs"
                              min="0"
                              step="0.1"
                              value={visitForm.materials.find((m) => m.type === material)?.quantity || ''}
                              onChange={(e) => {
                                const newMaterials = visitForm.materials.map((m) =>
                                  m.type === material
                                    ? { ...m, quantity: parseFloat(e.target.value) || 0 }
                                    : m
                                );
                                setVisitForm({ ...visitForm, materials: newMaterials });
                              }}
                            />
                            <span className="text-xs text-gray-500">g</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="observations">Observações *</Label>
                <Textarea
                  id="observations"
                  rows={4}
                  placeholder="Descreva os serviços realizados, condições encontradas, materiais utilizados..."
                  value={visitForm.observations}
                  onChange={(e) => setVisitForm({ ...visitForm, observations: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="photos">Fotos do Serviço</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('photos')?.click()}
                >
                  <CloudUpload className="text-gray-400 text-3xl h-12 w-12 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Clique para fazer upload ou arraste as fotos</p>
                  <p className="text-gray-400 text-sm">PNG, JPG até 10MB cada</p>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                {photos.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {photos.length} foto(s) selecionada(s)
                  </p>
                )}
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createVisitMutation.isPending}
                  onClick={(e) => {
                    console.log('Botão clicado!', e);
                  }}
                >
                  {createVisitMutation.isPending ? "Registrando..." : "Registrar Visita"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="px-6"
                  onClick={() => {
                    setVisitForm({
                      visitDate: "",
                      clientId: "",
                      wellId: "",
                      serviceType: "",
                      visitType: "",
                      nextVisitDate: "",
                      observations: "",
                      materials: [],
                    });
                    setPhotos([]);
                  }}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </div>

          {/* Recent Visits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Minhas Visitas Recentes</h2>
            </div>
            
            <div className="p-6">
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
              ) : (
                <div className="space-y-4">
                  {visits?.visits.slice(0, 5).map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {visit.well.client.user.name} - {visit.well.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(visit.visitDate), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        {getStatusBadge(visit.status)}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{visit.observations}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          {getServiceIcon(visit.serviceType)}
                          <span className="ml-1">{getServiceTypeLabel(visit.serviceType)}</span>
                        </span>
                        <span className="flex items-center">
                          <Camera className="h-4 w-4 mr-1" />
                          {visit.photos?.length || 0} fotos
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {(!visits?.visits || visits.visits.length === 0) && (
                    <p className="text-center text-gray-500">Nenhuma visita registrada ainda.</p>
                  )}
                </div>
              )}
            </div>
          </div>
            </div>
          </TabsContent>


          <TabsContent value="my-visits">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Todas as Minhas Visitas</h2>
                </div>
                
                <div className="p-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {visits?.visits.map((visit) => (
                        <div key={visit.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {visit.well.client.user.name} - {visit.well.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {format(new Date(visit.visitDate), 'dd/MM/yyyy')} • {visit.well.location}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center">
                                  {getServiceIcon(visit.serviceType)}
                                  <span className="ml-1">{getServiceTypeLabel(visit.serviceType)}</span>
                                </span>
                                <span className="flex items-center">
                                  <Camera className="h-4 w-4 mr-1" />
                                  {visit.photos?.length || 0} fotos
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(visit.status)}
                              <Button
                                size="sm"
                                onClick={() => handleCreateInvoice(visit)}
                                disabled={visit.status !== 'completed'}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {visit.status === 'completed' ? 'Criar Fatura' : 'Visita Pendente'}
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">{visit.observations}</p>
                          
                          {visit.photos && visit.photos.length > 0 && (
                            <div className="flex space-x-2 mt-3">
                              {visit.photos.slice(0, 3).map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Foto ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border"
                                />
                              ))}
                              {visit.photos.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                                  <span className="text-xs text-gray-500">+{visit.photos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {(!visits?.visits || visits.visits.length === 0) && (
                        <div className="text-center py-12">
                          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Nenhuma visita registrada ainda.</p>
                        </div>
                      )}
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
                      <span>Total Faturado: R$ {
                        invoices?.invoices
                          .filter(inv => inv.status === 'paid')
                          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0)
                          .toFixed(2)
                          .replace('.', ',') || '0,00'
                      }</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {invoices?.invoices ? (
                    <InvoiceList 
                      invoices={invoices.invoices} 
                      userType="provider"
                      showActions={true}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma fatura criada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Invoice Creation Dialog */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Fatura para Visita</DialogTitle>
            </DialogHeader>
            {selectedVisitForInvoice && (
              <InvoiceForm
                visit={selectedVisitForInvoice}
                onSuccess={handleInvoiceSuccess}
                onCancel={() => setIsInvoiceDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
