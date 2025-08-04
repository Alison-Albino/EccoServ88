import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Weight, FlaskConical } from "lucide-react";

interface ConsumptionData {
  materialType: string;
  totalGrams: number;
  totalKilograms: number;
}

interface ConsumptionResponse {
  period: string;
  startDate: string;
  endDate: string;
  consumption: ConsumptionData[];
}

const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
];

export function MaterialConsumptionReport() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery<ConsumptionResponse>({
    queryKey: ['/api/admin/materials/consumption', { period: 'week' }],
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<ConsumptionResponse>({
    queryKey: ['/api/admin/materials/consumption', { period: 'month' }],
  });

  const currentData = selectedPeriod === 'week' ? weeklyData : monthlyData;
  const isLoading = selectedPeriod === 'week' ? weeklyLoading : monthlyLoading;

  const formatPeriodText = (period: string, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (period === 'week') {
      return `Últimos 7 dias (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
    } else {
      return `Último mês (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
    }
  };

  const getTotalConsumption = (data: ConsumptionData[]) => {
    return data.reduce((total, item) => total + item.totalGrams, 0);
  };

  const getTopMaterial = (data: ConsumptionData[]) => {
    if (data.length === 0) return null;
    return data.reduce((max, item) => item.totalGrams > max.totalGrams ? item : max);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório...</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = currentData?.consumption?.map(item => ({
    name: item.materialType.length > 20 ? item.materialType.substring(0, 20) + '...' : item.materialType,
    fullName: item.materialType,
    gramas: item.totalGrams,
    kg: item.totalKilograms,
  })) || [];

  const pieData = currentData?.consumption?.map((item, index) => ({
    name: item.materialType,
    value: item.totalGrams,
    color: COLORS[index % COLORS.length],
  })) || [];

  const totalConsumption = currentData?.consumption ? getTotalConsumption(currentData.consumption) : 0;
  const topMaterial = currentData?.consumption ? getTopMaterial(currentData.consumption) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FlaskConical className="h-5 w-5" />
            <span>Relatório de Consumo de Materiais</span>
          </CardTitle>
          <CardDescription>
            Acompanhe o uso de materiais químicos pelos prestadores de serviço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('week')}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Semanal</span>
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('month')}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Mensal</span>
            </Button>
          </div>

          {currentData && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  {formatPeriodText(currentData.period, currentData.startDate, currentData.endDate)}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Weight className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Total Consumido</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      {totalConsumption.toFixed(0)}g
                    </p>
                    <p className="text-sm text-blue-700">
                      {(totalConsumption / 1000).toFixed(2)}kg
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Material Mais Usado</span>
                    </div>
                    <p className="text-lg font-bold text-green-900 mt-2">
                      {topMaterial ? topMaterial.materialType.split('(')[0].trim() : 'N/A'}
                    </p>
                    <p className="text-sm text-green-700">
                      {topMaterial ? `${topMaterial.totalGrams.toFixed(0)}g` : '0g'}
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Flask className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Tipos Utilizados</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900 mt-2">
                      {currentData.consumption.length}
                    </p>
                    <p className="text-sm text-amber-700">materiais diferentes</p>
                  </div>
                </div>
              </div>

              {currentData.consumption.length > 0 ? (
                <Tabs defaultValue="bar" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bar">Gráfico de Barras</TabsTrigger>
                    <TabsTrigger value="pie">Gráfico Pizza</TabsTrigger>
                    <TabsTrigger value="table">Tabela Detalhada</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bar" className="space-y-4">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={12}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'gramas' ? `${value}g` : `${value}kg`,
                              name === 'gramas' ? 'Gramas' : 'Quilogramas'
                            ]}
                            labelFormatter={(label) => {
                              const item = chartData.find(d => d.name === label);
                              return item?.fullName || label;
                            }}
                          />
                          <Bar dataKey="gramas" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pie" className="space-y-4">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name.split('(')[0].trim()} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}g`, 'Consumo']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="table" className="space-y-4">
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-4 font-medium">Material</th>
                            <th className="text-right p-4 font-medium">Gramas</th>
                            <th className="text-right p-4 font-medium">Quilogramas</th>
                            <th className="text-right p-4 font-medium">% do Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.consumption
                            .sort((a, b) => b.totalGrams - a.totalGrams)
                            .map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-4">{item.materialType}</td>
                              <td className="text-right p-4 font-mono">
                                {item.totalGrams.toFixed(1)}g
                              </td>
                              <td className="text-right p-4 font-mono">
                                <Badge variant="secondary">
                                  {item.totalKilograms.toFixed(3)}kg
                                </Badge>
                              </td>
                              <td className="text-right p-4">
                                {((item.totalGrams / totalConsumption) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <Flask className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum consumo registrado
                  </h3>
                  <p className="text-gray-500">
                    Não há uso de materiais registrado para o período selecionado.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}