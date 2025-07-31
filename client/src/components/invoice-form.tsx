import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Calendar, CreditCard } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type CreateInvoiceRequest, type VisitWithDetails } from "@shared/schema";

interface InvoiceFormProps {
  visit: VisitWithDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvoiceForm({ visit, onSuccess, onCancel }: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    visitId: visit.id,
    description: `${getServiceTypeLabel(visit.serviceType)} - ${visit.well.name}`,
    serviceValue: "0.00",
    materialCosts: "0.00",
    isFree: false,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    paymentMethod: undefined,
    notes: ""
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      return apiRequest('POST', '/api/invoices', data);
    },
    onSuccess: () => {
      toast({
        title: "Fatura criada!",
        description: "A fatura foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar fatura",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceMutation.mutate(formData);
  };

  const handleServiceValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData({
      ...formData,
      serviceValue: numValue.toFixed(2),
      isFree: numValue === 0
    });
  };

  const handleMaterialCostsChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData({
      ...formData,
      materialCosts: numValue.toFixed(2)
    });
  };

  const handleFreeServiceChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isFree: checked,
      serviceValue: checked ? "0.00" : formData.serviceValue,
      materialCosts: checked ? "0.00" : formData.materialCosts
    });
  };

  function getServiceTypeLabel(serviceType: string) {
    const labels = {
      'manutencao-preventiva': 'Manutenção Preventiva',
      'manutencao-corretiva': 'Manutenção Corretiva',
      'limpeza': 'Limpeza',
      'instalacao': 'Instalação',
      'reparo': 'Reparo',
      'inspecao': 'Inspeção',
    };
    return labels[serviceType as keyof typeof labels] || serviceType;
  }

  const totalAmount = formData.isFree ? 0 : (parseFloat(formData.serviceValue) + parseFloat(formData.materialCosts));

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Criar Fatura</span>
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p><strong>Cliente:</strong> {visit.well.client.user.name}</p>
          <p><strong>Poço:</strong> {visit.well.name}</p>
          <p><strong>Data da Visita:</strong> {new Date(visit.visitDate).toLocaleDateString('pt-BR')}</p>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="description">Descrição do Serviço *</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFree"
              checked={formData.isFree}
              onCheckedChange={handleFreeServiceChange}
            />
            <Label htmlFor="isFree" className="text-sm font-medium">
              Serviço Gratuito
            </Label>
          </div>

          {!formData.isFree && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceValue">Valor do Serviço (R$) *</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="serviceValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceValue}
                    onChange={(e) => handleServiceValueChange(e.target.value)}
                    className="pl-10"
                    required={!formData.isFree}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="materialCosts">Custo de Materiais (R$)</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="materialCosts"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.materialCosts}
                    onChange={(e) => handleMaterialCostsChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: "boleto" | "pix" | "card" | "cash") =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre a fatura..."
              className="mt-2"
            />
          </div>

          {!formData.isFree && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total da Fatura:</span>
                <span className="text-primary">R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          )}

          {formData.isFree && (
            <div className="bg-success/10 p-4 rounded-lg">
              <div className="flex items-center justify-center text-success font-semibold">
                <span>Serviço Gratuito</span>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? "Criando..." : "Criar Fatura"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-8"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}