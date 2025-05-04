import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Product, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Slider } from "@/components/ui/slider";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    categoryId: "",
    priceRange: [0, 1000],
    searchTerm: "",
    productType: "",
    sortBy: "newest"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isRequestingAffiliation, setIsRequestingAffiliation] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const itemsPerPage = 9;

  // Get all products for the marketplace
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', { isPublic: true, isActive: true }],
  });

  // Get all categories for filtering
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Get user's affiliate relations to check if already affiliated
  const { data: affiliateRelations } = useQuery({
    queryKey: ['/api/affiliate-relations'],
    enabled: !!user?.id,
  });

  // Use URL parameters for filtering and pagination
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const productId = searchParams.get('product');
    const affiliateId = searchParams.get('affiliate');
    
    if (productId) {
      // Store affiliate info if present
      if (affiliateId) {
        sessionStorage.setItem(`affiliate_${productId}`, affiliateId);
      }
      
      // Scroll to product if specified in URL
      const productElement = document.getElementById(`product-${productId}`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Apply filters
  const filteredProducts = products?.filter(product => {
    // Category filter
    if (filters.categoryId && product.categoryId !== parseInt(filters.categoryId)) {
      return false;
    }
    
    // Price range filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }
    
    // Search term
    if (filters.searchTerm && !product.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Product type
    if (filters.productType && product.productType !== filters.productType) {
      return false;
    }
    
    return true;
  }) || [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "commission":
        return b.commissionRate - a.commissionRate;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleRequestAffiliation = async (productId: number) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para se tornar um afiliado",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setSelectedProductId(productId);
    setIsRequestingAffiliation(true);

    try {
      await apiRequest("POST", "/api/affiliate-relations", {
        productId
      });

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de afiliação foi enviada com sucesso",
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/affiliate-relations']
      });
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar afiliação",
        description: error.message || "Ocorreu um erro ao tentar solicitar afiliação",
        variant: "destructive",
      });
    } finally {
      setIsRequestingAffiliation(false);
      setSelectedProductId(null);
    }
  };

  const handleBuyProduct = (productId: number) => {
    setLocation(`/checkout/${productId}`);
  };

  const isAlreadyAffiliated = (productId: number) => {
    return affiliateRelations?.some(relation => 
      relation.productId === productId && 
      relation.affiliateId === user?.id
    );
  };

  const getAffiliationStatus = (productId: number) => {
    const relation = affiliateRelations?.find(
      relation => relation.productId === productId && relation.affiliateId === user?.id
    );
    
    return relation?.status || null;
  };

  const productTypes = [
    { value: "", label: "Todos os tipos" },
    { value: "pdf", label: "PDF" },
    { value: "ebook", label: "E-book" },
    { value: "course", label: "Curso" },
    { value: "link", label: "Link" },
    { value: "software", label: "Software" },
    { value: "template", label: "Template" },
    { value: "other", label: "Outro" },
  ];

  const sortOptions = [
    { value: "newest", label: "Mais recentes" },
    { value: "price-asc", label: "Menor preço" },
    { value: "price-desc", label: "Maior preço" },
    { value: "commission", label: "Maior comissão" },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-neutral-500">Encontre produtos digitais para comprar ou afiliar</p>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="pr-10 w-full md:w-64"
              value={filters.searchTerm}
              onChange={(e) => {
                setFilters({ ...filters, searchTerm: e.target.value });
                setCurrentPage(1);
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <h3 className="font-medium mb-2">Categorias</h3>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => {
                    setFilters({ ...filters, categoryId: value });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-medium mb-2">Faixa de Preço</h3>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    min={0}
                    max={1000}
                    step={10}
                    onValueChange={(value) => {
                      setFilters({ ...filters, priceRange: value as [number, number] });
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-neutral-500">
                  <span>{formatCurrency(filters.priceRange[0])}</span>
                  <span>{formatCurrency(filters.priceRange[1])}</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Tipo de Produto</h3>
                <Select
                  value={filters.productType}
                  onValueChange={(value) => {
                    setFilters({ ...filters, productType: value });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-medium mb-2">Ordenar por</h3>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => {
                    setFilters({ ...filters, sortBy: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setFilters({
                    categoryId: "",
                    priceRange: [0, 1000],
                    searchTerm: "",
                    productType: "",
                    sortBy: "newest"
                  });
                  setCurrentPage(1);
                }}
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoadingProducts ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !paginatedProducts.length ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                <i className="fas fa-search"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-neutral-500 mb-4">Tente ajustar os filtros para ver mais resultados.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    categoryId: "",
                    priceRange: [0, 1000],
                    searchTerm: "",
                    productType: "",
                    sortBy: "newest"
                  });
                  setCurrentPage(1);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-neutral-500">
                {filteredProducts.length} produto(s) encontrado(s)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    id={`product-${product.id}`}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 bg-primary/10 flex items-center justify-center">
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
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg line-clamp-1">{product.title}</h3>
                        <Badge className="capitalize bg-neutral-100 text-neutral-700">
                          {product.productType}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-3 h-10">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-lg">
                          {formatCurrency(product.price)}
                        </span>
                        <Badge className="bg-secondary text-white">
                          {product.commissionType === "percentage"
                            ? `${product.commissionRate}% comissão`
                            : `${formatCurrency(product.commissionRate)} comissão`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleBuyProduct(product.id)}
                          disabled={isCheckingOut && selectedProductId === product.id}
                        >
                          {isCheckingOut && selectedProductId === product.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                          ) : (
                            <i className="fas fa-shopping-cart mr-1"></i>
                          )}
                          Comprar
                        </Button>
                        
                        {user?.id !== product.sellerId && (
                          <Button 
                            variant="outline"
                            onClick={() => handleRequestAffiliation(product.id)}
                            disabled={
                              isRequestingAffiliation && selectedProductId === product.id ||
                              isAlreadyAffiliated(product.id)
                            }
                          >
                            {isRequestingAffiliation && selectedProductId === product.id ? (
                              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-1"></div>
                            ) : (
                              <i className="fas fa-link mr-1"></i>
                            )}
                            {isAlreadyAffiliated(product.id) 
                              ? getAffiliationStatus(product.id) === "approved" 
                                ? "Afiliado" 
                                : getAffiliationStatus(product.id) === "pending" 
                                ? "Pendente"
                                : "Rejeitado" 
                              : "Afiliar"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <Button 
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
