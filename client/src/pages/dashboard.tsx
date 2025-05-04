import { useAuth } from "@/contexts/AuthContext";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentSalesTable from "@/components/dashboard/RecentSalesTable";
import QuickActions from "@/components/dashboard/QuickActions";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import TopAffiliates from "@/components/dashboard/TopAffiliates";
import FeaturedProducts from "@/components/dashboard/FeaturedProducts";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const stats = [
    {
      title: "Vendas Hoje",
      value: formatCurrency(1254),
      trend: { value: 12, isPositive: true },
      icon: <i className="fas fa-shopping-cart"></i>,
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary"
    },
    {
      title: "Comissões",
      value: formatCurrency(347.80),
      trend: { value: 8, isPositive: true },
      icon: <i className="fas fa-percentage"></i>,
      iconBgClass: "bg-secondary/10",
      iconColorClass: "text-secondary"
    },
    {
      title: "Novos Clientes",
      value: "24",
      trend: { value: 3, isPositive: false },
      icon: <i className="fas fa-user-plus"></i>,
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent"
    },
    {
      title: "Saldo Disponível",
      value: formatCurrency(user?.balance || 0),
      icon: <i className="fas fa-wallet"></i>,
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary",
      action: {
        label: "Solicitar Saque",
        onClick: () => setLocation("/withdrawals")
      }
    }
  ];

  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Bem-vindo(a) de volta, {user?.fullName || user?.username}!</h1>
            <p className="mt-2 text-primary-light/90">
              Você tem 3 vendas pendentes e 2 solicitações de afiliados hoje.
            </p>
          </div>
          <button 
            onClick={() => setLocation("/products/create")}
            className="mt-4 md:mt-0 bg-white text-primary hover:bg-neutral-100 px-5 py-2 rounded-md font-medium transition-colors"
          >
            Criar Novo Produto
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <RecentSalesTable />
        <QuickActions />
      </div>

      {/* Performance Metrics and Affiliate Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <PerformanceChart />
        <TopAffiliates />
      </div>

      {/* Featured Products in Marketplace */}
      <FeaturedProducts />
    </>
  );
}
