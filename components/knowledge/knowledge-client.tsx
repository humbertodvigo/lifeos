'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { NoteDialog } from '@/components/knowledge/note-dialog'
import { BookCard } from '@/components/knowledge/book-card'
import { deleteNote, createBook } from '@/lib/actions/knowledge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, BookOpen } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string | null
  type: string
  tags: string[]
  updated_at: string
}

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

interface KnowledgeClientProps {
  initialNotes: Note[]
  initialBooks: Book[]
}

const TYPE_LABELS: Record<string, string> = {
  note: 'Nota',
  idea: 'Ideia',
  learning: 'Aprendizado',
  reference: 'Referência',
}

const TYPE_COLORS: Record<string, string> = {
  note: 'bg-muted text-muted-foreground',
  idea: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  learning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reference: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const NOTE_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'idea', label: 'Ideias' },
  { value: 'learning', label: 'Aprendizados' },
  { value: 'reference', label: 'Referências' },
]

export function KnowledgeClient({ initialNotes, initialBooks }: KnowledgeClientProps) {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [noteFilter, setNoteFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [addBookOpen, setAddBookOpen] = useState(false)

  const filteredNotes = noteFilter
    ? notes.filter((n) => n.type === noteFilter)
    : notes

  function handleNewNote() {
    setSelectedNote(null)
    setDialogOpen(true)
  }

  function handleEditNote(note: Note) {
    setSelectedNote(note)
    setDialogOpen(true)
  }

  function handleNoteSaved(note: Note) {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = note
        return updated
      }
      return [note, ...prev]
    })
  }

  async function handleDeleteNote(id: string) {
    if (!confirm('Excluir esta nota?')) return
    const result = await deleteNote(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Nota excluída.')
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
  }

  function handleBookUpdated(bookId: string, update: Partial<Book>) {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, ...update } : b))
    )
  }

  function handleBookDeleted(bookId: string) {
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
  }

  function handleBookAdded(book: Book) {
    setBooks((prev) => [...prev, book])
    setAddBookOpen(false)
  }

  const readingBooks = books.filter((b) => b.status === 'reading')
  const wantToReadBooks = books.filter((b) => b.status === 'want_to_read')
  const readBooks = books.filter((b) => b.status === 'read')

  return (
    <div className="flex flex-col h-screen">
      <Header title="Conhecimento" description="Seu segundo cérebro — notas e livros" />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Tabs defaultValue="notes">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="notes">Notas ({notes.length})</TabsTrigger>
                <TabsTrigger value="books">Livros ({books.length})</TabsTrigger>
              </TabsList>
              <Button size="sm" onClick={handleNewNote}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Nota
              </Button>
            </div>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4 mt-0">
              <div className="flex gap-2 flex-wrap">
                {NOTE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setNoteFilter(f.value)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      noteFilter === f.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground hover:bg-accent'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma nota encontrada.{' '}
                  <button
                    onClick={handleNewNote}
                    className="text-primary hover:underline"
                  >
                    Criar primeira nota
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredNotes.map((note) => (
                    <Card
                      key={note.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors group"
                      onClick={() => handleEditNote(note)}
                    >
                      <CardContent className="py-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2 flex-1">{note.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNote(note.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {note.content && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {note.content.slice(0, 100)}
                            {note.content.length > 100 ? '...' : ''}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                          <div className="flex gap-1 flex-wrap">
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                TYPE_COLORS[note.type] ?? TYPE_COLORS.note
                              )}
                            >
                              {TYPE_LABELS[note.type] ?? note.type}
                            </span>
                            {note.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(note.updated_at), 'dd/MM', { locale: ptBR })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Books Tab */}
            <TabsContent value="books" className="space-y-6 mt-0">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setAddBookOpen(true)}>
                  <BookOpen className="w-4 h-4 mr-1" />
                  Novo Livro
                </Button>
              </div>

              <BookSection
                title="Lendo"
                books={readingBooks}
                emptyText="Nenhum livro em leitura."
                onUpdated={handleBookUpdated}
                onDeleted={handleBookDeleted}
              />
              <BookSection
                title="Quero Ler"
                books={wantToReadBooks}
                emptyText="Nenhum livro na lista."
                onUpdated={handleBookUpdated}
                onDeleted={handleBookDeleted}
              />
              <BookSection
                title="Lidos"
                books={readBooks}
                emptyText="Nenhum livro concluído."
                onUpdated={handleBookUpdated}
                onDeleted={handleBookDeleted}
              />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        note={selectedNote}
        onSaved={handleNoteSaved}
      />

      <AddBookDialog
        open={addBookOpen}
        onOpenChange={setAddBookOpen}
        onAdded={handleBookAdded}
      />
    </div>
  )
}

function BookSection({
  title,
  books,
  emptyText,
  onUpdated,
  onDeleted,
}: {
  title: string
  books: Book[]
  emptyText: string
  onUpdated: (id: string, update: Partial<Book>) => void
  onDeleted: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title} ({books.length})
      </h3>
      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onUpdated={(update) => onUpdated(book.id, update)}
              onDeleted={() => onDeleted(book.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AddBookDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (book: Book) => void
}) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('want_to_read')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      return
    }
    setLoading(true)
    try {
      const result = await createBook({ title, author: author || undefined, status })
      if (result.error) throw new Error(result.error)
      toast.success('Livro adicionado!')
      if (result.data) {
        onAdded(result.data as Book)
      }
      setTitle('')
      setAuthor('')
      setStatus('want_to_read')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar livro.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Livro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="book-title">Título</Label>
            <Input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do livro..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="book-author">Autor</Label>
            <Input
              id="book-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do autor..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="book-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="book-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want_to_read">Quero Ler</SelectItem>
                <SelectItem value="reading">Lendo</SelectItem>
                <SelectItem value="read">Lido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
