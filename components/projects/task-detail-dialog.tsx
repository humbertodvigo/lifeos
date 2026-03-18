'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  X, Trash2, Plus, CheckSquare, Square, CalendarDays,
  Tag, Loader2, AlertCircle, FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  updateTask, deleteTask,
  getSubtasks, createSubtask, toggleSubtask, deleteSubtask,
} from '@/lib/actions/projects'
import { Task, Subtask, Project } from '@/types'

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

const STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
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
  const [deleting, setDeleting] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task && open) {
      setTitle(task.title)
      setStatus(task.status)
      setPriority(task.priority)
      setProjectId(task.project_id ?? '')
      setDueDate(task.due_date ?? '')
      setTags(task.tags ?? [])
      setSubtasks([])
      loadSubtasks(task.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, open])

  async function loadSubtasks(taskId: string) {
    setLoadingSubtasks(true)
    const result = await getSubtasks(taskId)
    if (result.data) setSubtasks(result.data)
    setLoadingSubtasks(false)
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

  async function handleToggleSubtask(id: string, done: boolean) {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !done } : s))
    const result = await toggleSubtask(id, !done)
    if (!result.success) {
      setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done } : s))
      toast.error(result.error ?? 'Erro.')
    }
  }

  async function handleDeleteSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
    const result = await deleteSubtask(id)
    if (!result.success) {
      toast.error(result.error ?? 'Erro ao excluir subtarefa.')
    }
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

  const doneCount = subtasks.filter((s) => s.done).length
  const isOverdue = dueDate && status !== 'done' && status !== 'archived'
    ? isPast(new Date(dueDate + 'T23:59:59'))
    : false

  const projectName = projects.find((p) => p.id === (projectId || task?.project_id))?.title

  if (!open || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[6vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[88vh] overflow-hidden bg-background rounded-xl border shadow-2xl flex flex-col">
        {/* Status strip */}
        <div className={cn('h-1 w-full', {
          'bg-slate-300 dark:bg-slate-600': status === 'todo',
          'bg-blue-500': status === 'in_progress',
          'bg-green-500': status === 'done',
          'bg-gray-400': status === 'archived',
        })} />

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

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1 h-6">
                  {t}
                  <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="+ adicionar tag"
                  className="h-6 text-xs w-28 px-2"
                />
                {tagInput && (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addTag}>
                    OK
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <CheckSquare className="w-3 h-3" /> Subtarefas
                {subtasks.length > 0 && (
                  <span className="font-normal normal-case text-muted-foreground ml-1">({doneCount}/{subtasks.length})</span>
                )}
              </label>
            </div>

            {subtasks.length > 0 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
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
                  <li key={sub.id} className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors">
                    <button
                      onClick={() => handleToggleSubtask(sub.id, sub.done)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {sub.done
                        ? <CheckSquare className="w-4 h-4 text-green-500" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                    <span className={cn('flex-1 text-sm', sub.done && 'line-through text-muted-foreground')}>
                      {sub.title}
                    </span>
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
                {addingSubtask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </Button>
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
            {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
            Excluir tarefa
          </Button>
        </div>
      </div>
    </div>
  )
}
