import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AffiliateRelation, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Affiliates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("myAffiliations");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get user's affiliate relations
  const { data: affiliateRelations, isLoading: isLoadingRelations } = useQuery<AffiliateRelation[]>({
    queryKey: ['/api/affiliate-relations'],
    enabled: !!user?.id,
  });

  // Get all public products for marketplace
  const { data: marketplaceProducts, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', { isPublic: true, isActive: true }],
    enabled: activeTab === "marketplace",
  });

  // Get all products where user is a seller
  const { data: myProducts, isLoading: isLoadingMyProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', { sellerId: user?.id }],
    enabled: activeTab === "requests" && !!user?.id,
  });

  const handleRequestAffiliation = async () => {
    if (!selectedProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto para solicitar afiliação",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/affiliate-relations", {
        productId: selectedProduct,
      });

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de afiliação foi enviada com sucesso",
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/affiliate-relations']
      });

      setIsDialogOpen(false);
      setSelectedProduct(null);
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar afiliação",
        description: error.message || "Ocorreu um erro ao tentar solicitar afiliação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (relationId: number, status: string) => {
    try {
      await apiRequest("PUT", `/api/affiliate-relations/${relationId}/status`, { status });
      
      toast({
        title: "Status atualizado",
        description: `A solicitação de afiliação foi ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/affiliate-relations']
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao tentar atualizar o status da solicitação",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-white">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getAffiliateLinkComponent = (relation: AffiliateRelation) => {
    if (relation.status !== "approved") return null;
    
    const affiliateLink = `${window.location.origin}/marketplace?product=${relation.productId}&affiliate=${user?.id}`;
    
    return (
      <div>
        <p className="text-sm text-neutral-500 mb-1">Seu link de afiliado:</p>
        <div className="flex">
          <input
            type="text"
            readOnly
            value={affiliateLink}
            className="flex-1 text-xs bg-neutral-100 p-2 rounded-l-md"
          />
          <Button
            size="sm"
            variant="secondary"
            className="rounded-l-none"
            onClick={() => {
              navigator.clipboard.writeText(affiliateLink);
              toast({
                title: "Link copiado",
                description: "Link de afiliado copiado para a área de transferência",
              });
            }}
          >
            <i className="fas fa-copy mr-1"></i> Copiar
          </Button>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Afiliados</h1>
        <p className="text-neutral-500">Gerencie seus programas de afiliados e comissões</p>
      </div>

      <Tabs defaultValue="myAffiliations" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="myAffiliations">Minhas Afiliações</TabsTrigger>
          {user?.role === "vendor" && <TabsTrigger value="requests">Solicitações</TabsTrigger>}
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="myAffiliations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Minhas Afiliações</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Nova Afiliação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Afiliação</DialogTitle>
                    <DialogDescription>
                      Escolha um produto para se tornar afiliado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select onValueChange={(value) => setSelectedProduct(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaceProducts?.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.title} - {formatCurrency(product.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleRequestAffiliation} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        ) : null}
                        {isSubmitting ? "Enviando..." : "Solicitar Afiliação"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingRelations ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : !affiliateRelations || affiliateRelations.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhuma afiliação encontrada</h3>
                  <p className="text-neutral-500 mb-4">Você ainda não solicitou afiliação para nenhum produto.</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Solicitar minha primeira afiliação
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Link de Afiliado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliateRelations.map((relation) => (
                      <TableRow key={relation.id}>
                        <TableCell>Produto #{relation.productId}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{getStatusBadge(relation.status)}</TableCell>
                        <TableCell>{getAffiliateLinkComponent(relation)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "vendor" && (
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Afiliação</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRelations ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : !affiliateRelations || affiliateRelations.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                      <i className="fas fa-user-plus"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma solicitação pendente</h3>
                    <p className="text-neutral-500">Você não tem solicitações de afiliação pendentes.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateRelations
                        .filter(relation => myProducts?.some(p => p.id === relation.productId))
                        .map((relation) => (
                          <TableRow key={relation.id}>
                            <TableCell>Usuário #{relation.affiliateId}</TableCell>
                            <TableCell>Produto #{relation.productId}</TableCell>
                            <TableCell>{new Date(relation.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{getStatusBadge(relation.status)}</TableCell>
                            <TableCell className="text-right">
                              {relation.status === "pending" && (
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-success border-success hover:bg-success/10"
                                    onClick={() => handleUpdateStatus(relation.id, "approved")}
                                  >
                                    <i className="fas fa-check mr-1"></i> Aprovar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-danger border-danger hover:bg-danger/10"
                                    onClick={() => handleUpdateStatus(relation.id, "rejected")}
                                  >
                                    <i className="fas fa-times mr-1"></i> Rejeitar
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Disponíveis para Afiliação</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : !marketplaceProducts || marketplaceProducts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                    <i className="fas fa-store"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum produto disponível</h3>
                  <p className="text-neutral-500">Não há produtos disponíveis para afiliação no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketplaceProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
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
                        <h3 className="font-medium text-lg mb-2">{product.title}</h3>
                        <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
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
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedProduct(product.id);
                            setIsDialogOpen(true);
                          }}
                        >
                          Solicitar Afiliação
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
