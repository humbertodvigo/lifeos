'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createReview } from '@/lib/actions/reviews'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  type: 'weekly' | 'monthly' | 'annual'
  onSaved?: () => void
  onCancel?: () => void
}

const LIFE_AREAS = [
  { key: 'health', label: 'Saúde' },
  { key: 'career', label: 'Carreira' },
  { key: 'finances', label: 'Finanças' },
  { key: 'relationships', label: 'Relacionamentos' },
  { key: 'personal_growth', label: 'Desenvolvimento Pessoal' },
  { key: 'leisure', label: 'Lazer' },
  { key: 'spirituality', label: 'Espiritualidade' },
]

function ScoreSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'w-8 h-8 rounded-md text-xs font-medium border transition-colors',
            value === n
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border bg-background text-foreground hover:bg-accent'
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function getPeriodDates(type: 'weekly' | 'monthly' | 'annual') {
  const now = new Date()
  if (type === 'weekly') {
    return {
      start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }
  }
  if (type === 'monthly') {
    return {
      start: format(startOfMonth(now), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd'),
    }
  }
  return {
    start: format(startOfYear(now), 'yyyy-MM-dd'),
    end: format(endOfYear(now), 'yyyy-MM-dd'),
  }
}

export function ReviewForm({ type, onSaved, onCancel }: ReviewFormProps) {
  const [loading, setLoading] = useState(false)

  // Weekly fields
  const [weekAchievements, setWeekAchievements] = useState('')
  const [weekChallenges, setWeekChallenges] = useState('')
  const [weekLearnings, setWeekLearnings] = useState('')
  const [weekPriorities, setWeekPriorities] = useState('')
  const [weekMood, setWeekMood] = useState(7)

  // Monthly fields
  const [monthAchievement, setMonthAchievement] = useState('')
  const [monthUnexpected, setMonthUnexpected] = useState('')
  const [monthFocus, setMonthFocus] = useState('')
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    Object.fromEntries(LIFE_AREAS.map((a) => [a.key, 7]))
  )

  // Annual fields
  const [yearAchievements, setYearAchievements] = useState('')
  const [yearChallenges, setYearChallenges] = useState('')
  const [yearAreaScores, setYearAreaScores] = useState<Record<string, number>>(
    Object.fromEntries(LIFE_AREAS.map((a) => [a.key, 7]))
  )
  const [yearNextFocus, setYearNextFocus] = useState('')
  const [yearWord, setYearWord] = useState('')

  async function handleSave() {
    setLoading(true)

    let content: Record<string, unknown> = {}

    if (type === 'weekly') {
      if (!weekAchievements.trim()) {
        toast.error('Preencha as conquistas da semana.')
        setLoading(false)
        return
      }
      content = {
        achievements: weekAchievements,
        challenges: weekChallenges,
        learnings: weekLearnings,
        priorities: weekPriorities,
        mood: weekMood,
      }
    } else if (type === 'monthly') {
      if (!monthAchievement.trim()) {
        toast.error('Preencha a maior conquista do mês.')
        setLoading(false)
        return
      }
      content = {
        achievement: monthAchievement,
        unexpected: monthUnexpected,
        area_scores: areaScores,
        focus: monthFocus,
      }
    } else {
      if (!yearAchievements.trim()) {
        toast.error('Preencha as conquistas do ano.')
        setLoading(false)
        return
      }
      content = {
        achievements: yearAchievements,
        challenges: yearChallenges,
        area_scores: yearAreaScores,
        next_focus: yearNextFocus,
        word_of_year: yearWord,
      }
    }

    try {
      const { start, end } = getPeriodDates(type)
      const result = await createReview({
        type,
        period_start: start,
        period_end: end,
        content,
      })
      if (result.error) throw new Error(result.error)
      toast.success('Revisão salva com sucesso!')
      onSaved?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar revisão.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const TYPE_TITLES: Record<string, string> = {
    weekly: 'Revisão Semanal',
    monthly: 'Revisão Mensal',
    annual: 'Revisão Anual',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{TYPE_TITLES[type]}</CardTitle>
        <div className="flex gap-2">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Revisão'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {type === 'weekly' && (
          <>
            <FormField
              label="O que você conquistou esta semana?"
              value={weekAchievements}
              onChange={setWeekAchievements}
              placeholder="Liste suas principais conquistas..."
            />
            <FormField
              label="Quais foram os principais desafios?"
              value={weekChallenges}
              onChange={setWeekChallenges}
              placeholder="O que foi difícil ou não saiu como esperado..."
            />
            <FormField
              label="O que você aprendeu?"
              value={weekLearnings}
              onChange={setWeekLearnings}
              placeholder="Aprendizados, insights, descobertas..."
            />
            <FormField
              label="Quais são suas prioridades para a próxima semana?"
              value={weekPriorities}
              onChange={setWeekPriorities}
              placeholder="Foco e intenções para a próxima semana..."
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Como foi sua semana em geral? (1–10)
              </Label>
              <ScoreSelector value={weekMood} onChange={setWeekMood} />
            </div>
          </>
        )}

        {type === 'monthly' && (
          <>
            <FormField
              label="Qual foi a maior conquista do mês?"
              value={monthAchievement}
              onChange={setMonthAchievement}
              placeholder="Sua principal vitória deste mês..."
            />
            <FormField
              label="O que não foi como esperado?"
              value={monthUnexpected}
              onChange={setMonthUnexpected}
              placeholder="Frustrações, desvios de plano, aprendizados difíceis..."
            />
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Como estão suas áreas de vida? (1–10)
              </Label>
              <div className="space-y-3">
                {LIFE_AREAS.map((area) => (
                  <div key={area.key} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {area.label} — {areaScores[area.key]}/10
                    </p>
                    <ScoreSelector
                      value={areaScores[area.key]}
                      onChange={(v) =>
                        setAreaScores((prev) => ({ ...prev, [area.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <FormField
              label="Foco para o próximo mês"
              value={monthFocus}
              onChange={setMonthFocus}
              placeholder="O que você vai priorizar no próximo mês..."
            />
          </>
        )}

        {type === 'annual' && (
          <>
            <FormField
              label="Quais foram suas maiores conquistas do ano?"
              value={yearAchievements}
              onChange={setYearAchievements}
              placeholder="Conquistas que mais te orgulham..."
              rows={5}
            />
            <FormField
              label="Quais foram os maiores desafios superados?"
              value={yearChallenges}
              onChange={setYearChallenges}
              placeholder="Obstáculos, crises e como você os superou..."
            />
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Avaliação por área de vida (1–10)
              </Label>
              <div className="space-y-3">
                {LIFE_AREAS.map((area) => (
                  <div key={area.key} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {area.label} — {yearAreaScores[area.key]}/10
                    </p>
                    <ScoreSelector
                      value={yearAreaScores[area.key]}
                      onChange={(v) =>
                        setYearAreaScores((prev) => ({ ...prev, [area.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <FormField
              label="Foco e intenção para o próximo ano"
              value={yearNextFocus}
              onChange={setYearNextFocus}
              placeholder="Seus principais objetivos e intenções para o próximo ano..."
            />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Palavra do ano</Label>
              <input
                value={yearWord}
                onChange={(e) => setYearWord(e.target.value)}
                placeholder="Uma palavra que resume o próximo ano..."
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-none"
      />
    </div>
  )
}
