import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const recentTransactions = [
  { desc: 'Supermercado', value: -342.5, category: 'Alimentação', date: '17/03' },
  { desc: 'Salário', value: 8500.0, category: 'Receita', date: '15/03' },
  { desc: 'Netflix', value: -55.9, category: 'Assinaturas', date: '14/03' },
  { desc: 'Freelance — logo', value: 1200.0, category: 'Receita extra', date: '12/03' },
  { desc: 'Gasolina', value: -180.0, category: 'Transporte', date: '11/03' },
]

const goals = [
  { name: 'Fundo de emergência', current: 18000, target: 30000 },
  { name: 'Viagem Europa', current: 4500, target: 15000 },
  { name: 'MacBook Pro', current: 2200, target: 3500 },
]

export default function FinancesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Finanças"
        description="Controle financeiro pessoal e familiar"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">R$ 27.480</p>
                <p className="text-xs text-muted-foreground mt-1">Todas as contas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">R$ 9.700</p>
                <p className="text-xs text-muted-foreground mt-1">+14% vs mês anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">R$ 4.230</p>
                <p className="text-xs text-muted-foreground mt-1">-8% vs mês anterior</p>
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Transações Recentes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transações Recentes</CardTitle>
                <Button size="sm" variant="outline">Ver todas</Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recentTransactions.map((t) => (
                    <li key={t.desc + t.date} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t.desc}</p>
                        <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
                      </div>
                      <span className={`text-sm font-semibold ${t.value > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {t.value > 0 ? '+' : ''}R$ {Math.abs(t.value).toFixed(2).replace('.', ',')}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Metas Financeiras */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Metas Financeiras</CardTitle>
                <Button size="sm" variant="outline">Nova meta</Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {goals.map((g) => {
                  const pct = Math.round((g.current / g.target) * 100)
                  return (
                    <div key={g.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{g.name}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>R$ {g.current.toLocaleString('pt-BR')}</span>
                        <span>R$ {g.target.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
