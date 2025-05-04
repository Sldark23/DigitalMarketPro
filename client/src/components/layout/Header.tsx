import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getPageTitle = (path: string): string => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/products": "Meus Produtos",
    "/products/create": "Criar Produto",
    "/sales": "Vendas",
    "/affiliates": "Afiliados",
    "/marketplace": "Marketplace",
    "/withdrawals": "Saques",
    "/profile": "Meu Perfil",
    "/plans": "Planos",
  };

  return routes[path] || "CatPay Pro";
};

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center">
          <button
            id="sidebar-toggle"
            className="lg:hidden text-neutral-600 mr-2"
            onClick={toggleSidebar}
          >
            <i className="fas fa-bars"></i>
          </button>
          <h2 className="text-lg font-semibold text-neutral-800">
            {getPageTitle(location)}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="text-neutral-600 hover:text-primary relative">
              <i className="fas fa-bell"></i>
              <span className="absolute -top-1 -right-1 bg-accent text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                {Math.floor(Math.random() * 5)} {/* Placeholder for notification count */}
              </span>
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                  {user?.fullName ? user.fullName.charAt(0) : user?.username?.charAt(0) || 'U'}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className="text-sm font-medium text-neutral-700">
                    {user?.fullName || user?.username || "Usuário"}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {user?.role || "Usuário"}
                  </p>
                </div>
                <button className="ml-2 text-neutral-400">
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/profile")}>
                <i className="fas fa-user-circle mr-2"></i>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/plans")}>
                <i className="fas fa-star mr-2"></i>
                Meu Plano
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/withdrawals")}>
                <i className="fas fa-wallet mr-2"></i>
                Saques
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
