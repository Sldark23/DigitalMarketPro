import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export default function PerformanceChart() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Sample data - in a real application this would come from an API
  const data = {
    '7d': [
      { name: 'Seg', value: 32 },
      { name: 'Ter', value: 25 },
      { name: 'Qua', value: 40 },
      { name: 'Qui', value: 30 },
      { name: 'Sex', value: 45 },
      { name: 'Sáb', value: 20 },
      { name: 'Dom', value: 15 },
    ],
    '30d': [
      { name: 'Semana 1', value: 120 },
      { name: 'Semana 2', value: 95 },
      { name: 'Semana 3', value: 140 },
      { name: 'Semana 4', value: 130 },
    ],
    '90d': [
      { name: 'Janeiro', value: 350 },
      { name: 'Fevereiro', value: 420 },
      { name: 'Março', value: 380 },
    ]
  };
  
  const metrics = [
    { label: "Produtos Vendidos", value: period === '7d' ? 28 : period === '30d' ? 152 : 450 },
    { label: "Conversão", value: period === '7d' ? "3.2%" : period === '30d' ? "3.8%" : "4.1%" },
    { label: "Ticket Médio", value: period === '7d' ? "R$ 85,20" : period === '30d' ? "R$ 87,50" : "R$ 89,30" },
    { label: "Devoluções", value: period === '7d' ? "0.8%" : period === '30d' ? "1.2%" : "1.5%" },
  ];

  return (
    <Card className="col-span-2">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Desempenho de Produtos</h2>
          <div className="flex space-x-2">
            <button 
              className={`text-xs border ${period === '7d' ? 'border-primary rounded px-3 py-1 text-white bg-primary' : 'border-neutral-200 rounded px-3 py-1 text-neutral-600 hover:bg-neutral-50'}`}
              onClick={() => setPeriod('7d')}
            >
              7 dias
            </button>
            <button 
              className={`text-xs border ${period === '30d' ? 'border-primary rounded px-3 py-1 text-white bg-primary' : 'border-neutral-200 rounded px-3 py-1 text-neutral-600 hover:bg-neutral-50'}`}
              onClick={() => setPeriod('30d')}
            >
              30 dias
            </button>
            <button 
              className={`text-xs border ${period === '90d' ? 'border-primary rounded px-3 py-1 text-white bg-primary' : 'border-neutral-200 rounded px-3 py-1 text-neutral-600 hover:bg-neutral-50'}`}
              onClick={() => setPeriod('90d')}
            >
              90 dias
            </button>
          </div>
        </div>
        
        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data[period]}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} vendas`, 'Vendas']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #f1f1f1',
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              />
              <Legend wrapperStyle={{ marginTop: 10 }} />
              <Bar 
                dataKey="value" 
                name="Vendas" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-neutral-500">{metric.label}</p>
              <p className="text-xl font-bold font-poppins">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
