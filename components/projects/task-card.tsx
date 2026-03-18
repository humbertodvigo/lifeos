'use client'

import { format, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, CheckSquare, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  subtaskCount?: number
  subtaskDone?: number
  onClick: (task: Task) => void
  isUpdating?: boolean
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-400',
  low: 'border-l-gray-300 dark:border-l-gray-600',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
  low: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Alta', medium: 'Média', low: 'Baixa',
}

export function TaskCard({ task, subtaskCount, subtaskDone, onClick, isUpdating }: TaskCardProps) {
  const isOverdue =
    task.due_date && task.status !== 'done' && task.status !== 'archived'
      ? isPast(new Date(task.due_date + 'T23:59:59'))
      : false

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !isUpdating && onClick(task)}
      onKeyDown={(e) => e.key === 'Enter' && !isUpdating && onClick(task)}
      className={cn(
        'rounded-md border-l-2 border border-border bg-background px-3 py-2.5 space-y-2 cursor-pointer',
        'hover:shadow-md hover:border-border/80 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium,
        isUpdating && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Title */}
      <p className={cn(
        'text-sm font-medium leading-snug',
        (task.status === 'done' || task.status === 'archived') && 'line-through text-muted-foreground'
      )}>
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer metadata */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={cn('text-xs px-1.5 py-0 h-5 font-normal', PRIORITY_BADGE[task.priority])}
        >
          {PRIORITY_LABEL[task.priority] ?? task.priority}
        </Badge>

        {task.due_date && (
          <span className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : 'text-muted-foreground'
          )}>
            <CalendarDays className="w-3 h-3" />
            {format(parseISO(task.due_date), 'd MMM', { locale: ptBR })}
          </span>
        )}

        {typeof subtaskCount === 'number' && subtaskCount > 0 && (
          <span className={cn(
            'flex items-center gap-1 text-xs',
            subtaskDone === subtaskCount ? 'text-green-600' : 'text-muted-foreground'
          )}>
            <CheckSquare className="w-3 h-3" />
            {subtaskDone}/{subtaskCount}
          </span>
        )}

        {task.tags && task.tags.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="w-3 h-3" />
            {task.tags.slice(0, 2).join(', ')}
            {task.tags.length > 2 && ` +${task.tags.length - 2}`}
          </span>
        )}
      </div>
    </div>
  )
}
