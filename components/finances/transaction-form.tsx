'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { createTransaction, getCategories, getAccounts } from '@/lib/actions/finances'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PlusCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: string
  color: string
}

interface Account {
  id: string
  name: string
  currency: string
}

export function TransactionForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    if (!open) return
    async function load() {
      const [catRes, accRes] = await Promise.all([getCategories(), getAccounts()])
      if (catRes.data) setCategories(catRes.data as Category[])
      if (accRes.data) setAccounts(accRes.data as Account[])
    }
    load()
  }, [open])

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) {
      toast.error('Selecione uma conta.')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Informe um valor válido.')
      return
    }

    setLoading(true)
    try {
      const result = await createTransaction({
        account_id: accountId,
        category_id: categoryId || null,
        amount: parseFloat(amount),
        type,
        date,
        description: description.trim() || null,
      })

      if (result.success) {
        toast.success('Transação criada com sucesso!')
        setOpen(false)
        setAmount('')
        setDescription('')
        setCategoryId('')
        setAccountId('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setType('expense')
      } else {
        toast.error(result.error ?? 'Erro ao criar transação.')
      }
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              Despesa
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.length === 0 ? (
                  <SelectItem value="__none" disabled>Nenhuma categoria</SelectItem>
                ) : (
                  filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <Label>Conta *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.length === 0 ? (
                  <SelectItem value="__none" disabled>Nenhuma conta</SelectItem>
                ) : (
                  accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar transação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
