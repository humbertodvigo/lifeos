'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { updateTransaction, getCategories, getAccounts } from '@/lib/actions/finances'

interface Category { id: string; name: string; type: string; color: string }
interface Account { id: string; name: string; currency: string }
interface Transaction {
  id: string
  amount: number
  type: string
  date: string
  description: string | null
  category_id?: string | null
  account_id?: string
  categories?: { name: string; color: string; type: string } | null
}

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (updated: Transaction) => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange, onSaved }: EditTransactionDialogProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (open && transaction) {
      setType(transaction.type as 'income' | 'expense')
      setAmount(String(transaction.amount))
      setDescription(transaction.description ?? '')
      setDate(transaction.date)
      setCategoryId(transaction.category_id ?? '')
      setAccountId(transaction.account_id ?? '')

      setLoadingData(true)
      Promise.all([getCategories(), getAccounts()]).then(([cats, accs]) => {
        if (cats.data) setCategories(cats.data as Category[])
        if (accs.data) setAccounts(accs.data as Account[])
        setLoadingData(false)
      })
    }
  }, [open, transaction])

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transaction) return
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Valor inválido.')
      return
    }

    setLoading(true)
    const result = await updateTransaction(transaction.id, {
      amount: parsedAmount,
      type,
      date,
      description: description.trim() || null,
      category_id: categoryId || null,
      account_id: accountId || undefined,
    })

    if (result.success) {
      toast.success('Transação atualizada!')
      onSaved({
        ...transaction,
        amount: parsedAmount,
        type,
        date,
        description: description.trim() || null,
        category_id: categoryId || null,
        account_id: accountId || transaction.account_id,
        categories: categoryId
          ? (categories.find((c) => c.id === categoryId) ?? null) as Transaction['categories']
          : null,
      })
      onOpenChange(false)
    } else {
      toast.error(result.error ?? 'Erro ao atualizar.')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar transação</DialogTitle>
        </DialogHeader>
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Type toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              {(['income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    type === t
                      ? t === 'income'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'hover:bg-muted'
                  )}
                >
                  {t === 'income' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input placeholder="Descrição..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {filteredCategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Categoria <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {accounts.length > 0 && (
              <div className="space-y-1.5">
                <Label>Conta</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
