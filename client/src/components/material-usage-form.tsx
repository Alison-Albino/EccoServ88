import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AVAILABLE_MATERIALS, type AvailableMaterial } from "@shared/schema";
import { FlaskConical, Weight } from "lucide-react";

const materialFormSchema = z.object({
  materials: z.array(z.object({
    type: z.string(),
    selected: z.boolean(),
    quantity: z.number().min(0),
    notes: z.string().optional(),
  })),
});

type MaterialFormData = z.infer<typeof materialFormSchema>;

interface MaterialUsageFormProps {
  visitId: string;
  onSuccess?: () => void;
}

export function MaterialUsageForm({ visitId, onSuccess }: MaterialUsageFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingMaterials, isLoading } = useQuery({
    queryKey: ['/api/visits', visitId, 'materials'],
  });

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      materials: AVAILABLE_MATERIALS.map(material => ({
        type: material,
        selected: false,
        quantity: 0,
        notes: "",
      })),
    },
  });

  const saveMaterialsMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      await apiRequest(`/api/visits/${visitId}/materials`, {
        method: 'POST',
        body: JSON.stringify({ materials: data.materials }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Materiais salvos com sucesso!",
        description: "O uso dos materiais foi registrado para esta visita.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/materials/consumption'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar materiais",
        description: error.message || "Ocorreu um erro ao registrar o uso dos materiais.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaterialFormData) => {
    const selectedMaterials = data.materials.filter(m => m.selected);
    if (selectedMaterials.length === 0) {
      toast({
        title: "Nenhum material selecionado",
        description: "Selecione pelo menos um material ou defina quantidade zero para todos.",
        variant: "destructive",
      });
      return;
    }
    saveMaterialsMutation.mutate(data);
  };

  const watchedMaterials = form.watch("materials");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  const hasExistingMaterials = existingMaterials?.materials && existingMaterials.materials.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FlaskConical className="h-5 w-5" />
          <span>Materiais Utilizados</span>
        </CardTitle>
        <CardDescription>
          Marque os materiais utilizados nesta visita e informe a quantidade em gramas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasExistingMaterials ? (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Materiais já registrados:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingMaterials.materials.map((material: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{material.materialType}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Weight className="h-3 w-3" />
                      <span>{Number(material.quantityGrams).toFixed(0)}g</span>
                    </Badge>
                    <Badge variant="outline">
                      {(Number(material.quantityGrams) / 1000).toFixed(2)}kg
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {AVAILABLE_MATERIALS.map((material, index) => (
                  <FormField
                    key={material}
                    control={form.control}
                    name={`materials.${index}`}
                    render={({ field }) => (
                      <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value.selected}
                              onCheckedChange={(checked) => {
                                field.onChange({
                                  ...field.value,
                                  selected: !!checked,
                                  quantity: checked ? field.value.quantity || 1 : 0,
                                });
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            {material}
                          </FormLabel>
                        </FormItem>

                        {field.value.selected && (
                          <div className="flex items-center space-x-2 flex-1">
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Gramas"
                                  min="0"
                                  step="0.1"
                                  value={field.value.quantity || ""}
                                  onChange={(e) => {
                                    const quantity = parseFloat(e.target.value) || 0;
                                    field.onChange({
                                      ...field.value,
                                      quantity,
                                    });
                                  }}
                                  className="w-24"
                                />
                              </FormControl>
                            </FormItem>
                            
                            {field.value.quantity > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {(field.value.quantity / 1000).toFixed(2)}kg
                              </Badge>
                            )}

                            <FormItem className="flex-1">
                              <FormControl>
                                <Textarea
                                  placeholder="Observações (opcional)"
                                  value={field.value.notes || ""}
                                  onChange={(e) => {
                                    field.onChange({
                                      ...field.value,
                                      notes: e.target.value,
                                    });
                                  }}
                                  className="min-h-[60px]"
                                />
                              </FormControl>
                            </FormItem>
                          </div>
                        )}
                      </div>
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {watchedMaterials.filter(m => m.selected).length} material(is) selecionado(s)
                </div>
                <Button 
                  type="submit" 
                  disabled={saveMaterialsMutation.isPending}
                  className="w-32"
                >
                  {saveMaterialsMutation.isPending ? "Salvando..." : "Salvar Materiais"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}