import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export function StatsCard({ title, value, icon: Icon, variant = 'primary' }: StatsCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-error/10 text-error';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getVariantClasses()}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
