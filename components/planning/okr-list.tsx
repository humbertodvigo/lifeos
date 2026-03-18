'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import {
  createOKR,
  deleteOKR,
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
} from '@/lib/actions/planning'
import { cn } from '@/lib/utils'

interface KeyResult {
  id: string
  okr_id: string
  title: string
  target: number
  current: number
  unit: string
  due_date: string | null
}

interface OKR {
  id: string
  title: string
  period: string
  year: number
  quarter: number | null
  status: string
  key_results: KeyResult[]
}

interface OKRListProps {
  initialOKRs: OKR[]
}

const PERIOD_LABELS: Record<string, string> = {
  annual: 'Anual',
  q1: 'Q1',
  q2: 'Q2',
  q3: 'Q3',
  q4: 'Q4',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  paused: 'Pausado',
}

function calcOKRProgress(krs: KeyResult[]): number {
  if (krs.length === 0) return 0
  const total = krs.reduce((sum, kr) => {
    const pct = kr.target > 0 ? Math.min((kr.current / kr.target) * 100, 100) : 0
    return sum + pct
  }, 0)
  return Math.round(total / krs.length)
}

export function OKRList({ initialOKRs }: OKRListProps) {
  const [okrs, setOKRs] = useState<OKR[]>(initialOKRs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialOKRs.map((o) => o.id))
  )
  const [newOKROpen, setNewOKROpen] = useState(false)
  const [addKROpen, setAddKROpen] = useState<string | null>(null) // okr_id
  const [editingKR, setEditingKR] = useState<{ id: string; value: string } | null>(null)

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDeleteOKR(id: string, title: string) {
    if (!confirm(`Excluir OKR "${title}"? Isso removerá todos os resultados-chave.`)) return
    const result = await deleteOKR(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('OKR excluído.')
      setOKRs((prev) => prev.filter((o) => o.id !== id))
    }
  }

  async function handleSaveKREdit(krId: string, okrId: string) {
    if (!editingKR) return
    const val = parseFloat(editingKR.value)
    if (isNaN(val)) {
      toast.error('Valor inválido.')
      return
    }
    const result = await updateKeyResult(krId, val)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Atualizado!')
      setOKRs((prev) =>
        prev.map((o) => {
          if (o.id !== okrId) return o
          return {
            ...o,
            key_results: o.key_results.map((kr) =>
              kr.id === krId ? { ...kr, current: val } : kr
            ),
          }
        })
      )
      setEditingKR(null)
    }
  }

  async function handleDeleteKR(krId: string, okrId: string) {
    if (!confirm('Excluir este resultado-chave?')) return
    const result = await deleteKeyResult(krId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Resultado-chave excluído.')
      setOKRs((prev) =>
        prev.map((o) => {
          if (o.id !== okrId) return o
          return {
            ...o,
            key_results: o.key_results.filter((kr) => kr.id !== krId),
          }
        })
      )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          OKRs ({okrs.length})
        </h2>
        <Button size="sm" onClick={() => setNewOKROpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Novo OKR
        </Button>
      </div>

      {okrs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum OKR criado ainda.{' '}
            <button
              onClick={() => setNewOKROpen(true)}
              className="text-primary hover:underline"
            >
              Criar primeiro OKR
            </button>
          </CardContent>
        </Card>
      ) : (
        okrs.map((okr) => {
          const expanded = expandedIds.has(okr.id)
          const progress = calcOKRProgress(okr.key_results)

          return (
            <Card key={okr.id}>
              <CardContent className="py-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleExpand(okr.id)}
                    className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{okr.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {PERIOD_LABELS[okr.period] ?? okr.period}
                        {okr.quarter ? ` Q${okr.quarter}` : ''}
                      </Badge>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          STATUS_COLORS[okr.status] ?? STATUS_COLORS.active
                        )}
                      >
                        {STATUS_LABELS[okr.status] ?? okr.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteOKR(okr.id, okr.title)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Key Results */}
                {expanded && (
                  <div className="pl-6 space-y-2">
                    {okr.key_results.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhum resultado-chave. Adicione abaixo.
                      </p>
                    ) : (
                      okr.key_results.map((kr) => {
                        const krPct =
                          kr.target > 0
                            ? Math.min(Math.round((kr.current / kr.target) * 100), 100)
                            : 0
                        const isEditing = editingKR?.id === kr.id

                        return (
                          <div
                            key={kr.id}
                            className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium flex-1">{kr.title}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    setEditingKR(
                                      isEditing
                                        ? null
                                        : { id: kr.id, value: String(kr.current) }
                                    )
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteKR(kr.id, okr.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Progress value={krPct} className="flex-1 h-1.5" />
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                {kr.current}/{kr.target} {kr.unit}
                              </span>
                            </div>

                            {isEditing && (
                              <div className="flex items-center gap-2 pt-1">
                                <Input
                                  type="number"
                                  value={editingKR?.value ?? ''}
                                  onChange={(e) =>
                                    setEditingKR((prev) =>
                                      prev ? { ...prev, value: e.target.value } : null
                                    )
                                  }
                                  className="h-7 text-xs w-28"
                                  placeholder="Valor atual"
                                />
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleSaveKREdit(kr.id, okr.id)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => setEditingKR(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7"
                      onClick={() => setAddKROpen(okr.id)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar Resultado-Chave
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}

      {/* New OKR Dialog */}
      <NewOKRDialog
        open={newOKROpen}
        onOpenChange={setNewOKROpen}
        onCreated={(okr) => setOKRs((prev) => [...prev, okr])}
      />

      {/* Add Key Result Dialog */}
      {addKROpen && (
        <AddKeyResultDialog
          open={!!addKROpen}
          onOpenChange={() => setAddKROpen(null)}
          okrId={addKROpen}
          onCreated={(kr) => {
            setOKRs((prev) =>
              prev.map((o) =>
                o.id === kr.okr_id
                  ? { ...o, key_results: [...o.key_results, kr] }
                  : o
              )
            )
            setAddKROpen(null)
          }}
        />
      )}
    </div>
  )
}

function NewOKRDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (okr: OKR) => void
}) {
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('annual')
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState<string>('1')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      return
    }
    setLoading(true)
    try {
      const result = await createOKR({
        title,
        period,
        year,
        quarter: period !== 'annual' ? parseInt(quarter) : undefined,
      })
      if (result.error) throw new Error(result.error)
      toast.success('OKR criado!')
      onCreated({ ...(result.data as unknown as OKR), key_results: [] })
      setTitle('')
      setPeriod('annual')
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar OKR.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo OKR</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lançar produto SaaS..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="q1">Q1</SelectItem>
                  <SelectItem value="q2">Q2</SelectItem>
                  <SelectItem value="q3">Q3</SelectItem>
                  <SelectItem value="q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>
          </div>
          {period !== 'annual' && (
            <div className="space-y-1.5">
              <Label>Trimestre</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1 (Jan–Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Abr–Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul–Set)</SelectItem>
                  <SelectItem value="4">Q4 (Out–Dez)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Criando...' : 'Criar OKR'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddKeyResultDialog({
  open,
  onOpenChange,
  okrId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  okrId: string
  onCreated: (kr: KeyResult) => void
}) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      return
    }
    const targetNum = parseFloat(target)
    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error('Meta deve ser um número positivo.')
      return
    }
    if (!unit.trim()) {
      toast.error('A unidade é obrigatória (ex: %, pessoas, R$).')
      return
    }

    setLoading(true)
    try {
      const result = await createKeyResult({
        okr_id: okrId,
        title,
        target: targetNum,
        unit,
        due_date: dueDate || undefined,
      })
      if (result.error) throw new Error(result.error)
      toast.success('Resultado-chave adicionado!')
      onCreated(result.data!)
      setTitle('')
      setTarget('')
      setUnit('')
      setDueDate('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar resultado-chave.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Resultado-Chave</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 100 usuários beta..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Meta</Label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="100"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="usuários, %, R$..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prazo (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
