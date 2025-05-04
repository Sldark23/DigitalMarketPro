import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadStripe } from '@stripe/stripe-js';

// Check if Stripe public key is available
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export default function Plans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all plans
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleSelectPlan = (plan: Plan) => {
    if (user?.planId === plan.id) {
      toast({
        title: "Plano atual",
        description: `Você já está inscrito no plano ${plan.name}`,
      });
      return;
    }

    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setIsSubmitting(true);
    try {
      // For free plan, just update the user's plan
      if (selectedPlan.price === 0) {
        await apiRequest("POST", "/api/create-subscription", { planId: selectedPlan.id });
        
        toast({
          title: "Plano atualizado",
          description: `Você agora está inscrito no plano ${selectedPlan.name}`,
        });
        
        queryClient.invalidateQueries({
          queryKey: ['/api/me']
        });
        
        setIsDialogOpen(false);
        setSelectedPlan(null);
        return;
      }
      
      // For paid plans, redirect to Stripe checkout
      if (!stripePromise) {
        toast({
          title: "Erro",
          description: "Configuração de pagamento indisponível",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest("POST", "/api/create-subscription", { planId: selectedPlan.id });
      const { clientSecret } = await response.json();
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe not initialized");
      }
      
      // Redirect to Stripe checkout
      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao assinar plano",
        description: error.message || "Ocorreu um erro ao tentar assinar o plano",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserPlan = () => {
    if (!plans || !user?.planId) return null;
    return plans.find(plan => plan.id === user.planId);
  };

  const currentPlan = getUserPlan();

  const renderPlanFeature = (value: any, label: string) => (
    <div className="flex justify-between">
      <span className="text-neutral-600">{label}</span>
      <span className="font-medium">
        {typeof value === "boolean" ? (
          value ? (
            <i className="fas fa-check text-success"></i>
          ) : (
            <i className="fas fa-times text-neutral-400"></i>
          )
        ) : value === 0 ? (
          "∞"
        ) : (
          value
        )}
      </span>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Planos e Assinaturas</h1>
        <p className="text-neutral-500">Escolha o plano ideal para o seu negócio</p>
      </div>

      {currentPlan && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Seu plano atual</p>
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold mr-2">{currentPlan.name}</h2>
                  <Badge className="bg-primary text-white">{currentPlan.price > 0 ? "Pago" : "Gratuito"}</Badge>
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  {currentPlan.price > 0 ? "Renovação automática em 30 dias" : ""}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 md:mt-0"
                onClick={() => window.scrollTo({ top: document.getElementById('plans-list')?.offsetTop, behavior: 'smooth' })}
              >
                Alterar Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div id="plans-list" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : plans?.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.name === "Pro" ? "border-primary shadow-md" : ""}`}
          >
            <CardHeader className={plan.name === "Pro" ? "bg-primary text-white rounded-t-lg" : ""}>
              <div className={`${plan.name === "Pro" ? "absolute -top-3 left-1/2 transform -translate-x-1/2" : "hidden"}`}>
                <Badge className="bg-accent text-white">Mais Popular</Badge>
              </div>
              <CardTitle className={`text-xl ${plan.name === "Pro" ? "text-white" : ""}`}>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className={`text-3xl font-bold font-poppins ${plan.name === "Pro" ? "text-white" : ""}`}>
                  {formatCurrency(plan.price)}
                </span>
                <span className={`text-sm ${plan.name === "Pro" ? "text-white/80" : "text-neutral-500"}`}>/mês</span>
              </div>
              <CardDescription className={plan.name === "Pro" ? "text-white/90" : ""}>
                {plan.name === "Free" && "Para começar a vender"}
                {plan.name === "Start" && "Para pequenos vendedores"}
                {plan.name === "Pro" && "Para vendedores profissionais"}
                {plan.name === "Master" && "Para grandes vendedores"}
                {plan.name === "Infinity" && "Sem limites"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3 text-sm">
                {renderPlanFeature(plan.productLimit === 0 ? "∞" : plan.productLimit, "Produtos")}
                {renderPlanFeature(plan.affiliateLimit === 0 ? "∞" : plan.affiliateLimit || "Não", "Afiliações")}
                {renderPlanFeature(plan.supportLevel, "Suporte")}
                {renderPlanFeature(plan.hasHighlight, "Destaque")}
                {renderPlanFeature(`${plan.platformFeePercentage}%`, "Taxa da plataforma")}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                variant={plan.name === "Pro" ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan)}
                disabled={user?.planId === plan.id}
              >
                {user?.planId === plan.id ? "Plano Atual" : plan.price === 0 ? "Escolher Plano" : "Assinar Agora"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Assinatura</DialogTitle>
            <DialogDescription>
              {selectedPlan?.price === 0 
                ? `Você está prestes a mudar para o plano ${selectedPlan?.name}.`
                : `Você está prestes a assinar o plano ${selectedPlan?.name} por ${formatCurrency(selectedPlan?.price || 0)}/mês.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Recursos incluídos:</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-neutral-600">
                <li>{selectedPlan?.productLimit === 0 ? "Produtos ilimitados" : `${selectedPlan?.productLimit} produtos`}</li>
                <li>
                  {selectedPlan?.affiliateLimit === 0 
                    ? "Afiliações ilimitadas" 
                    : selectedPlan?.affiliateLimit 
                    ? `${selectedPlan?.affiliateLimit} afiliações` 
                    : "Sem afiliações"
                  }
                </li>
                <li>Suporte {selectedPlan?.supportLevel}</li>
                <li>
                  {selectedPlan?.hasHighlight 
                    ? "Destaque no marketplace" 
                    : "Sem destaque no marketplace"
                  }
                </li>
                <li>Taxa da plataforma: {selectedPlan?.platformFeePercentage}%</li>
              </ul>
            </div>
            
            {selectedPlan?.price > 0 && (
              <div className="text-sm text-neutral-500">
                Ao continuar, você será redirecionado para a página de pagamento do Stripe.
                Sua assinatura será renovada automaticamente a cada mês.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubscribe}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : null}
              {isSubmitting 
                ? "Processando..." 
                : selectedPlan?.price === 0 
                ? "Confirmar" 
                : "Prosseguir para pagamento"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
