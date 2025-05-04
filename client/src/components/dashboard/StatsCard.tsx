import { Card } from "@/components/ui/card";
import { JSX } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: JSX.Element;
  iconBgClass: string;
  iconColorClass: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function StatsCard({
  title,
  value,
  trend,
  icon,
  iconBgClass,
  iconColorClass,
  action,
}: StatsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex justify-between">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <p className="text-2xl font-bold font-poppins mt-1">{value}</p>
          
          {trend && (
            <p className={`text-${trend.isPositive ? 'success' : 'danger'} text-xs mt-1 font-medium`}>
              <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'} mr-1`}></i>
              {trend.value}% desde ontem
            </p>
          )}
          
          {action && (
            <button 
              onClick={action.onClick} 
              className="text-primary text-xs mt-1 font-medium"
            >
              {action.label} <i className="fas fa-arrow-right ml-1"></i>
            </button>
          )}
        </div>
        
        <div className={`w-10 h-10 rounded-full ${iconBgClass} flex items-center justify-center ${iconColorClass}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
