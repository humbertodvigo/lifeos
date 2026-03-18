'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Flame, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toggleHabitLog, createHabit, deleteHabit } from '@/lib/actions/habits'
import { Habit, HabitLog, LIFE_AREAS } from '@/types'

interface HabitTrackerProps {
  habits: Habit[]
  todayLogs: HabitLog[]
  streaks: Record<string, number>
}

export function HabitTracker({ habits: initialHabits, todayLogs: initialLogs, streaks: initialStreaks }: HabitTrackerProps) {
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [isPending, startTransition] = useTransition()
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>(initialLogs)
  const [streaks, setStreaks] = useState<Record<string, number>>(initialStreaks)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // New habit form state
  const [newTitle, setNewTitle] = useState('')
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily')
  const [newArea, setNewArea] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)

  // Sync with server after router.refresh()
  useEffect(() => {
    setHabits(initialHabits)
    setTodayLogs(initialLogs)
    setStreaks(initialStreaks)
  }, [initialHabits, initialLogs, initialStreaks])

  const doneSet = new Set(todayLogs.filter((l) => l.done).map((l) => l.habit_id))
  const doneCount = habits.filter((h) => doneSet.has(h.id)).length

  function handleToggle(habit: Habit) {
    const isDone = doneSet.has(habit.id)
    setTogglingId(habit.id)

    // Optimistic update
    if (isDone) {
      setTodayLogs((prev) => prev.map((l) => l.habit_id === habit.id ? { ...l, done: false } : l))
    } else {
      setTodayLogs((prev) => {
        const existing = prev.find((l) => l.habit_id === habit.id)
        if (existing) return prev.map((l) => l.habit_id === habit.id ? { ...l, done: true } : l)
        return [...prev, { id: `temp-${habit.id}`, habit_id: habit.id, user_id: '', date: today, done: true, note: null }]
      })
    }

    startTransition(async () => {
      const result = await toggleHabitLog(habit.id, today, !isDone)
      if (result.success) {
        toast.success(
          !isDone
            ? `"${habit.title}" concluído!`
            : `"${habit.title}" desmarcado.`
        )
      } else {
        // Revert
        setTodayLogs(initialLogs)
        toast.error(result.error ?? 'Erro ao registrar hábito.')
      }
      setTogglingId(null)
    })
  }

  function handleDelete(habit: Habit) {
    setDeletingId(habit.id)
    // Optimistic remove
    setHabits((prev) => prev.filter((h) => h.id !== habit.id))

    startTransition(async () => {
      const result = await deleteHabit(habit.id)
      if (result.success) {
        toast.success(`"${habit.title}" removido.`)
      } else {
        setHabits(initialHabits)
        toast.error(result.error ?? 'Erro ao remover hábito.')
      }
      setDeletingId(null)
    })
  }

  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Informe o nome do hábito.')
      return
    }

    setIsCreating(true)
    const result = await createHabit({
      title: newTitle.trim(),
      frequency: newFrequency,
      area: newArea || undefined,
    })
    setIsCreating(false)

    if (result.success) {
      toast.success('Hábito criado com sucesso!')
      setNewTitle('')
      setNewFrequency('daily')
      setNewArea('')
      setDialogOpen(false)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro ao criar hábito.')
    }
  }

  const frequencyLabel: Record<string, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    custom: 'Personalizado',
  }

  return (
    <div className="space-y-6">
      {/* Header with new habit button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {doneCount}/{habits.length} hábitos concluídos hoje
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo hábito
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo hábito</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateHabit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do hábito</label>
              <Input
                placeholder="Ex.: Meditação, Exercício..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Frequência</label>
              <Select
                value={newFrequency}
                onValueChange={(v) => {
                  if (v) setNewFrequency(v as 'daily' | 'weekly' | 'custom')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Área de vida{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Select
                value={newArea}
                onValueChange={(v) => {
                  if (v !== null) setNewArea(v ?? '')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((area) => (
                    <SelectItem key={area.slug} value={area.slug}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar hábito'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              Nenhum hábito ativo ainda.
            </p>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro hábito
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Habits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Hábitos de Hoje
                <span className="text-sm font-normal text-muted-foreground">
                  {doneCount}/{habits.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {habits.map((habit) => {
                  const done = doneSet.has(habit.id)
                  const isToggling = togglingId === habit.id && isPending
                  const isDeleting = deletingId === habit.id && isPending

                  return (
                    <li
                      key={habit.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => !isToggling && handleToggle(habit)}
                          disabled={isToggling || isPending}
                          className="shrink-0 transition-colors"
                          aria-label={done ? 'Desmarcar hábito' : 'Marcar hábito'}
                        >
                          {isToggling ? (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          ) : done ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <span
                            className={`text-sm block truncate ${
                              done ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {habit.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {frequencyLabel[habit.frequency] ?? habit.frequency}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {streaks[habit.id] ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => !isDeleting && handleDelete(habit)}
                          disabled={isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          aria-label="Remover hábito"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Streak Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Streaks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {habits.map((habit) => {
                const streak = streaks[habit.id] ?? 0
                const target = habit.target_streak ?? 21
                const pct = Math.min((streak / target) * 100, 100)

                return (
                  <div key={habit.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{habit.title}</span>
                      <span className="text-muted-foreground shrink-0 ml-2 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {streak} / {target} dias
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
