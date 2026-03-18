'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createStage, updateStage, deleteStage, reorderStages } from '@/lib/actions/kanban-stages'
import { KanbanStage } from '@/types'

interface StageManagerProps {
  open: boolean
  onClose: () => void
  stages: KanbanStage[]
  onStagesChange: (stages: KanbanStage[]) => void
}

const PRESET_COLORS = [
  '#64748b', '#3b82f6', '#8b5cf6', '#22c55e',
  '#f59e0b', '#ef4444', '#ec4899', '#06b6d4',
]

export function StageManager({ open, onClose, stages, onStagesChange }: StageManagerProps) {
  const [local, setLocal] = useState<KanbanStage[]>(stages)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // New stage form
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState('#8b5cf6')
  const [newTerminal, setNewTerminal] = useState(false)
  const [creating, setCreating] = useState(false)

  function handleOpen(isOpen: boolean) {
    if (isOpen) setLocal(stages)
    else onClose()
  }

  async function handleTitleChange(stage: KanbanStage, title: string) {
    const updated = local.map((s) => s.id === stage.id ? { ...s, title } : s)
    setLocal(updated)
  }

  async function handleTitleBlur(stage: KanbanStage) {
    const current = local.find((s) => s.id === stage.id)
    if (!current || current.title === stage.title || !current.title.trim()) return
    setSaving(stage.id)
    await updateStage(stage.id, { title: current.title.trim() })
    onStagesChange(local)
    setSaving(null)
  }

  async function handleColorChange(stage: KanbanStage, color: string) {
    const updated = local.map((s) => s.id === stage.id ? { ...s, color } : s)
    setLocal(updated)
    onStagesChange(updated)
    await updateStage(stage.id, { color })
  }

  async function handleTerminalToggle(stage: KanbanStage) {
    const next = !stage.is_terminal
    const updated = local.map((s) => s.id === stage.id ? { ...s, is_terminal: next } : s)
    setLocal(updated)
    onStagesChange(updated)
    await updateStage(stage.id, { is_terminal: next })
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const next = [...local]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setLocal(next)
    onStagesChange(next)
    await reorderStages(next.map((s) => s.id))
  }

  async function handleMoveDown(index: number) {
    if (index === local.length - 1) return
    const next = [...local]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setLocal(next)
    onStagesChange(next)
    await reorderStages(next.map((s) => s.id))
  }

  async function handleDelete(stage: KanbanStage) {
    if (local.length <= 1) { toast.error('Precisa ter pelo menos uma etapa.'); return }
    setDeleting(stage.id)
    const result = await deleteStage(stage.id)
    if (result.success) {
      const updated = local.filter((s) => s.id !== stage.id)
      setLocal(updated)
      onStagesChange(updated)
      toast.success('Etapa removida.')
    } else {
      toast.error(result.error ?? 'Erro ao remover.')
    }
    setDeleting(null)
  }

  async function handleCreate() {
    if (!newTitle.trim()) { toast.error('Informe o nome da etapa.'); return }
    setCreating(true)
    const result = await createStage({
      title: newTitle.trim(),
      color: newColor,
      is_terminal: newTerminal,
      position: local.length,
    })
    if (result.data) {
      const updated = [...local, result.data]
      setLocal(updated)
      onStagesChange(updated)
      setNewTitle('')
      setNewColor('#8b5cf6')
      setNewTerminal(false)
      toast.success('Etapa criada!')
    } else {
      toast.error(result.error ?? 'Erro ao criar etapa.')
    }
    setCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutList className="w-4 h-4" />
            Gerenciar Etapas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mt-2">
          {local.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 group"
            >
              {/* Color picker */}
              <div className="relative shrink-0">
                <div
                  className="w-5 h-5 rounded-full cursor-pointer border-2 border-white shadow-sm ring-1 ring-black/10"
                  style={{ backgroundColor: stage.color }}
                />
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5"
                  value={stage.color}
                  onChange={(e) => handleColorChange(stage, e.target.value)}
                >
                  {PRESET_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Color swatches inline */}
              <div className="hidden group-hover:flex gap-1 shrink-0">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorChange(stage, c)}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border transition-transform hover:scale-125',
                      stage.color === c ? 'ring-2 ring-offset-1 ring-current scale-125' : ''
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Title */}
              <Input
                value={local.find((s) => s.id === stage.id)?.title ?? stage.title}
                onChange={(e) => handleTitleChange(stage, e.target.value)}
                onBlur={() => handleTitleBlur(stage)}
                className="h-7 text-sm flex-1 min-w-0"
              />

              {/* Terminal badge */}
              <button
                onClick={() => handleTerminalToggle(stage)}
                className={cn(
                  'shrink-0 text-xs px-1.5 py-0.5 rounded border transition-colors',
                  stage.is_terminal
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400'
                    : 'bg-muted text-muted-foreground border-border'
                )}
                title="Clique para alternar: etapa final (concluída)"
              >
                {stage.is_terminal ? 'final' : 'ativa'}
              </button>

              {saving === stage.id && <Loader2 className="w-3 h-3 animate-spin shrink-0 text-muted-foreground" />}

              {/* Reorder */}
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === local.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(stage)}
                disabled={!!deleting}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                {deleting === stage.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>

        {/* Add new stage */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nova etapa</p>
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da etapa..."
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              className="h-8 shrink-0"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                    newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={() => setNewTerminal(!newTerminal)}
              className={cn(
                'text-xs px-2 py-0.5 rounded border transition-colors',
                newTerminal
                  ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400'
                  : 'bg-muted text-muted-foreground border-border'
              )}
            >
              {newTerminal ? 'etapa final' : 'etapa ativa'}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
