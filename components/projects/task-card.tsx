'use client'

import { format, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, MoreHorizontal, ArrowRight, CheckCheck, Archive, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onStatusChange: (id: string, status: Task['status']) => void
  onDelete: (id: string) => void
  isUpdating?: boolean
}

const priorityConfig: Record<
  string,
  { label: string; className: string }
> = {
  high: {
    label: 'Alta',
    className:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  },
  medium: {
    label: 'Média',
    className:
      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
  },
  low: {
    label: 'Baixa',
    className:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
  },
}

const nextStatusMap: Record<
  Task['status'],
  { status: Task['status']; label: string } | null
> = {
  todo: { status: 'in_progress', label: 'Mover para Em Progresso' },
  in_progress: { status: 'done', label: 'Mover para Concluído' },
  done: { status: 'archived', label: 'Arquivar' },
  archived: null,
}

export function TaskCard({ task, onStatusChange, onDelete, isUpdating }: TaskCardProps) {
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium
  const next = nextStatusMap[task.status]
  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    task.status !== 'archived'
      ? isPast(parseISO(task.due_date))
      : false

  return (
    <div
      className={`rounded-md border bg-background px-3 py-2.5 space-y-2 transition-opacity ${
        isUpdating ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug flex-1 min-w-0">
          {task.title}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="inline-flex items-center justify-center h-6 w-6 shrink-0 -mr-1 -mt-0.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Ações"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            {next && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, next.status)}>
                <ArrowRight className="w-3.5 h-3.5 mr-2" />
                {next.label}
              </DropdownMenuItem>
            )}
            {task.status !== 'done' && task.status !== 'archived' && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
                <CheckCheck className="w-3.5 h-3.5 mr-2" />
                Marcar como Concluído
              </DropdownMenuItem>
            )}
            {task.status !== 'archived' && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, 'archived')}>
                <Archive className="w-3.5 h-3.5 mr-2" />
                Arquivar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={`text-xs px-1.5 py-0 h-5 font-normal ${priority.className}`}
        >
          {priority.label}
        </Badge>

        {task.due_date && (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue
                ? 'text-red-500 dark:text-red-400'
                : 'text-muted-foreground'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            {format(parseISO(task.due_date), 'd MMM', { locale: ptBR })}
          </span>
        )}

        {task.tags && task.tags.length > 0 && (
          <span className="text-xs text-muted-foreground truncate">
            {task.tags.slice(0, 2).join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}
