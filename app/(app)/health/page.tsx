import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const weekSummary = [
  { day: 'Seg', sleep: 7.5, exercise: true, water: 8, mood: 7 },
  { day: 'Ter', sleep: 6.0, exercise: false, water: 6, mood: 5 },
  { day: 'Qua', sleep: 8.0, exercise: true, water: 9, mood: 9 },
  { day: 'Qui', sleep: 7.0, exercise: true, water: 7, mood: 8 },
  { day: 'Sex', sleep: 6.5, exercise: false, water: 5, mood: 6 },
  { day: 'Sáb', sleep: 9.0, exercise: true, water: 10, mood: 9 },
  { day: 'Dom', sleep: 8.5, exercise: false, water: 8, mood: 8 },
]

export default function HealthPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Saúde & Bem-estar"
        description="Acompanhe sua saúde e energia"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Registro de Hoje */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registro de Hoje</CardTitle>
              <Button size="sm">Salvar</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sono</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">7,5</span>
                    <span className="text-sm text-muted-foreground mb-0.5">h</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Meta: 8h</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Exercício</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">45</span>
                    <span className="text-sm text-muted-foreground mb-0.5">min</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Musculação</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Água</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">6</span>
                    <span className="text-sm text-muted-foreground mb-0.5">/ 8 copos</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span
                        key={i}
                        className={`w-4 h-4 rounded-sm ${i < 6 ? 'bg-blue-400' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Humor</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">8</span>
                    <span className="text-sm text-muted-foreground mb-0.5">/ 10</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ótimo</p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Resumo da Semana */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left py-2 pr-4">Dia</th>
                      <th className="text-center py-2 px-3">Sono</th>
                      <th className="text-center py-2 px-3">Exercício</th>
                      <th className="text-center py-2 px-3">Água</th>
                      <th className="text-center py-2 px-3">Humor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekSummary.map((row) => (
                      <tr key={row.day} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{row.day}</td>
                        <td className="text-center py-2 px-3 text-muted-foreground">{row.sleep}h</td>
                        <td className="text-center py-2 px-3">
                          <span className={row.exercise ? 'text-green-500' : 'text-muted-foreground'}>
                            {row.exercise ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="text-center py-2 px-3 text-muted-foreground">{row.water} copos</td>
                        <td className="text-center py-2 px-3 text-muted-foreground">{row.mood}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}
