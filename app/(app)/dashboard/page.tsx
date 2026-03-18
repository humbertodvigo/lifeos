import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckSquare, Heart, DollarSign, Target, TrendingUp, Zap, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LIFE_AREAS, DailyCheckin, Habit, HabitLog, Task } from '@/types'

type AreaScore = {
  id: string
  score: number
  week_of: string
  life_areas: { slug: string; name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  const { data: checkin } = await supabase
    .from('daily_checkins').select('*').eq('user_id', user!.id).eq('date', today).single()
  const { data: tasks } = await supabase
    .from('tasks').select('*').eq('user_id', user!.id).neq('status', 'archived').order('created_at', { ascending: false }).limit(5)
  const { data: habits } = await supabase
    .from('habits').select('*').eq('user_id', user!.id).eq('active', true)
  const { data: habitLogs } = await supabase
    .from('habit_logs').select('*').eq('user_id', user!.id).eq('date', today)
  const { data: areaScoresRaw } = await supabase
    .from('area_scores').select('*, life_areas(*)').eq('user_id', user!.id).gte('week_of', weekStart).order('week_of', { ascending: false })

  const typedCheckin = checkin as DailyCheckin | null
  const typedTasks = (tasks ?? []) as Task[]
  const typedHabits = (habits ?? []) as Habit[]
  const typedHabitLogs = (habitLogs ?? []) as HabitLog[]
  const areaScores = (areaScoresRaw ?? []) as AreaScore[]

  const todayHabitsDone = typedHabitLogs.filter(l => l.done).length
  const totalHabits = typedHabits.length
  const habitProgress = totalHabits > 0 ? Math.round((todayHabitsDone / totalHabits) * 100) : 0

  const todayTasks = typedTasks.filter(t => t.due_date === today)

  const priorityColors: Record<string, string> = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
  }

  const statusLabels: Record<string, string> = {
    todo: 'A fazer',
    in_progress: 'Em progresso',
    done: 'Concluído',
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        description={format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          {/* Check-in Banner */}
          {!typedCheckin?.done && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Check-in diário pendente</p>
                      <p className="text-xs text-muted-foreground">Reserve 3 minutos para registrar seu dia</p>
                    </div>
                  </div>
                  <a href="/checkin" className="text-xs text-primary font-medium hover:underline">
                    Fazer check-in →
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Hábitos hoje</span>
                </div>
                <p className="text-2xl font-bold">{todayHabitsDone}/{totalHabits}</p>
                <Progress value={habitProgress} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Tarefas hoje</span>
                </div>
                <p className="text-2xl font-bold">{todayTasks.length}</p>
                <p className="text-xs text-muted-foreground mt-1">para hoje</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Energia</span>
                </div>
                <p className="text-2xl font-bold">{typedCheckin?.energy ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">{typedCheckin?.energy ? '/10' : 'não registrado'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Humor</span>
                </div>
                <p className="text-2xl font-bold">{typedCheckin?.mood ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">{typedCheckin?.mood ? '/10' : 'não registrado'}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Intenção do dia */}
            {typedCheckin?.intention && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Intenção do dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{typedCheckin.intention}"</p>
                </CardContent>
              </Card>
            )}

            {/* Hábitos do dia */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  Hábitos de hoje
                </CardTitle>
                <CardDescription>{habitProgress}% concluídos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {typedHabits.slice(0, 5).map((habit) => {
                  const done = typedHabitLogs.find(l => l.habit_id === habit.id)?.done
                  return (
                    <div key={habit.id} className="flex items-center justify-between">
                      <span className={`text-sm ${done ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.title}
                      </span>
                      <Badge variant={done ? 'default' : 'outline'} className="text-xs">
                        {done ? '✓' : '○'}
                      </Badge>
                    </div>
                  )
                })}
                {!typedHabits.length && (
                  <p className="text-sm text-muted-foreground">Nenhum hábito cadastrado.</p>
                )}
              </CardContent>
            </Card>

            {/* Tarefas recentes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Tarefas recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {typedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={priorityColors[task.priority] as 'destructive' | 'secondary' | 'outline'} className="text-xs">
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!typedTasks.length && (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>
                )}
              </CardContent>
            </Card>

            {/* Scores por área */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  Score por área de vida
                </CardTitle>
                <CardDescription>Semana atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {LIFE_AREAS.map((area) => {
                  const score = areaScores.find(s => s.life_areas?.slug === area.slug)?.score ?? 0
                  return (
                    <div key={area.slug} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{area.name}</span>
                        <span className="text-xs text-muted-foreground">{score}%</span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>
                  )
                })}
                {!areaScores.length && (
                  <p className="text-sm text-muted-foreground">Nenhum score disponível ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
