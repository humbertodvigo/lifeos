'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { Plus, Loader2, Search, X, SlidersHorizontal, LayoutList, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TaskCard } from '@/components/projects/task-card'
import { TaskDetailDialog } from '@/components/projects/task-detail-dialog'
import { StageManager } from '@/components/projects/stage-manager'
import { createTask, updateTaskStatus } from '@/lib/actions/projects'
import { Task, Project, KanbanStage } from '@/types'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  tasks: Task[]
  projects: Project[]
  stages: KanbanStage[]
  projectFilter?: string | null
  onTasksChange?: (tasks: Task[]) => void
  onStagesChange?: (stages: KanbanStage[]) => void
}

// ─── Draggable card wrapper ──────────────────────────────────────────────────
function DraggableCard({
  task,
  onClick,
  isUpdating,
}: {
  task: Task
  onClick: (task: Task) => void
  isUpdating: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{ opacity: isDragging ? 0.35 : 1, touchAction: 'none' }}
    >
      <div className="relative group/drag">
        {/* Drag handle – visible on hover */}
        <div
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/drag:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="pl-4">
          <TaskCard task={task} onClick={onClick} isUpdating={isUpdating} />
        </div>
      </div>
    </div>
  )
}

// ─── Droppable column ────────────────────────────────────────────────────────
function DroppableColumn({
  stage,
  tasks,
  onTaskClick,
  updatingId,
  isPending,
  onAddTask,
}: {
  stage: KanbanStage
  tasks: Task[]
  onTaskClick: (task: Task) => void
  updatingId: string | null
  isPending: boolean
  onAddTask: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.slug })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl border bg-muted/20 transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/30'
      )}
      style={{ borderTopWidth: 3, borderTopColor: stage.color, borderTopStyle: 'solid' }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold">{stage.title}</span>
        </div>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-bold text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-2 px-2 pb-2 min-h-[80px]">
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 opacity-60">
            Nenhuma tarefa
          </p>
        )}
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            isUpdating={updatingId === task.id && isPending}
          />
        ))}
      </div>

      {/* Add task shortcut */}
      <button
        type="button"
        onClick={onAddTask}
        className="mx-2 mb-2 rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors text-left"
      >
        + Adicionar tarefa
      </button>
    </div>
  )
}

// ─── Main board ──────────────────────────────────────────────────────────────
export function KanbanBoard({
  tasks: initialTasks,
  projects,
  stages: initialStages,
  projectFilter,
  onTasksChange,
  onStagesChange,
}: KanbanBoardProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [stages, setStages] = useState<KanbanStage[]>(initialStages)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [stageManagerOpen, setStageManagerOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // New task form
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newProjectId, setNewProjectId] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])

  // DnD sensors with distance constraint (so clicks still work)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredTasks = tasks.filter((t) => {
    if (projectFilter !== undefined && projectFilter !== null) {
      if (projectFilter === '__none__' && t.project_id !== null) return false
      if (projectFilter !== '__none__' && t.project_id !== projectFilter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.tags.some((tag) => tag.toLowerCase().includes(q))) return false
    }
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterProject !== 'all' && t.project_id !== filterProject) return false
    return true
  })

  function handleTaskClick(task: Task) {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  function handleTaskUpdated(updated: Task) {
    const next = tasks.map((t) => t.id === updated.id ? updated : t)
    setTasks(next)
    if (selectedTask?.id === updated.id) setSelectedTask(updated)
    onTasksChange?.(next)
  }

  function handleTaskDeleted(taskId: string) {
    const next = tasks.filter((t) => t.id !== taskId)
    setTasks(next)
    onTasksChange?.(next)
  }

  function handleStatusChange(id: string, newStatus: string) {
    const previous = tasks
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t))
    setUpdatingId(id)

    startTransition(async () => {
      const result = await updateTaskStatus(id, newStatus)
      if (!result.success) {
        setTasks(previous)
        toast.error(result.error ?? 'Erro ao mover tarefa.')
      }
      setUpdatingId(null)
    })
  }

  // DnD handlers
  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over) return
    const task = tasks.find((t) => t.id === active.id)
    const targetSlug = over.id as string
    if (!task || task.status === targetSlug) return
    handleStatusChange(task.id, targetSlug)
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) { toast.error('Informe o título da tarefa.'); return }

    const tempId = `temp-${Date.now()}`
    const tempTask: Task = {
      id: tempId,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: 'todo',
      priority: newPriority,
      project_id: newProjectId || null,
      due_date: newDueDate || null,
      user_id: '',
      assignee_id: null,
      tags: [],
      created_at: new Date().toISOString(),
    }

    setIsCreating(true)
    setTasks((prev) => [...prev, tempTask])
    setCreateDialogOpen(false)
    setNewTitle('')
    setNewDescription('')
    setNewPriority('medium')
    setNewProjectId('')
    setNewDueDate('')

    const result = await createTask({
      title: tempTask.title,
      description: tempTask.description ?? undefined,
      priority: tempTask.priority,
      project_id: tempTask.project_id ?? undefined,
      due_date: tempTask.due_date ?? undefined,
    })
    setIsCreating(false)

    if (result.success) {
      toast.success('Tarefa criada!')
      router.refresh()
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
      setCreateDialogOpen(true)
      setNewTitle(tempTask.title)
      toast.error(result.error ?? 'Erro ao criar tarefa.')
    }
  }

  function handleStagesChange(updated: KanbanStage[]) {
    setStages(updated)
    onStagesChange?.(updated)
  }

  const activeFiltersCount = [filterPriority !== 'all', filterProject !== 'all'].filter(Boolean).length

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefas..."
              className="pl-8 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 relative"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setStageManagerOpen(true)}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Etapas
          </Button>

          <Button size="sm" className="h-9" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nova tarefa
          </Button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas</SelectItem>
                  <SelectItem value="high" className="text-xs">Alta</SelectItem>
                  <SelectItem value="medium" className="text-xs">Média</SelectItem>
                  <SelectItem value="low" className="text-xs">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">Projeto</label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setFilterPriority('all'); setFilterProject('all') }}
              >
                <X className="w-3 h-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
        )}

        {/* Kanban columns (horizontal scroll) */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const colTasks = filteredTasks.filter((t) => t.status === stage.slug)
            return (
              <DroppableColumn
                key={stage.slug}
                stage={stage}
                tasks={colTasks}
                onTaskClick={handleTaskClick}
                updatingId={updatingId}
                isPending={isPending}
                onAddTask={() => setCreateDialogOpen(true)}
              />
            )
          })}
        </div>
      </div>

      {/* DnD ghost overlay */}
      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="w-72 rotate-1 shadow-2xl opacity-95">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>

      {/* Create task dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
              <label className="text-sm font-medium">
                Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Textarea
                placeholder="Descrição ou contexto..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={newPriority} onValueChange={(v) => { if (v) setNewPriority(v as 'low' | 'medium' | 'high') }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Data de entrega <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Projeto <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Select value={newProjectId} onValueChange={(v) => { if (v !== null) setNewProjectId(v ?? '') }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isCreating}>
                {isCreating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>) : 'Criar tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task detail */}
      <TaskDetailDialog
        task={selectedTask}
        projects={projects}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTask(null) }}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
      />

      {/* Stage manager */}
      <StageManager
        open={stageManagerOpen}
        onClose={() => setStageManagerOpen(false)}
        stages={stages}
        onStagesChange={handleStagesChange}
      />
    </DndContext>
  )
}
