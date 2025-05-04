import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  path: string;
  hoverClasses: string;
}

export default function QuickActions() {
  const actions: QuickAction[] = [
    {
      title: "Criar Produto",
      description: "Adicione um novo produto digital",
      icon: "fas fa-plus",
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary",
      path: "/products/create",
      hoverClasses: "hover:border-primary/50 hover:bg-primary/5"
    },
    {
      title: "Gerar Link de Afiliado",
      description: "Crie links de rastreamento",
      icon: "fas fa-link",
      iconBgClass: "bg-secondary/10",
      iconColorClass: "text-secondary",
      path: "/affiliates",
      hoverClasses: "hover:border-secondary/50 hover:bg-secondary/5"
    },
    {
      title: "Emitir Cupom",
      description: "Crie descontos promocionais",
      icon: "fas fa-ticket-alt",
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent",
      path: "/products",
      hoverClasses: "hover:border-accent/50 hover:bg-accent/5"
    },
    {
      title: "Ver Relatórios",
      description: "Análise detalhada de vendas",
      icon: "fas fa-chart-line",
      iconBgClass: "bg-neutral-100",
      iconColorClass: "text-neutral-700",
      path: "/sales",
      hoverClasses: "hover:border-primary/50 hover:bg-primary/5"
    }
  ];

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        
        <div className="space-y-4">
          {actions.map((action, index) => (
            <Link 
              key={index} 
              href={action.path}
              className={`flex items-center p-3 border border-neutral-200 rounded-lg ${action.hoverClasses} transition-colors`}
            >
              <div className={`w-10 h-10 rounded-full ${action.iconBgClass} flex items-center justify-center ${action.iconColorClass} mr-3`}>
                <i className={action.icon}></i>
              </div>
              <div>
                <h3 className="font-medium">{action.title}</h3>
                <p className="text-sm text-neutral-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
