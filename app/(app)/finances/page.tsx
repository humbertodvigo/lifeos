import {
  getFinancialSummary,
  getAccounts,
  getTransactions,
  getFinancialGoals,
} from '@/lib/actions/finances'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TransactionForm } from '@/components/finances/transaction-form'
import { TransactionList } from '@/components/finances/transaction-list'
import { Wallet, TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react'

export default async function FinancesPage() {
  const [summaryRes, accountsRes, transactionsRes, goalsRes] = await Promise.all([
    getFinancialSummary(),
    getAccounts(),
    getTransactions(10),
    getFinancialGoals(),
  ])

  const summary = summaryRes.data
  const accounts = (accountsRes.data ?? []) as Array<{id:string;name:string;type:string;balance:number;currency:string;shared:boolean}>
  const transactions = transactionsRes.data ?? []
  const goals = (goalsRes.data ?? []) as Array<{id:string;title:string;target:number;current:number;deadline:string|null;shared:boolean}>

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Finanças"
        description="Controle financeiro pessoal"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Header row with action */}
          <div className="flex justify-end">
            <TransactionForm />
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {summary ? fmt(summary.total_balance) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Todas as contas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {summary ? fmt(summary.month_income) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mês</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {summary ? fmt(summary.month_expenses) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Poupança</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary != null ? `${summary.savings_rate}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Do total de receitas</p>
              </CardContent>
            </Card>
          </div>

          {/* Middle columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={transactions as any} />
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metas Financeiras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
                ) : (
                  goals.map((g) => {
                    const pct = g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0
                    return (
                      <div key={g.id} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{g.title}</span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{fmt(g.current)}</span>
                          <span>{fmt(g.target)}</span>
                        </div>
                        {g.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Accounts section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contas</CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                      </div>
                      <p className={`text-sm font-semibold shrink-0 ${account.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {account.balance.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: account.currency ?? 'BRL',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}
