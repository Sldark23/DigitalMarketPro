import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, ShoppingCart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Check if Stripe public key is available
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

// Initialize Stripe outside component to avoid recreation
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// The actual checkout form component
const CheckoutForm = ({ product }: { product: Product }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Get affiliate ID from session storage if available (for tracking)
  const affiliateId = sessionStorage.getItem(`affiliate_${product.id}`);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código de cupom vazio",
        description: "Por favor, insira um código de cupom válido",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const response = await fetch(`/api/coupons/${couponCode}/validate?productId=${product.id}`);
      
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      
      const coupon = await response.json();
      
      // Calculate discount based on coupon type
      let discount = 0;
      if (coupon.type === "percentage") {
        discount = (product.price * coupon.value) / 100;
      } else {
        discount = coupon.value;
      }
      
      setCouponDiscount(discount);
      setCouponApplied(true);
      
      toast({
        title: "Cupom aplicado",
        description: `Desconto de ${formatCurrency(discount)} aplicado ao seu pedido.`,
      });
    } catch (error: any) {
      toast({
        title: "Cupom inválido",
        description: error.message || "O cupom não é válido para este produto.",
        variant: "destructive",
      });
      setCouponApplied(false);
      setCouponDiscount(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/sales`,
        },
      });

      if (error) {
        setPaymentError(error.message || "Ocorreu um erro durante o processamento do pagamento.");
      } else {
        setPaymentSuccess(true);
        toast({
          title: "Pagamento realizado com sucesso",
          description: "Seu produto está disponível na área de compras",
        });
        setTimeout(() => {
          setLocation("/sales");
        }, 2000);
      }
    } catch (error: any) {
      setPaymentError(error.message || "Ocorreu um erro durante o processamento do pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const finalPrice = Math.max(0, product.price - couponDiscount);

  return (
    <form onSubmit={handleSubmit}>
      {paymentSuccess ? (
        <Alert className="mb-4 bg-success/20 text-success border-success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Pagamento confirmado</AlertTitle>
          <AlertDescription>
            Seu pagamento foi processado com sucesso. Redirecionando para suas compras...
          </AlertDescription>
        </Alert>
      ) : paymentError ? (
        <Alert className="mb-4 bg-destructive/20 text-destructive border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no pagamento</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Resumo do Pedido</h2>
        <div className="bg-muted p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span>{product.title}</span>
            <span>{formatCurrency(product.price)}</span>
          </div>
          
          {couponApplied && (
            <div className="flex justify-between text-success mb-2">
              <span>Desconto (Cupom: {couponCode})</span>
              <span>-{formatCurrency(couponDiscount)}</span>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(finalPrice)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Label htmlFor="coupon">Cupom de desconto</Label>
            <Input 
              id="coupon" 
              placeholder="Insira o código do cupom" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={couponApplied || isValidatingCoupon}
            />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-auto"
            onClick={handleApplyCoupon}
            disabled={couponApplied || isValidatingCoupon}
          >
            {isValidatingCoupon ? (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
            ) : null}
            {couponApplied ? "Aplicado" : "Aplicar"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Dados de Pagamento</h2>
        <PaymentElement />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" />
        )}
        {isProcessing ? "Processando pagamento..." : `Pagar ${formatCurrency(finalPrice)}`}
      </Button>
    </form>
  );
};

// Wrapper component that handles setup
export default function Checkout() {
  const { productId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar logado para realizar uma compra",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [user, toast, setLocation]);

  // Get product details
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Initialize payment intent once we have the product and user
  useEffect(() => {
    if (!product || !user) return;

    const initializePayment = async () => {
      setIsLoading(true);
      try {
        // Get affiliate ID from session storage if available (for tracking)
        const affiliateId = sessionStorage.getItem(`affiliate_${product.id}`);
        
        // Create payment intent
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          productId: product.id,
          amount: product.price,
          ...(affiliateId && { affiliateId: parseInt(affiliateId) })
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Erro ao inicializar pagamento",
          description: error.message || "Ocorreu um erro ao processar seu pagamento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [product, user, toast]);

  if (isLoadingProduct || isLoading || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center">Erro de Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuração de pagamento ausente</AlertTitle>
              <AlertDescription>
                Não foi possível inicializar o sistema de pagamento. Entre em contato com o administrador.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Finalizar Compra</h1>
        <p className="text-neutral-500">Complete a compra do seu produto digital</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>
                Você está comprando o produto: {product.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm product={product} />
                </Elements>
              ) : (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center mb-4">
                {product.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="text-4xl text-muted-foreground">
                    <i className="fas fa-file-alt"></i>
                  </div>
                )}
              </div>
              <h3 className="font-medium text-lg mb-2">{product.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {product.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Tipo:</div>
                <div className="font-medium capitalize">{product.productType}</div>
                
                <div className="text-muted-foreground">Valor:</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(product.price)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
              <p>Após a confirmação do pagamento, você terá acesso imediato ao produto.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
