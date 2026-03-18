'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { createNote, updateNote } from '@/lib/actions/knowledge'

interface Note {
  id: string
  title: string
  content: string | null
  type: string
  tags: string[]
  updated_at: string
}

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null
  onSaved?: (note: Note) => void
}

const TYPE_OPTIONS = [
  { value: 'note', label: 'Nota' },
  { value: 'idea', label: 'Ideia' },
  { value: 'learning', label: 'Aprendizado' },
  { value: 'reference', label: 'Referência' },
]

export function NoteDialog({ open, onOpenChange, note, onSaved }: NoteDialogProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('note')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setType(note.type ?? 'note')
      setContent(note.content ?? '')
      setTags(note.tags ?? [])
    } else {
      setTitle('')
      setType('note')
      setContent('')
      setTags([])
    }
    setTagInput('')
  }, [note, open])

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  function addTag() {
    const raw = tagInput.trim().replace(/,/g, '')
    if (raw && !tags.includes(raw)) {
      setTags((prev) => [...prev, raw])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      return
    }

    setLoading(true)
    try {
      const now = new Date().toISOString()
      if (note) {
        const result = await updateNote(note.id, { title, content, type, tags })
        if (result.error) throw new Error(result.error)
        toast.success('Nota atualizada!')
        onSaved?.({ ...note, title, content: content || null, type, tags, updated_at: now })
      } else {
        const result = await createNote({ title, content, type, tags })
        if (result.error) throw new Error(result.error)
        toast.success('Nota criada!')
        if (result.data) {
          onSaved?.(result.data as Note)
        }
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar nota.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{note ? 'Editar Nota' : 'Nova Nota'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Título</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-tags">Tags</Label>
            <Input
              id="note-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder="Digite uma tag e pressione Enter..."
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-content">Conteúdo</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua nota aqui..."
              rows={8}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
