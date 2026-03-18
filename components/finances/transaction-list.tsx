'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { deleteTransaction } from '@/lib/actions/finances'
import { EditTransactionDialog } from '@/components/finances/edit-transaction-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Pencil } from 'lucide-react'

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
  category_id?: string | null
  account_id?: string
  categories?: Category | null
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions: initialTransactions }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    setTransactions(initialTransactions)
  }, [initialTransactions])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    try {
      const result = await deleteTransaction(id)
      if (result.success) {
        toast.success('Transação excluída.')
      } else {
        setTransactions(initialTransactions)
        toast.error(result.error ?? 'Erro ao excluir.')
      }
    } catch {
      setTransactions(initialTransactions)
      toast.error('Erro inesperado.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved(updated: Transaction) {
    setTransactions((prev) => prev.map((t) => t.id === updated.id ? updated : t))
  }

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhuma transação encontrada.
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors group"
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

            <div className="flex items-center gap-1.5 shrink-0">
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
                className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { setEditingTx(t); setEditOpen(true) }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <EditTransactionDialog
        transaction={editingTx}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleSaved}
      />
    </>
  )
}
