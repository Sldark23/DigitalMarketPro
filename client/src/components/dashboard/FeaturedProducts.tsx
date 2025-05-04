import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Product } from "@shared/schema";

export default function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', { isPublic: true }],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Destaques do Marketplace</h2>
          <Link href="/marketplace" className="text-primary text-sm font-medium">
            Ver Marketplace
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map((product) => (
              <div 
                key={product.id} 
                className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-36 bg-primary/10 flex items-center justify-center">
                  {product.thumbnailUrl ? (
                    <img 
                      src={product.thumbnailUrl} 
                      alt={product.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-primary text-4xl">
                      <i className="fas fa-file-alt"></i>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-neutral-800">{product.title}</h3>
                  <div className="flex items-center mt-1 text-sm">
                    <span className="text-yellow-500">
                      <i className="fas fa-star"></i> 4.8
                    </span>
                    <span className="text-neutral-500 ml-1">(10 avaliações)</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-bold font-poppins">{formatCurrency(product.price)}</span>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                      {product.commissionRate}% comissão
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500">
            <i className="fas fa-store text-4xl mb-3 opacity-20"></i>
            <p>Nenhum produto em destaque</p>
            <p className="text-sm mt-2">Os produtos aparecerão aqui quando forem adicionados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
