import { useQuery } from "@tanstack/react-query";
import { Sale } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentSalesTable() {
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ['/api/sales'],
  });

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'refunded':
        return 'bg-danger/20 text-danger';
      default:
        return 'bg-neutral-200 text-neutral-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  return (
    <Card className="col-span-2">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Vendas Recentes</h2>
          <Link href="/sales" className="text-primary text-sm font-medium">
            Ver Todas
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : sales && sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="pb-3 font-medium">Produto</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 4).map((sale) => (
                  <tr key={sale.id} className="border-b border-neutral-100">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary">
                          <i className="fas fa-file-alt"></i>
                        </div>
                        <span className="ml-2">Produto #{sale.productId}</span>
                      </div>
                    </td>
                    <td className="py-3">Cliente #{sale.buyerId}</td>
                    <td className="py-3">{formatDate(sale.createdAt)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(sale.amount)}</td>
                    <td className="py-3 text-right">
                      <span className={`${getStatusBadgeClass(sale.status)} text-xs px-2 py-1 rounded-full`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500">
            <i className="fas fa-shopping-cart text-4xl mb-3 opacity-20"></i>
            <p>Nenhuma venda encontrada</p>
            <p className="text-sm mt-2">As vendas aparecerão aqui quando você tiver alguma.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
