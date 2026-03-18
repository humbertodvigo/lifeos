'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  X, Trash2, Plus, Circle, CheckCircle2, CalendarDays,
  Tag, Loader2, AlertCircle, FolderOpen, Play, Square as SquareIcon,
  Clock, Timer, Pause,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  updateTask, deleteTask,
  getSubtasks, createSubtask, updateSubtaskStatus, deleteSubtask,
} from '@/lib/actions/projects'
import { getTimeEntries, startTimer, stopTimer, deleteTimeEntry } from '@/lib/actions/time-entries'
import { Task, Subtask, Project, TimeEntry } from '@/types'

interface TaskDetailDialogProps {
  task: Task | null
  projects: Project[]
  open: boolean
  onClose: () => void
  onUpdated: (task: Task) => void
  onDeleted: (taskId: string) => void
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
] as const

const STATUS_OPTIONS = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'done', label: 'Concluído' },
  { value: 'archived', label: 'Arquivado' },
] as const

const STATUS_STRIP: Record<Task['status'], string> = {
  todo: 'bg-slate-300 dark:bg-slate-600',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
  archived: 'bg-gray-400',
}

const STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function nextSubtaskStatus(status: Subtask['status']): Subtask['status'] {
  if (status === 'todo') return 'in_progress'
  if (status === 'in_progress') return 'done'
  return 'todo'
}

function SubtaskStatusIcon({ status }: { status: Subtask['status'] }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />
  if (status === 'in_progress') return <Timer className="w-4 h-4 text-blue-500" />
  return <Circle className="w-4 h-4 text-muted-foreground" />
}

export function TaskDetailDialog({
  task,
  projects,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [projectId, setProjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [subtaskInput, setSubtaskInput] = useState('')
  const [loadingSubtasks, setLoadingSubtasks] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loadingTime, setLoadingTime] = useState(false)
  const [timerLoading, setTimerLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const [deleting, setDeleting] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  const activeEntry = timeEntries.find((e) => !e.ended_at) ?? null
  const completedEntries = timeEntries.filter((e) => e.ended_at)
  const activeSubtaskId = activeEntry?.subtask_id ?? null

  useEffect(() => {
    if (task && open) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setStatus(task.status)
      setPriority(task.priority)
      setProjectId(task.project_id ?? '')
      setDueDate(task.due_date ?? '')
      setTags(task.tags ?? [])
      setSubtasks([])
      setTimeEntries([])
      setElapsed(0)
      loadSubtasks(task.id)
      loadTimeData(task.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, open])

  // Live tick for active timer
  useEffect(() => {
    if (!activeEntry) { setElapsed(0); return }
    const started = new Date(activeEntry.started_at).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeEntry])

  async function loadSubtasks(taskId: string) {
    setLoadingSubtasks(true)
    const result = await getSubtasks(taskId)
    if (result.data) setSubtasks(result.data)
    setLoadingSubtasks(false)
  }

  async function loadTimeData(taskId: string) {
    setLoadingTime(true)
    const result = await getTimeEntries(taskId)
    if (result.data) setTimeEntries(result.data)
    setLoadingTime(false)
  }

  async function save(patch: Partial<Task>) {
    if (!task) return
    const result = await updateTask(task.id, patch)
    if (result.success) {
      onUpdated({ ...task, ...patch })
    } else {
      toast.error(result.error ?? 'Erro ao salvar.')
    }
  }

  function handleTitleBlur() {
    if (!task || title.trim() === task.title) return
    if (!title.trim()) { setTitle(task.title); return }
    save({ title: title.trim() })
  }

  function handleDescriptionBlur() {
    if (!task || description === (task.description ?? '')) return
    save({ description: description || null })
  }

  function handleStatusChange(val: string) {
    const s = val as Task['status']
    setStatus(s)
    save({ status: s })
  }

  function handlePriorityChange(val: string) {
    const p = val as Task['priority']
    setPriority(p)
    save({ priority: p })
  }

  function handleProjectChange(val: string) {
    const pid = val === '__none__' ? '' : val
    setProjectId(pid)
    save({ project_id: pid || null })
  }

  function handleDueDateChange(val: string) {
    setDueDate(val)
    save({ due_date: val || null })
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) { setTagInput(''); return }
    const next = [...tags, t]
    setTags(next)
    setTagInput('')
    save({ tags: next })
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t)
    setTags(next)
    save({ tags: next })
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  async function handleAddSubtask() {
    if (!task || !subtaskInput.trim()) return
    setAddingSubtask(true)
    const result = await createSubtask(task.id, subtaskInput.trim())
    if (result.data) {
      setSubtasks((prev) => [...prev, result.data!])
      setSubtaskInput('')
    } else {
      toast.error(result.error ?? 'Erro ao criar subtarefa.')
    }
    setAddingSubtask(false)
  }

  function handleSubtaskKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask() }
  }

  async function handleCycleSubtask(sub: Subtask) {
    const next = nextSubtaskStatus(sub.status)
    setSubtasks((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: next } : s))
    const result = await updateSubtaskStatus(sub.id, next)
    if (!result.success) {
      setSubtasks((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: sub.status } : s))
      toast.error(result.error ?? 'Erro.')
    }
  }

  async function handleDeleteSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
    const result = await deleteSubtask(id)
    if (!result.success) toast.error(result.error ?? 'Erro ao excluir subtarefa.')
  }

  async function handleStartTimer(subtaskId?: string) {
    if (!task) return
    setTimerLoading(true)
    const result = await startTimer(task.id, subtaskId)
    if (result.data) {
      // If stopping a previous timer, update it first
      setTimeEntries((prev) => {
        const next = prev.map((e) => e.ended_at === null ? { ...e, ended_at: new Date().toISOString() } : e)
        return [result.data!, ...next]
      })
    } else {
      toast.error(result.error ?? 'Erro ao iniciar timer.')
    }
    setTimerLoading(false)
  }

  async function handleStopTimer() {
    if (!activeEntry) return
    setTimerLoading(true)
    const result = await stopTimer(activeEntry.id)
    if (result.data) {
      setTimeEntries((prev) => prev.map((e) => e.id === activeEntry.id ? result.data! : e))
    } else {
      toast.error(result.error ?? 'Erro ao parar timer.')
    }
    setTimerLoading(false)
  }

  function getSubtaskTime(subtaskId: string): number {
    return timeEntries
      .filter((e) => e.subtask_id === subtaskId && e.ended_at)
      .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) +
      (activeEntry?.subtask_id === subtaskId ? elapsed : 0)
  }

  async function handleDeleteEntry(id: string) {
    setTimeEntries((prev) => prev.filter((e) => e.id !== id))
    const result = await deleteTimeEntry(id)
    if (!result.success) toast.error(result.error ?? 'Erro.')
  }

  async function handleDeleteTask() {
    if (!task) return
    setDeleting(true)
    const result = await deleteTask(task.id)
    if (result.success) {
      toast.success('Tarefa excluída.')
      onDeleted(task.id)
      onClose()
    } else {
      toast.error(result.error ?? 'Erro ao excluir.')
      setDeleting(false)
    }
  }

  const doneCount = subtasks.filter((s) => s.status === 'done').length
  const inProgressCount = subtasks.filter((s) => s.status === 'in_progress').length
  const pct = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0
  const isOverdue = dueDate && status !== 'done' && status !== 'archived'
    ? isPast(new Date(dueDate + 'T23:59:59'))
    : false
  const projectName = projects.find((p) => p.id === (projectId || task?.project_id))?.title
  const totalSeconds = completedEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) +
    (activeEntry ? elapsed : 0)

  if (!open || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[4vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-hidden bg-background rounded-xl border shadow-2xl flex flex-col">
        {/* Status strip */}
        <div className={cn('h-1 w-full', STATUS_STRIP[status])} />

        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b">
          <div className="flex-1 min-w-0">
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-lg font-semibold border-transparent shadow-none focus-visible:ring-0 focus-visible:border-border px-0 h-auto py-0"
              placeholder="Título da tarefa"
            />
            {projectName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <FolderOpen className="w-3 h-3" />
                {projectName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: 2 columns */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left: main content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-w-0">

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Adicione uma descrição, notas ou contexto para esta tarefa..."
                className="min-h-[80px] resize-y text-sm"
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                Subtarefas
                {subtasks.length > 0 && (
                  <span className="font-normal normal-case">
                    ({doneCount}/{subtasks.length}
                    {inProgressCount > 0 && `, ${inProgressCount} em andamento`})
                  </span>
                )}
              </label>

              {subtasks.length > 0 && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              {loadingSubtasks ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Carregando subtarefas...
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {subtasks.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <button
                        onClick={() => handleCycleSubtask(sub)}
                        className="shrink-0 transition-transform hover:scale-110"
                        title={
                          sub.status === 'todo' ? 'Clique para iniciar'
                            : sub.status === 'in_progress' ? 'Clique para concluir'
                              : 'Clique para reabrir'
                        }
                      >
                        <SubtaskStatusIcon status={sub.status} />
                      </button>
                      <span className={cn(
                        'flex-1 text-sm',
                        sub.status === 'done' && 'line-through text-muted-foreground',
                        sub.status === 'in_progress' && 'text-blue-600 dark:text-blue-400 font-medium',
                      )}>
                        {sub.title}
                      </span>

                      {/* Subtask timer */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeSubtaskId === sub.id ? (
                          <>
                            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                              {formatDuration(elapsed)}
                            </span>
                            <button
                              onClick={handleStopTimer}
                              disabled={timerLoading}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Parar timer"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </>
                        ) : (
                          <>
                            {getSubtaskTime(sub.id) > 0 && (
                              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                {formatDuration(getSubtaskTime(sub.id))}
                              </span>
                            )}
                            <button
                              onClick={() => handleStartTimer(sub.id)}
                              disabled={timerLoading}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Iniciar timer nesta subtarefa"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-2">
                <Input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  placeholder="Nova subtarefa... (Enter para adicionar)"
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  onClick={handleAddSubtask}
                  disabled={addingSubtask || !subtaskInput.trim()}
                >
                  {addingSubtask
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Plus className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Time history */}
            {(completedEntries.length > 0 || loadingTime) && (
              <div className="space-y-2">
                <div className="border-t" />
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Histórico de Tempo
                </label>
                {loadingTime ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {completedEntries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center gap-2 group text-xs text-muted-foreground rounded-md px-2 py-1 hover:bg-muted/30"
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="font-mono font-medium text-foreground/80 w-14 shrink-0">
                          {formatDuration(entry.duration_seconds ?? 0)}
                        </span>
                        <span className="flex-1">
                          {format(parseISO(entry.started_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="w-52 shrink-0 border-l overflow-y-auto px-4 py-5 space-y-4 bg-muted/10">

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      <span className={cn('px-1.5 py-0.5 rounded-sm text-xs font-medium', STATUS_COLORS[o.value])}>
                        {o.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prioridade</label>
              <Select value={priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Entrega
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className={cn('h-8 text-xs', isOverdue && 'border-red-400 text-red-600')}
              />
              {isOverdue && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Atrasada
                </p>
              )}
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projeto</label>
              <Select value={projectId || '__none__'} onValueChange={handleProjectChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-muted-foreground">Nenhum</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t" />

            {/* Timer */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Timer className="w-3 h-3" /> Tempo
              </label>

              {totalSeconds > 0 && (
                <p className="text-base font-mono font-semibold tabular-nums">
                  {formatDuration(totalSeconds)}
                </p>
              )}

              {activeEntry ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatDuration(elapsed)}{activeSubtaskId ? ' (subtarefa)' : ' em andamento'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs gap-1.5"
                    onClick={handleStopTimer}
                    disabled={timerLoading}
                  >
                    {timerLoading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <SquareIcon className="w-3 h-3 fill-current" />}
                    Pausar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs gap-1.5"
                  onClick={() => handleStartTimer()}
                  disabled={timerLoading}
                >
                  {timerLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Play className="w-3 h-3 fill-current" />}
                  Iniciar timer
                </Button>
              )}
            </div>

            <div className="border-t" />

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1 h-5">
                    {t}
                    <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="+ tag"
                  className="h-6 text-xs px-2"
                />
                {tagInput && (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addTag}>
                    OK
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Criada em {format(parseISO(task.created_at), "d 'de' MMM yyyy", { locale: ptBR })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
            onClick={handleDeleteTask}
            disabled={deleting}
          >
            {deleting
              ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
            Excluir tarefa
          </Button>
        </div>
      </div>
    </div>
  )
}
