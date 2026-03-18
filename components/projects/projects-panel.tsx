'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Loader2, FolderOpen, CheckCircle2, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { cn } from '@/lib/utils'
import { createProject, updateProject, deleteProject } from '@/lib/actions/projects'
import { Project, Task } from '@/types'

interface ProjectsPanelProps {
  projects: Project[]
  tasks: Task[]
  selectedProjectId: string | null
  onSelectProject: (id: string | null) => void
  onProjectsChange: (projects: Project[]) => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  archived: 'bg-gray-400',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-gray-400',
}

export function ProjectsPanel({
  projects,
  tasks,
  selectedProjectId,
  onSelectProject,
  onProjectsChange,
}: ProjectsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [creating, setCreating] = useState(false)

  // Count tasks per project
  function getTaskStats(projectId: string) {
    const projectTasks = tasks.filter((t) => t.project_id === projectId && t.status !== 'archived')
    const done = projectTasks.filter((t) => t.status === 'done').length
    return { total: projectTasks.length, done }
  }

  // Count tasks with no project
  const orphanTasks = tasks.filter((t) => !t.project_id && t.status !== 'archived')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) { toast.error('Informe o título.'); return }
    setCreating(true)
    const result = await createProject({
      title: newTitle.trim(),
      priority: newPriority,
      due_date: newDueDate || undefined,
    })
    if (result.success) {
      toast.success('Projeto criado!')
      setNewTitle('')
      setNewPriority('medium')
      setNewDueDate('')
      setCreateOpen(false)
      // Refresh - will come via router.refresh in parent
      window.location.reload()
    } else {
      toast.error(result.error ?? 'Erro ao criar projeto.')
    }
    setCreating(false)
  }

  async function handleArchive(project: Project) {
    const result = await updateProject(project.id, { status: 'archived' })
    if (result.success) {
      toast.success('Projeto arquivado.')
      onProjectsChange(projects.filter((p) => p.id !== project.id))
      if (selectedProjectId === project.id) onSelectProject(null)
    } else {
      toast.error(result.error ?? 'Erro.')
    }
  }

  async function handleMarkDone(project: Project) {
    const result = await updateProject(project.id, { status: 'completed' })
    if (result.success) {
      toast.success('Projeto concluído!')
      onProjectsChange(projects.map((p) => p.id === project.id ? { ...p, status: 'completed' } : p))
    } else {
      toast.error(result.error ?? 'Erro.')
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Excluir "${project.title}"? As tarefas serão mantidas sem projeto.`)) return
    const result = await deleteProject(project.id)
    if (result.success) {
      toast.success('Projeto excluído.')
      onProjectsChange(projects.filter((p) => p.id !== project.id))
      if (selectedProjectId === project.id) onSelectProject(null)
    } else {
      toast.error(result.error ?? 'Erro.')
    }
  }

  const activeProjects = projects.filter((p) => p.status !== 'archived')

  return (
    <div className="w-64 shrink-0 border-r flex flex-col h-full bg-muted/20">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Projetos</h2>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {/* All tasks */}
        <button
          onClick={() => onSelectProject(null)}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left',
            selectedProjectId === null
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 truncate font-medium">Todas as tarefas</span>
          <span className={cn(
            'text-xs shrink-0 tabular-nums',
            selectedProjectId === null ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            {tasks.filter((t) => t.status !== 'archived').length}
          </span>
        </button>

        {/* Projects list */}
        {activeProjects.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground px-2.5 pb-1 uppercase tracking-wide">
              Projetos
            </p>
            {activeProjects.map((project) => {
              const stats = getTaskStats(project.id)
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
              const isOverdue = project.due_date && project.status === 'active'
                ? isPast(new Date(project.due_date + 'T23:59:59'))
                : false

              return (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className={cn(
                      'w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-md text-sm transition-colors text-left pr-8',
                      selectedProjectId === project.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <span className={cn(
                      'w-2 h-2 rounded-full mt-1 shrink-0',
                      PRIORITY_DOT[project.priority] ?? 'bg-gray-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm leading-tight">{project.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {stats.total > 0 ? (
                          <>
                            <div className="flex-1 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-current rounded-full transition-all opacity-60"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={cn(
                              'text-xs shrink-0',
                              selectedProjectId === project.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                              {stats.done}/{stats.total}
                            </span>
                          </>
                        ) : (
                          <span className={cn(
                            'text-xs',
                            selectedProjectId === project.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            Sem tarefas
                          </span>
                        )}
                      </div>
                      {project.due_date && (
                        <p className={cn(
                          'text-xs mt-0.5',
                          isOverdue
                            ? 'text-red-500'
                            : selectedProjectId === project.id ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        )}>
                          {isOverdue ? '⚠ ' : ''}
                          {format(parseISO(project.due_date), "d MMM", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Context menu */}
                  <div className="absolute right-1.5 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                        <span className="text-sm leading-none tracking-widest">···</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {project.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleMarkDone(project)}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Concluir
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleArchive(project)}>
                          <Archive className="w-3.5 h-3.5 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Orphan tasks (no project) */}
        {orphanTasks.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground px-2.5 pb-1 uppercase tracking-wide">
              Sem projeto
            </p>
            <button
              onClick={() => onSelectProject('__none__')}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left',
                selectedProjectId === '__none__'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span className="flex-1 truncate text-muted-foreground">Tarefas avulsas</span>
              <span className={cn(
                'text-xs shrink-0',
                selectedProjectId === '__none__' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {orphanTasks.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Create project dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nome do projeto"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={newPriority} onValueChange={(v) => { if (v) setNewPriority(v as typeof newPriority) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prazo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar projeto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
