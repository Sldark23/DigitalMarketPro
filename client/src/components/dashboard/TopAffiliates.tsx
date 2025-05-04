import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface AffiliateData {
  id: number;
  name: string;
  sales: number;
  percentage: number;
}

export default function TopAffiliates() {
  // Sample data - in a real app this would come from an API
  const affiliates: AffiliateData[] = [
    { id: 1, name: "Ricardo Almeida", sales: 1280, percentage: 85 },
    { id: 2, name: "Camila Ferreira", sales: 950, percentage: 72 },
    { id: 3, name: "Bruno Lopes", sales: 780, percentage: 65 },
    { id: 4, name: "Juliana Martins", sales: 645, percentage: 58 }
  ];

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
          <h2 className="text-lg font-semibold">Top Afiliados</h2>
          <Link href="/affiliates" className="text-primary text-sm font-medium">
            Todos
          </Link>
        </div>
        
        <div className="space-y-4">
          {affiliates.map((affiliate) => (
            <div key={affiliate.id} className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                {affiliate.name.charAt(0)}
              </div>
              <div className="flex-1 ml-3">
                <h3 className="font-medium">{affiliate.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <div className="w-full max-w-[120px]">
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${affiliate.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-neutral-600 ml-2">
                    {formatCurrency(affiliate.sales)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
