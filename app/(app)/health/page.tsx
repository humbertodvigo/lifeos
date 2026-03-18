import { getTodayHealthLog, getHealthLogs, getHealthStats } from '@/lib/actions/health'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HealthForm } from '@/components/health/health-form'
import { HealthChart } from '@/components/health/health-chart'
import { Moon, Dumbbell, Droplets, Smile } from 'lucide-react'

export default async function HealthPage() {
  const [todayResult, logsResult, statsResult] = await Promise.all([
    getTodayHealthLog(),
    getHealthLogs(7),
    getHealthStats(),
  ])

  const today = todayResult.data
  const logs = logsResult.data ?? []
  const stats = statsResult.data

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Saúde & Bem-estar"
        description="Acompanhe sono, exercício, hidratação e humor diariamente."
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Top two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registrar hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <HealthForm initialData={today} />
              </CardContent>
            </Card>

            {/* Right: Weekly averages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Média da semana</CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Moon className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sono médio</p>
                        <p className="text-xl font-semibold">
                          {stats.avg_sleep != null ? `${stats.avg_sleep}h` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Dumbbell className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Exercício médio</p>
                        <p className="text-xl font-semibold">
                          {stats.avg_exercise != null ? `${stats.avg_exercise}min` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Smile className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Humor médio</p>
                        <p className="text-xl font-semibold">
                          {stats.avg_mood != null ? `${stats.avg_mood}/10` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Droplets className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Água média</p>
                        <p className="text-xl font-semibold">
                          {stats.avg_water != null ? `${stats.avg_water}ml` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom: Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos 7 dias — Sono &amp; Humor</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthChart logs={logs} />
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}
