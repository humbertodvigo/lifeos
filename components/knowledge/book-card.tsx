'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Trash2 } from 'lucide-react'
import { updateBook, deleteBook } from '@/lib/actions/knowledge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Book {
  id: string
  title: string
  author: string | null
  status: string
  rating: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
}

interface BookCardProps {
  book: Book
  onUpdated?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  reading: 'Lendo',
  want_to_read: 'Quero Ler',
  read: 'Lido',
}

const STATUS_COLORS: Record<string, string> = {
  reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  want_to_read: 'bg-muted text-muted-foreground',
  read: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function BookCard({ book, onUpdated }: BookCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleMarkAsReading() {
    setLoading(true)
    try {
      const result = await updateBook(book.id, {
        status: 'reading',
        started_at: new Date().toISOString().split('T')[0],
      })
      if (result.error) throw new Error(result.error)
      toast.success('Marcado como lendo!')
      onUpdated?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar livro.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead() {
    setLoading(true)
    try {
      const result = await updateBook(book.id, {
        status: 'read',
        finished_at: new Date().toISOString().split('T')[0],
      })
      if (result.error) throw new Error(result.error)
      toast.success('Marcado como lido!')
      onUpdated?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar livro.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetRating(rating: number) {
    setLoading(true)
    try {
      const result = await updateBook(book.id, { rating })
      if (result.error) throw new Error(result.error)
      toast.success('Avaliação salva!')
      onUpdated?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar avaliação.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${book.title}"?`)) return
    setLoading(true)
    try {
      const result = await deleteBook(book.id)
      if (result.error) throw new Error(result.error)
      toast.success('Livro excluído.')
      onUpdated?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir livro.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = STATUS_LABELS[book.status] ?? book.status
  const statusColor = STATUS_COLORS[book.status] ?? STATUS_COLORS.want_to_read

  return (
    <Card className="hover:bg-muted/20 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{book.title}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor)}>
                {statusLabel}
              </span>
            </div>

            {book.author && (
              <p className="text-xs text-muted-foreground">{book.author}</p>
            )}

            {book.finished_at && (
              <p className="text-xs text-muted-foreground">
                Concluído em{' '}
                {format(new Date(book.finished_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}

            {book.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">{book.notes}</p>
            )}

            {/* Star rating for read books */}
            {book.status === 'read' && (
              <div className="flex items-center gap-0.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleSetRating(star)}
                    disabled={loading}
                    className="disabled:opacity-50"
                    title={`${star} estrela${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4 transition-colors',
                        book.rating != null && star <= book.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-400'
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {book.status === 'want_to_read' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAsReading}
                disabled={loading}
                className="text-xs h-7"
              >
                Começar a ler
              </Button>
            )}
            {book.status === 'reading' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAsRead}
                disabled={loading}
                className="text-xs h-7"
              >
                Marcar como lido
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={loading}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
