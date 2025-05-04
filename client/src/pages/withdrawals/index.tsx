import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Withdrawal } from "@shared/schema";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Withdrawals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user's withdrawals
  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ['/api/withdrawals'],
    enabled: !!user?.id,
  });

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
        return <Badge className="bg-success text-white">Concluído</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para saque",
        variant: "destructive",
      });
      return;
    }
    
    if (amount < 20) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é de R$ 20,00",
        variant: "destructive",
      });
      return;
    }
    
    if (user && amount > user.balance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para este saque",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/withdrawals", { amount });
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi enviada com sucesso",
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/withdrawals']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/me']
      });
      
      setIsDialogOpen(false);
      setWithdrawalAmount("");
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message || "Ocorreu um erro ao tentar solicitar o saque",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Saques</h1>
        <p className="text-neutral-500">Gerencie suas solicitações de saque e acompanhe o status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saldo Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Seu saldo atual</p>
                <p className="text-3xl font-bold font-poppins">
                  {formatCurrency(user?.balance || 0)}
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 md:mt-0">
                    <i className="fas fa-wallet mr-2"></i>
                    Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Saque</DialogTitle>
                    <DialogDescription>
                      Informe o valor que deseja sacar do seu saldo.
                      O valor mínimo para saque é de R$ 20,00.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdrawal-amount">Valor do Saque (R$)</Label>
                      <Input
                        id="withdrawal-amount"
                        type="number"
                        step="0.01"
                        min="20"
                        max={user?.balance}
                        placeholder="0.00"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                      />
                    </div>
                    <div className="text-sm text-neutral-500">
                      Saldo disponível: {formatCurrency(user?.balance || 0)}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleRequestWithdrawal}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      ) : null}
                      {isSubmitting ? "Enviando..." : "Solicitar Saque"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>
                <i className="fas fa-info-circle text-primary mr-2"></i>
                O valor mínimo para saque é de R$ 20,00.
              </p>
              <p>
                <i className="fas fa-clock text-primary mr-2"></i>
                O prazo para processamento é de até 3 dias úteis.
              </p>
              <p>
                <i className="fas fa-percentage text-primary mr-2"></i>
                Taxa de 4% sobre o valor do saque.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                <i className="fas fa-wallet"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum saque encontrado</h3>
              <p className="text-neutral-500 mb-4">Você ainda não solicitou nenhum saque.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Solicitar meu primeiro saque
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">{withdrawal.id}</TableCell>
                    <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
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
