'use client'

import { useMemo } from 'react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HabitLog } from '@/types'

interface HabitHeatmapProps {
  habitTitle: string
  logs: HabitLog[]
  days?: number
}

export function HabitHeatmap({ habitTitle, logs, days = 90 }: HabitHeatmapProps) {
  const { weeks, totalDone } = useMemo(() => {
    const today = new Date()
    const start = subDays(today, days - 1)

    const allDays = eachDayOfInterval({ start, end: today })

    const doneSet = new Set(
      logs.filter((l) => l.done).map((l) => l.date)
    )

    const totalDone = allDays.filter((d) =>
      doneSet.has(format(d, 'yyyy-MM-dd'))
    ).length

    // Pad to start on a Sunday (week boundary)
    const startDow = start.getDay() // 0=Sun
    const paddedDays: (Date | null)[] = [
      ...Array(startDow).fill(null),
      ...allDays,
    ]

    // Split into weeks (columns of 7)
    const weeks: (Date | null)[][] = []
    for (let i = 0; i < paddedDays.length; i += 7) {
      weeks.push(paddedDays.slice(i, i + 7))
    }

    return { weeks, totalDone, doneSet }
  }, [logs, days])

  const doneSet = useMemo(
    () => new Set(logs.filter((l) => l.done).map((l) => l.date)),
    [logs]
  )

  const getCellColor = (date: Date | null): string => {
    if (!date) return 'bg-transparent'
    const key = format(date, 'yyyy-MM-dd')
    if (doneSet.has(key)) return 'bg-green-500 dark:bg-green-400'
    return 'bg-muted'
  }

  const getCellTitle = (date: Date | null): string => {
    if (!date) return ''
    return format(date, "d 'de' MMMM", { locale: ptBR })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate">{habitTitle}</span>
        <span className="text-muted-foreground text-xs shrink-0 ml-2">
          {totalDone} dias nos últimos {days} dias
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ width: 'max-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={getCellTitle(day)}
                  className={`w-[14px] h-[14px] rounded-[2px] transition-colors ${getCellColor(day)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-[3px]">
          <div className="w-[14px] h-[14px] rounded-[2px] bg-muted" />
          <div className="w-[14px] h-[14px] rounded-[2px] bg-green-200 dark:bg-green-900" />
          <div className="w-[14px] h-[14px] rounded-[2px] bg-green-400 dark:bg-green-600" />
          <div className="w-[14px] h-[14px] rounded-[2px] bg-green-500 dark:bg-green-400" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
