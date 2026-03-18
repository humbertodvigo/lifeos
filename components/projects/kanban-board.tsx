'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
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
import { TaskCard } from '@/components/projects/task-card'
import { createTask, updateTaskStatus, deleteTask } from '@/lib/actions/projects'
import { Task, Project } from '@/types'

interface KanbanBoardProps {
  tasks: Task[]
  projects: Project[]
}

type Column = {
  id: Task['status']
  label: string
  colorClass: string
}

const COLUMNS: Column[] = [
  { id: 'todo', label: 'A Fazer', colorClass: 'border-t-slate-400' },
  { id: 'in_progress', label: 'Em Progresso', colorClass: 'border-t-blue-500' },
  { id: 'done', label: 'Concluído', colorClass: 'border-t-green-500' },
  { id: 'archived', label: 'Arquivado', colorClass: 'border-t-gray-400' },
]

export function KanbanBoard({ tasks: initialTasks, projects }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newProjectId, setNewProjectId] = useState<string>('')
  const [newDueDate, setNewDueDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  function getColumnTasks(status: Task['status']) {
    return tasks.filter((t) => t.status === status)
  }

  function handleStatusChange(id: string, newStatus: Task['status']) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    )
    setUpdatingId(id)

    startTransition(async () => {
      const result = await updateTaskStatus(id, newStatus)
      if (result.success) {
        const statusLabels: Record<Task['status'], string> = {
          todo: 'A Fazer',
          in_progress: 'Em Progresso',
          done: 'Concluído',
          archived: 'Arquivado',
        }
        toast.success(`Tarefa movida para "${statusLabels[newStatus]}".`)
      } else {
        // Revert optimistic update on error
        setTasks(initialTasks)
        toast.error(result.error ?? 'Erro ao mover tarefa.')
      }
      setUpdatingId(null)
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== id))

    startTransition(async () => {
      const result = await deleteTask(id)
      if (result.success) {
        toast.success('Tarefa excluída.')
      } else {
        // Revert
        setTasks(initialTasks)
        toast.error(result.error ?? 'Erro ao excluir tarefa.')
      }
      setDeletingId(null)
    })
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Informe o título da tarefa.')
      return
    }

    setIsCreating(true)
    const result = await createTask({
      title: newTitle.trim(),
      priority: newPriority,
      project_id: newProjectId || undefined,
      due_date: newDueDate || undefined,
    })
    setIsCreating(false)

    if (result.success) {
      toast.success('Tarefa criada com sucesso!')
      setNewTitle('')
      setNewPriority('medium')
      setNewProjectId('')
      setNewDueDate('')
      setDialogOpen(false)
    } else {
      toast.error(result.error ?? 'Erro ao criar tarefa.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova tarefa
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Nome da tarefa..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prioridade</label>
              <Select
                value={newPriority}
                onValueChange={(v) => {
                  if (v) setNewPriority(v as 'low' | 'medium' | 'high')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Data de entrega{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Projeto{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Select
                  value={newProjectId}
                  onValueChange={(v) => {
                    if (v !== null) setNewProjectId(v ?? '')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                  'Criar tarefa'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id)
          return (
            <Card key={col.id} className={`flex flex-col border-t-2 ${col.colorClass}`}>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {col.label}
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-bold">
                    {colTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma tarefa
                  </p>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      isUpdating={
                        (updatingId === task.id || deletingId === task.id) && isPending
                      }
                    />
                  ))
                )}
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="w-full mt-auto rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  + Adicionar tarefa
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
