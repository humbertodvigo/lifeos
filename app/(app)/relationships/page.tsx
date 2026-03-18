import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const contacts = [
  { name: 'Ana Lima', relation: 'Cônjuge', lastContact: 'Hoje', priority: 'alta' },
  { name: 'Carlos Mendes', relation: 'Pai', lastContact: '3 dias', priority: 'alta' },
  { name: 'Fernanda Costa', relation: 'Amiga próxima', lastContact: '1 semana', priority: 'média' },
  { name: 'Rafael Souza', relation: 'Mentor', lastContact: '2 semanas', priority: 'média' },
  { name: 'Julia Alves', relation: 'Colega de trabalho', lastContact: '1 mês', priority: 'baixa' },
]

const birthdays = [
  { name: 'Carlos Mendes', date: '22/03', daysLeft: 4 },
  { name: 'Fernanda Costa', date: '05/04', daysLeft: 18 },
  { name: 'Marcos Lima', date: '12/04', daysLeft: 25 },
  { name: 'Beatriz Rocha', date: '01/05', daysLeft: 44 },
]

const priorityColor: Record<string, string> = {
  alta: 'bg-red-500',
  média: 'bg-yellow-500',
  baixa: 'bg-green-500',
}

export default function RelationshipsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Relacionamentos"
        description="CRM pessoal — pessoas que importam"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          <div className="flex justify-end">
            <Button>Novo contato</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Contatos Importantes */}
            <Card>
              <CardHeader>
                <CardTitle>Contatos Importantes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {contacts.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor[c.priority]}`} />
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.relation}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Último contato</p>
                        <p className="text-xs font-medium">{c.lastContact}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Próximos Aniversários */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Aniversários</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {birthdays.map((b) => (
                    <li
                      key={b.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.date}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          b.daysLeft <= 7
                            ? 'bg-red-100 text-red-600'
                            : b.daysLeft <= 30
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {b.daysLeft === 0 ? 'Hoje!' : `em ${b.daysLeft} dias`}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
