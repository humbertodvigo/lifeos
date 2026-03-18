'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO, differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createContact, logContact, deleteContact, updateContact, getContactLogs } from '@/lib/actions/relationships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { UserPlus, MessageCircle, Trash2, Clock, Pencil, History, Loader2, X } from 'lucide-react'

interface Contact {
  id: string
  name: string
  relationship: string | null
  frequency_days: number | null
  notes: string | null
  birthday: string | null
  last_contact_at: string | null
  tags: string[]
}

interface ContactLog {
  id: string
  contact_id: string
  date: string
  medium: string | null
  summary: string | null
}

interface ContactListProps {
  contacts: Contact[]
}

function getContactStatus(contact: Contact): 'overdue' | 'due-soon' | 'ok' {
  if (!contact.frequency_days) return 'ok'
  if (!contact.last_contact_at) return 'overdue'
  const daysSince = differenceInDays(new Date(), parseISO(contact.last_contact_at))
  if (daysSince >= contact.frequency_days) return 'overdue'
  if (daysSince >= contact.frequency_days * 0.8) return 'due-soon'
  return 'ok'
}

const MEDIUM_LABELS: Record<string, string> = {
  mensagem: 'Mensagem',
  ligacao: 'Ligação',
  pessoalmente: 'Pessoalmente',
  email: 'Email',
}

function LogContactDialog({ contact, onLogged }: { contact: Contact; onLogged: (contactId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [medium, setMedium] = useState('')
  const [summary, setSummary] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await logContact(contact.id, { medium: medium || null, summary: summary.trim() || null })
      if (result.success) {
        toast.success(`Contato com ${contact.name} registrado!`)
        setOpen(false)
        setMedium('')
        setSummary('')
        onLogged(contact.id)
      } else {
        toast.error(result.error ?? 'Erro ao registrar contato.')
      }
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <MessageCircle className="h-3 w-3 mr-1" />
          Registrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar contato — {contact.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Meio</Label>
            <Select value={medium} onValueChange={setMedium}>
              <SelectTrigger><SelectValue placeholder="Como foi o contato?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensagem">Mensagem</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
                <SelectItem value="pessoalmente">Pessoalmente</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary">Resumo (opcional)</Label>
            <Textarea
              id="summary"
              placeholder="O que conversaram?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContactHistoryDialog({ contact }: { contact: Contact }) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<ContactLog[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const result = await getContactLogs(contact.id)
    if (result.data) setLogs(result.data as ContactLog[])
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) load() }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <History className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Histórico — {contact.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum contato registrado ainda.
            </p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border px-3 py-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {format(parseISO(log.date), "d 'de' MMM yyyy", { locale: ptBR })}
                </span>
                {log.medium && (
                  <Badge variant="secondary" className="text-xs">
                    {MEDIUM_LABELS[log.medium] ?? log.medium}
                  </Badge>
                )}
              </div>
              {log.summary && (
                <p className="text-sm leading-relaxed">{log.summary}</p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditContactDialog({ contact, onSaved }: { contact: Contact; onSaved: (updated: Contact) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [frequencyDays, setFrequencyDays] = useState('')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setName(contact.name)
      setRelationship(contact.relationship ?? '')
      setFrequencyDays(contact.frequency_days ? String(contact.frequency_days) : '')
      setBirthday(contact.birthday ?? '')
      setNotes(contact.notes ?? '')
    }
  }, [open, contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Informe o nome.'); return }
    setLoading(true)
    try {
      const result = await updateContact(contact.id, {
        name: name.trim(),
        relationship: relationship.trim() || null,
        frequency_days: frequencyDays ? parseInt(frequencyDays) : null,
        birthday: birthday || null,
        notes: notes.trim() || null,
      })
      if (result.success) {
        toast.success('Contato atualizado!')
        onSaved({
          ...contact,
          name: name.trim(),
          relationship: relationship.trim() || null,
          frequency_days: frequencyDays ? parseInt(frequencyDays) : null,
          birthday: birthday || null,
          notes: notes.trim() || null,
        })
        setOpen(false)
      } else {
        toast.error(result.error ?? 'Erro ao atualizar.')
      }
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="e-name">Nome *</Label>
            <Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-rel">Relacionamento</Label>
            <Input id="e-rel" placeholder="Ex: Amigo, Família, Mentor" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-freq">Frequência de contato (dias)</Label>
            <Input id="e-freq" type="number" min={1} placeholder="Ex: 14" value={frequencyDays} onChange={(e) => setFrequencyDays(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-bday">Aniversário</Label>
            <Input id="e-bday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-notes">Notas</Label>
            <Textarea id="e-notes" placeholder="Informações relevantes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NewContactDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [frequencyDays, setFrequencyDays] = useState('')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Informe o nome do contato.'); return }
    setLoading(true)
    try {
      const result = await createContact({
        name: name.trim(),
        relationship: relationship.trim() || null,
        frequency_days: frequencyDays ? parseInt(frequencyDays) : null,
        birthday: birthday || null,
        notes: notes.trim() || null,
      })
      if (result.success) {
        toast.success('Contato criado com sucesso!')
        setOpen(false)
        setName(''); setRelationship(''); setFrequencyDays(''); setBirthday(''); setNotes('')
        onCreated()
      } else {
        toast.error(result.error ?? 'Erro ao criar contato.')
      }
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Novo Contato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nome *</Label>
            <Input id="c-name" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-rel">Relacionamento</Label>
            <Input id="c-rel" placeholder="Ex: Amigo, Família, Mentor" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-freq">Frequência de contato (dias)</Label>
            <Input id="c-freq" type="number" min={1} placeholder="Ex: 14 (a cada 2 semanas)" value={frequencyDays} onChange={(e) => setFrequencyDays(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-bday">Aniversário</Label>
            <Input id="c-bday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-notes">Notas</Label>
            <Textarea id="c-notes" placeholder="Informações relevantes sobre este contato" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar contato'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ContactList({ contacts: initialContacts }: ContactListProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setContacts((prev) => prev.filter((c) => c.id !== id))
    try {
      const result = await deleteContact(id)
      if (result.success) {
        toast.success('Contato excluído.')
      } else {
        setContacts(initialContacts)
        toast.error(result.error ?? 'Erro ao excluir.')
      }
    } catch {
      setContacts(initialContacts)
      toast.error('Erro inesperado.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleLogged(contactId: string) {
    const today = format(new Date(), 'yyyy-MM-dd')
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, last_contact_at: today } : c))
    )
  }

  function handleEdited(updated: Contact) {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  function handleCreated() {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewContactDialog onCreated={handleCreated} />
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">Nenhum contato cadastrado ainda.</p>
          <p className="text-xs mt-1">Adicione pessoas importantes da sua vida.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => {
            const status = getContactStatus(contact)
            return (
              <li
                key={contact.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors',
                  status === 'overdue' && 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
                  status === 'due-soon' && 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20',
                  status === 'ok' && 'hover:bg-muted/30'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{contact.name}</p>
                    {contact.relationship && (
                      <Badge variant="secondary" className="text-xs">{contact.relationship}</Badge>
                    )}
                    {status === 'overdue' && (
                      <Badge variant="destructive" className="text-xs">Atrasado</Badge>
                    )}
                    {status === 'due-soon' && (
                      <Badge className="text-xs bg-yellow-500 text-white">Em breve</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {contact.last_contact_at
                        ? `Último contato ${formatDistanceToNow(parseISO(contact.last_contact_at), { locale: ptBR, addSuffix: true })}`
                        : 'Sem contato registrado'}
                    </p>
                    {contact.frequency_days && (
                      <span className="text-xs text-muted-foreground">· a cada {contact.frequency_days} dias</span>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate italic">{contact.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <LogContactDialog contact={contact} onLogged={handleLogged} />
                  <ContactHistoryDialog contact={contact} />
                  <EditContactDialog contact={contact} onSaved={handleEdited} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(contact.id)}
                    disabled={deletingId === contact.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
