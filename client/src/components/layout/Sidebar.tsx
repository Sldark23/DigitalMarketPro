import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Get user's plan info
  const { data: plan } = useQuery({
    queryKey: ['/api/plans'],
    select: (plans) => {
      if (!user?.planId || !plans) return null;
      return plans.find((p) => p.id === user.planId);
    },
    enabled: !!user?.planId
  });

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "fas fa-home" },
    { path: "/products", label: "Meus Produtos", icon: "fas fa-box" },
    { path: "/sales", label: "Vendas", icon: "fas fa-shopping-cart" },
    { path: "/affiliates", label: "Afiliados", icon: "fas fa-users" },
    { path: "/marketplace", label: "Marketplace", icon: "fas fa-store" },
    { path: "/withdrawals", label: "Saques", icon: "fas fa-wallet" },
  ];

  const settingsItems = [
    { path: "/profile", label: "Meu Perfil", icon: "fas fa-user-circle" },
    { path: "/plans", label: "Planos", icon: "fas fa-star" },
    { path: "#suporte", label: "Suporte", icon: "fas fa-headset" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        id="sidebar" 
        className={`fixed lg:static h-full z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-6 py-4 flex items-center border-b border-neutral-200">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
            <i className="fas fa-cat"></i>
          </div>
          <h1 className="ml-3 text-xl font-bold text-primary">CatPay Pro</h1>
        </div>

        <div className="pt-4 pb-4 pl-5 pr-5 text-sm font-medium text-neutral-600">
          <p>MENU PRINCIPAL</p>
        </div>

        <nav className="mt-1">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center px-6 py-3 ${
                isActive(item.path) 
                  ? "menu-item-active text-primary font-medium" 
                  : "text-neutral-600 hover:bg-neutral-100"
              } transition-colors`}
            >
              <i className={`${item.icon} mr-3`}></i>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="pt-4 pb-2 pl-5 pr-5 text-sm font-medium text-neutral-600 mt-4">
            <p>CONFIGURAÇÕES</p>
          </div>

          {settingsItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center px-6 py-3 ${
                isActive(item.path) 
                  ? "menu-item-active text-primary font-medium" 
                  : "text-neutral-600 hover:bg-neutral-100"
              } transition-colors`}
            >
              <i className={`${item.icon} mr-3`}></i>
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <i className="fas fa-sign-out-alt mr-3"></i>
            <span>Sair</span>
          </button>
        </nav>

        {plan && (
          <div className="absolute bottom-0 w-full border-t border-neutral-200 p-4">
            <div className="bg-primary-light/10 rounded-lg p-3">
              <h3 className="font-medium text-primary">Plano {plan.name}</h3>
              <p className="text-xs text-neutral-600 mt-1">
                {plan.price > 0 
                  ? "Renovação em 30 dias" 
                  : "Plano gratuito"
                }
              </p>
              <Link 
                href="/plans" 
                className="mt-2 inline-block text-xs text-white bg-primary hover:bg-primary-dark px-3 py-1 rounded transition-colors"
              >
                Gerenciar Plano
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Toggle Button (Rendered in Header.tsx) */}
    </>
  );
}
