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
import { updateHabit } from '@/lib/actions/habits'
import { Habit, LIFE_AREAS } from '@/types'

interface EditHabitDialogProps {
  habit: Habit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (updated: Habit) => void
}

export function EditHabitDialog({ habit, open, onOpenChange, onSaved }: EditHabitDialogProps) {
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily')
  const [area, setArea] = useState('')
  const [targetStreak, setTargetStreak] = useState('21')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (habit) {
      setTitle(habit.title)
      setFrequency(habit.frequency)
      setArea(habit.area ?? '')
      setTargetStreak(String(habit.target_streak ?? 21))
    }
  }, [habit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!habit || !title.trim()) { toast.error('Informe o nome do hábito.'); return }

    setLoading(true)
    const result = await updateHabit(habit.id, {
      title: title.trim(),
      frequency,
      area: area || null,
      target_streak: parseInt(targetStreak) || 21,
    })

    if (result.success) {
      toast.success('Hábito atualizado!')
      onSaved({ ...habit, title: title.trim(), frequency, area: area || null, target_streak: parseInt(targetStreak) || 21 })
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
          <DialogTitle>Editar hábito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do hábito" required />
          </div>

          <div className="space-y-1.5">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={(v) => { if (v) setFrequency(v as typeof frequency) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Área de vida <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Select value={area} onValueChange={(v) => { if (v !== null) setArea(v === '__none__' ? '' : v) }}>
              <SelectTrigger><SelectValue placeholder="Selecione uma área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma</SelectItem>
                {LIFE_AREAS.map((a) => (
                  <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Meta de streak (dias)</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={targetStreak}
              onChange={(e) => setTargetStreak(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
