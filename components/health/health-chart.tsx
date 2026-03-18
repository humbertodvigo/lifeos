'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface HealthLog {
  date: string
  sleep_hours: number | null
  mood: number | null
}

interface HealthChartProps {
  logs: HealthLog[]
}

export function HealthChart({ logs }: HealthChartProps) {
  const data = logs.map((log) => ({
    day: format(parseISO(log.date), 'EEE', { locale: ptBR }),
    date: log.date,
    Sono: log.sleep_hours,
    Humor: log.mood,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum dado disponível para o período.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="sleep"
          domain={[0, 12]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Sono (h)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }}
        />
        <YAxis
          yAxisId="mood"
          orientation="right"
          domain={[0, 10]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Humor', angle: 90, position: 'insideRight', fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            fontSize: 13,
          }}
          formatter={(value, name) => {
            const label = String(name ?? '')
            if (value === null || value === undefined) return ['—', label]
            if (label === 'Sono') return [`${value}h`, label]
            return [value, label]
          }}
        />
        <Legend />
        <Line
          yAxisId="sleep"
          type="monotone"
          dataKey="Sono"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
          connectNulls={false}
        />
        <Line
          yAxisId="mood"
          type="monotone"
          dataKey="Humor"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 4, fill: '#22c55e' }}
          activeDot={{ r: 6 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
