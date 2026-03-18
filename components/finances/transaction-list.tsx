'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { deleteTransaction } from '@/lib/actions/finances'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Category {
  name: string
  color: string
  type: string
}

interface Transaction {
  id: string
  amount: number
  type: string
  date: string
  description: string | null
  categories: Category | null
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteTransaction(id)
      if (result.success) {
        toast.success('Transação excluída.')
      } else {
        toast.error(result.error ?? 'Erro ao excluir.')
      }
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setDeletingId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhuma transação encontrada.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {transactions.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">
                {t.description ?? (t.type === 'income' ? 'Receita' : 'Despesa')}
              </p>
              {t.categories && (
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: t.categories.color + '22', color: t.categories.color }}
                  className="text-xs shrink-0"
                >
                  {t.categories.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(parseISO(t.date), "d 'de' MMM yyyy", { locale: ptBR })}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-sm font-semibold ${
                t.type === 'income' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {t.type === 'income' ? '+' : '-'}
              {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(t.id)}
              disabled={deletingId === t.id}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
