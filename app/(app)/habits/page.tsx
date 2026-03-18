import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const placeholderHabits = [
  { name: 'Meditação', streak: 12, done: true },
  { name: 'Exercício', streak: 5, done: true },
  { name: 'Leitura 30 min', streak: 3, done: false },
  { name: 'Diário', streak: 20, done: true },
  { name: 'Sem álcool', streak: 8, done: true },
]

export default function HabitsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Hábitos"
        description="Seus hábitos e rituais diários"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          <div className="flex justify-end">
            <Button>Novo hábito</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Hábitos Ativos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Hábitos Ativos
                  <span className="text-sm font-normal text-muted-foreground">
                    {placeholderHabits.filter((h) => h.done).length}/{placeholderHabits.length} hoje
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {placeholderHabits.map((habit) => (
                    <li
                      key={habit.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            habit.done
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                          }`}
                        />
                        <span className={`text-sm ${habit.done ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">🔥 {habit.streak} dias</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Streak Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Streak Tracker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Acompanhe sua consistência ao longo do mês.
                </p>
                {placeholderHabits.map((habit) => (
                  <div key={habit.name} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{habit.name}</span>
                      <span>{habit.streak} dias consecutivos</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 18 }, (_, i) => (
                        <span
                          key={i}
                          className={`w-4 h-4 rounded-sm ${
                            i < habit.streak % 18
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
