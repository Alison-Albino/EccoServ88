import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Users, Droplet, Bolt, CalendarCheck, Check, UserPlus, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type VisitWithDetails, type WellWithClient } from "@shared/schema";
import { format } from "date-fns";

interface AdminStats {
  totalClients: number;
  totalProviders: number;
  totalWells: number;
  monthlyVisits: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: visits } = useQuery<{ visits: VisitWithDetails[] }>({
    queryKey: ['/api/admin/visits'],
  });

  const { data: wells } = useQuery<{ wells: WellWithClient[] }>({
    queryKey: ['/api/admin/wells'],
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
            title="Visitas Mês"
            value={stats?.monthlyVisits || 0}
            icon={CalendarCheck}
            variant="error"
          />
        </div>

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
      </div>
    </div>
  );
}
