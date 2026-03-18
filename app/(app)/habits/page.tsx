import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { HabitTracker } from '@/components/habits/habit-tracker'
import { HabitHeatmap } from '@/components/habits/habit-heatmap'
import { getHabits, getHabitLogs, calculateStreak } from '@/lib/actions/habits'
import { format, subDays } from 'date-fns'

export default async function HabitsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const ninetyDaysAgo = format(subDays(new Date(), 89), 'yyyy-MM-dd')

  const [habitsResult, logsResult] = await Promise.all([
    getHabits(),
    getHabitLogs(ninetyDaysAgo, today),
  ])

  const habits = habitsResult.data
  const allLogs = logsResult.data

  // Today's logs only
  const todayLogs = allLogs.filter((l) => l.date === today)

  // Calculate streaks for all habits in parallel
  const streakEntries = await Promise.all(
    habits.map(async (habit) => {
      const streak = await calculateStreak(habit.id)
      return [habit.id, streak] as [string, number]
    })
  )
  const streaks: Record<string, number> = Object.fromEntries(streakEntries)

  // Pick the habit with the most logs for the heatmap
  const heatmapHabit =
    habits.length > 0
      ? habits.reduce((best, habit) => {
          const count = allLogs.filter((l) => l.habit_id === habit.id && l.done).length
          const bestCount = allLogs.filter((l) => l.habit_id === best.id && l.done).length
          return count >= bestCount ? habit : best
        }, habits[0])
      : null

  const heatmapLogs = heatmapHabit
    ? allLogs.filter((l) => l.habit_id === heatmapHabit.id)
    : []

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Hábitos"
        description="Seus hábitos e rituais diários"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <HabitTracker
            habits={habits}
            todayLogs={todayLogs}
            streaks={streaks}
          />

          {heatmapHabit && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Mapa de Consistência — Últimos 90 dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HabitHeatmap
                    habitTitle={heatmapHabit.title}
                    logs={heatmapLogs}
                    days={90}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
