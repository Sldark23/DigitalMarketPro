import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['/api/products', { sellerId: user?.id }],
    enabled: !!user?.id,
  });

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      setDeleteLoading(id);
      try {
        await apiRequest("DELETE", `/api/products/${id}`);
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso",
        });
        refetch();
      } catch (error: any) {
        toast({
          title: "Erro ao excluir produto",
          description: error.message || "Ocorreu um erro ao tentar excluir o produto",
          variant: "destructive",
        });
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await apiRequest("PUT", `/api/products/${id}`, { isActive: !isActive });
      toast({
        title: isActive ? "Produto desativado" : "Produto ativado",
        description: `O produto foi ${isActive ? "desativado" : "ativado"} com sucesso`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status do produto",
        description: error.message || "Ocorreu um erro ao tentar alterar o status do produto",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Produtos</h1>
          <p className="text-neutral-500">Gerencie seus produtos digitais</p>
        </div>
        <Button onClick={() => setLocation("/products/create")}>
          <i className="fas fa-plus mr-2"></i>
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mb-4">
                <i className="fas fa-box"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-neutral-500 mb-4">Você ainda não cadastrou nenhum produto digital.</p>
              <Button onClick={() => setLocation("/products/create")}>
                Criar meu primeiro produto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary mr-3">
                          <i className="fas fa-file-alt"></i>
                        </div>
                        <span>{product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{product.productType}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      {product.commissionType === "percentage" 
                        ? `${product.commissionRate}%`
                        : formatCurrency(product.commissionRate)
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.isActive ? "default" : "secondary"}
                        className={`${product.isActive ? 'bg-success text-white' : 'bg-neutral-200 text-neutral-700'}`}
                      >
                        {product.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <i className="fas fa-ellipsis-h"></i>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setLocation(`/products/edit/${product.id}`)}>
                            <i className="fas fa-edit mr-2"></i>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(product.id, product.isActive)}>
                            <i className={`fas fa-${product.isActive ? 'ban' : 'check'} mr-2`}></i>
                            {product.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600" 
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteLoading === product.id}
                          >
                            {deleteLoading === product.id ? (
                              <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                            ) : (
                              <i className="fas fa-trash-alt mr-2"></i>
                            )}
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
