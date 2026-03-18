import {
  getContacts,
  getContactsDueForReach,
  getUpcomingBirthdays,
} from '@/lib/actions/relationships'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactList } from '@/components/relationships/contact-list'
import { differenceInDays, parseISO } from 'date-fns'
import { AlertTriangle, Cake } from 'lucide-react'

function daysUntilBirthday(birthday: string): number {
  const today = new Date()
  const bday = parseISO(birthday)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1)
  return differenceInDays(thisYear, today)
}

export default async function RelationshipsPage() {
  const [contactsRes, dueRes, birthdaysRes] = await Promise.all([
    getContacts(),
    getContactsDueForReach(),
    getUpcomingBirthdays(30),
  ])

  const contacts = (contactsRes.data ?? []) as Array<{id:string;name:string;relationship:string|null;frequency_days:number|null;notes:string|null;birthday:string|null;last_contact_at:string|null;tags:string[]}>
  const due = (dueRes.data ?? []) as Array<{id:string;name:string;relationship:string|null;frequency_days:number|null;notes:string|null;birthday:string|null;last_contact_at:string|null;tags:string[]}>
  const birthdays = (birthdaysRes.data ?? []) as Array<{id:string;name:string;relationship:string|null;frequency_days:number|null;notes:string|null;birthday:string|null;last_contact_at:string|null;tags:string[]}>

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Relacionamentos"
        description="CRM pessoal — cuide das pessoas que importam"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Alert: overdue contacts */}
          {due.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {due.length} contato{due.length > 1 ? 's' : ''} precisam de atenção
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
                  {due.map((c) => c.name).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Upcoming birthdays */}
          {birthdays.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cake className="h-4 w-4 text-pink-500" />
                  Aniversários nos próximos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {birthdays.map((b) => {
                    const daysLeft = b.birthday ? daysUntilBirthday(b.birthday) : null
                    return (
                      <li
                        key={b.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.birthday
                              ? new Date(b.birthday + 'T00:00:00').toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                })
                              : ''}
                          </p>
                        </div>
                        {daysLeft !== null && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              daysLeft === 0
                                ? 'bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400'
                                : daysLeft <= 7
                                ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                                : daysLeft <= 14
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {daysLeft === 0 ? 'Hoje!' : `em ${daysLeft} dias`}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* All contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Todos os contatos ({contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactList contacts={contacts} />
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}
