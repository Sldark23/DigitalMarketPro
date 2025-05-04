import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Sale, Product } from "@shared/schema";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Sales() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get all sales
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ['/api/sales'],
    enabled: !!user?.id,
  });

  // Get all products for mapping product names
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!sales?.length,
  });

  const filteredSales = sales?.filter(sale => {
    if (statusFilter === "all") return true;
    return sale.status === statusFilter;
  }) || [];

  // Pagination
  const totalPages = Math.ceil((filteredSales?.length || 0) / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-white">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "refunded":
        return <Badge variant="destructive">Reembolsado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProductName = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    return product ? product.title : `Produto #${productId}`;
  };

  const getSaleTypeLabel = () => {
    if (user?.role === "vendor") return "Vendas";
    if (user?.role === "affiliate") return "Comissões";
    return "Compras";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{getSaleTypeLabel()}</h1>
        <p className="text-neutral-500">
          {user?.role === "vendor" 
            ? "Gerenciamento de vendas e histórico de transações" 
            : user?.role === "affiliate"
            ? "Comissões e histórico de vendas como afiliado"
            : "Histórico de compras e transações"}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de {getSaleTypeLabel()}</CardTitle>
          <div className="flex items-center space-x-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="completed">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="refunded">Reembolsados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <i className="fas fa-download mr-2"></i>
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !sales || sales.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma {getSaleTypeLabel().toLowerCase()} encontrada</h3>
              <p className="text-neutral-500">
                {user?.role === "vendor" 
                  ? "Você ainda não realizou nenhuma venda." 
                  : user?.role === "affiliate"
                  ? "Você ainda não recebeu comissões."
                  : "Você ainda não realizou nenhuma compra."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>
                      {user?.role === "vendor" ? "Comprador" : user?.role === "affiliate" ? "Vendedor" : "Vendedor"}
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    {user?.role === "vendor" && <TableHead>Comissão</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{getProductName(sale.productId)}</TableCell>
                      <TableCell>
                        {user?.role === "vendor" 
                          ? `Cliente #${sale.buyerId}` 
                          : user?.role === "affiliate" 
                          ? `Vendedor #${sale.sellerId}`
                          : `Vendedor #${sale.sellerId}`}
                      </TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell>
                        {user?.role === "vendor" 
                          ? formatCurrency(sale.sellerAmount) 
                          : user?.role === "affiliate"
                          ? formatCurrency(sale.affiliateAmount || 0)
                          : formatCurrency(sale.amount)}
                      </TableCell>
                      {user?.role === "vendor" && (
                        <TableCell>{sale.affiliateId ? formatCurrency(sale.affiliateAmount || 0) : "-"}</TableCell>
                      )}
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
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
                            <DropdownMenuItem>
                              <i className="fas fa-eye mr-2"></i>
                              Detalhes
                            </DropdownMenuItem>
                            {user?.role === "buyer" && sale.status === "completed" && (
                              <DropdownMenuItem>
                                <i className="fas fa-download mr-2"></i>
                                Baixar Produto
                              </DropdownMenuItem>
                            )}
                            {user?.role === "vendor" && sale.status === "completed" && (
                              <DropdownMenuItem>
                                <i className="fas fa-file-invoice mr-2"></i>
                                Gerar Nota
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="mt-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
