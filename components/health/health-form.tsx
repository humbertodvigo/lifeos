'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { saveHealthLog } from '@/lib/actions/health'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HealthLog {
  sleep_hours: number | null
  sleep_quality: number | null
  exercise_min: number | null
  water_ml: number | null
  mood: number | null
  energy: number | null
  notes: string | null
}

interface HealthFormProps {
  initialData?: HealthLog | null
}

export function HealthForm({ initialData }: HealthFormProps) {
  const [loading, setLoading] = useState(false)
  const [sleepHours, setSleepHours] = useState<string>(
    initialData?.sleep_hours != null ? String(initialData.sleep_hours) : ''
  )
  const [sleepQuality, setSleepQuality] = useState<number | null>(
    initialData?.sleep_quality ?? null
  )
  const [exerciseMin, setExerciseMin] = useState<string>(
    initialData?.exercise_min != null ? String(initialData.exercise_min) : ''
  )
  const [waterMl, setWaterMl] = useState<number>(initialData?.water_ml ?? 0)
  const [mood, setMood] = useState<number | null>(initialData?.mood ?? null)
  const [energy, setEnergy] = useState<number | null>(
    typeof initialData?.energy === 'number' ? initialData.energy : null
  )
  const [notes, setNotes] = useState<string>(initialData?.notes ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await saveHealthLog({
        sleep_hours: sleepHours !== '' ? parseFloat(sleepHours) : undefined,
        sleep_quality: sleepQuality ?? undefined,
        exercise_min: exerciseMin !== '' ? parseInt(exerciseMin) : undefined,
        water_ml: waterMl > 0 ? waterMl : undefined,
        mood: mood ?? undefined,
        energy: energy ?? undefined,
        notes: notes.trim() || undefined,
      })

      if (result.success) {
        toast.success('Registro de saúde salvo com sucesso!')
      } else {
        toast.error(result.error ?? 'Erro ao salvar.')
      }
    } catch {
      toast.error('Erro inesperado ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sleep Hours */}
      <div className="space-y-1.5">
        <Label htmlFor="sleep_hours">Horas de sono</Label>
        <Input
          id="sleep_hours"
          type="number"
          min={0}
          max={12}
          step={0.5}
          placeholder="Ex: 7.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
        />
      </div>

      {/* Sleep Quality */}
      <div className="space-y-1.5">
        <Label>Qualidade do sono</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setSleepQuality(sleepQuality === q ? null : q)}
              className={cn(
                'flex-1 py-2 rounded-md border text-sm font-medium transition-colors',
                sleepQuality === q
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background hover:bg-muted border-input'
              )}
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">1 = Muito ruim, 5 = Excelente</p>
      </div>

      {/* Exercise */}
      <div className="space-y-1.5">
        <Label htmlFor="exercise_min">Exercício (minutos)</Label>
        <Input
          id="exercise_min"
          type="number"
          min={0}
          placeholder="Ex: 30"
          value={exerciseMin}
          onChange={(e) => setExerciseMin(e.target.value)}
        />
      </div>

      {/* Water */}
      <div className="space-y-1.5">
        <Label>Água (ml)</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={0}
            step={50}
            placeholder="0"
            value={waterMl || ''}
            onChange={(e) => setWaterMl(parseInt(e.target.value) || 0)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWaterMl((prev) => prev + 250)}
          >
            +250ml
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWaterMl((prev) => prev + 500)}
          >
            +500ml
          </Button>
        </div>
        {waterMl > 0 && (
          <p className="text-xs text-muted-foreground">{waterMl} ml registrados</p>
        )}
      </div>

      {/* Mood */}
      <div className="space-y-1.5">
        <Label>Humor (1–10)</Label>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMood(mood === n ? null : n)}
              className={cn(
                'w-9 h-9 rounded-md border text-sm font-medium transition-colors',
                mood === n
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-background hover:bg-muted border-input'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div className="space-y-1.5">
        <Label>Energia (1–10)</Label>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnergy(energy === n ? null : n)}
              className={cn(
                'w-9 h-9 rounded-md border text-sm font-medium transition-colors',
                energy === n
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-background hover:bg-muted border-input'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Como foi seu dia? Alguma observação?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}
