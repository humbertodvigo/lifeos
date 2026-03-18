'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Loader2, Smile, Zap, Heart, Target, Sun, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { getTodayCheckin, saveDailyCheckin } from '@/lib/actions/checkin'
import { DailyCheckin } from '@/types'

function getMoodColor(value: number, selected: boolean): string {
  const base =
    value <= 4
      ? selected
        ? 'bg-red-500 text-white border-red-500'
        : 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
      : value <= 6
      ? selected
        ? 'bg-yellow-500 text-white border-yellow-500'
        : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950'
      : selected
      ? 'bg-green-500 text-white border-green-500'
      : 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950'
  return `w-9 h-9 rounded-md border text-sm font-semibold transition-colors ${base}`
}

function ScoreSelector({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string
  icon: React.ElementType
  value: number | null
  onChange: (n: number) => void
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4" />
        {label}
        <span className="text-muted-foreground font-normal">
          {value !== null ? `— ${value}/10` : '— selecione'}
        </span>
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={getMoodColor(n, value === n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function CheckinDone({ checkin }: { checkin: DailyCheckin }) {
  const moodLabel = (v: number | null) =>
    v === null ? '—' : v <= 4 ? `${v} (baixo)` : v <= 6 ? `${v} (médio)` : `${v} (ótimo)`

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <div>
            <CardTitle>Você já fez seu check-in hoje!</CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Smile className="w-3 h-3" /> Humor
            </p>
            <p className="text-sm font-semibold">{moodLabel(checkin.mood)}</p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" /> Energia
            </p>
            <p className="text-sm font-semibold">{moodLabel(checkin.energy)}</p>
          </div>
        </div>
        <Separator />
        {checkin.gratitude && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="w-3 h-3" /> Gratidão
            </p>
            <p className="text-sm">{checkin.gratitude}</p>
          </div>
        )}
        {checkin.intention && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Intenção do dia
            </p>
            <p className="text-sm">{checkin.intention}</p>
          </div>
        )}
        {checkin.highlights && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sun className="w-3 h-3" /> Destaques
            </p>
            <p className="text-sm">{checkin.highlights}</p>
          </div>
        )}
        {checkin.challenges && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Desafios
            </p>
            <p className="text-sm">{checkin.challenges}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CheckinPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [loading, setLoading] = useState(true)
  const [existingCheckin, setExistingCheckin] = useState<DailyCheckin | null>(null)

  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [gratitude, setGratitude] = useState('')
  const [intention, setIntention] = useState('')
  const [highlights, setHighlights] = useState('')
  const [challenges, setChallenges] = useState('')

  // Determine if it's evening (18h+) to show highlights field
  const isEvening = new Date().getHours() >= 18

  useEffect(() => {
    async function fetchCheckin() {
      setLoading(true)
      const { data } = await getTodayCheckin()
      if (data?.done) {
        setExistingCheckin(data as DailyCheckin)
      }
      setLoading(false)
    }
    fetchCheckin()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mood === null) {
      toast.error('Por favor, selecione seu humor.')
      return
    }
    if (energy === null) {
      toast.error('Por favor, selecione seu nível de energia.')
      return
    }
    if (!gratitude.trim()) {
      toast.error('Por favor, preencha o campo de gratidão.')
      return
    }
    if (!intention.trim()) {
      toast.error('Por favor, preencha a intenção do dia.')
      return
    }

    startTransition(async () => {
      const result = await saveDailyCheckin({
        mood,
        energy,
        gratitude: gratitude.trim(),
        intention: intention.trim(),
        highlights: highlights.trim() || undefined,
        challenges: challenges.trim() || undefined,
      })

      if (result.success) {
        toast.success('Check-in salvo com sucesso!')
        router.push('/dashboard')
      } else {
        toast.error(result.error ?? 'Erro ao salvar check-in.')
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Check-in Diário"
        description="Registre como você está hoje"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : existingCheckin ? (
            <CheckinDone checkin={existingCheckin} />
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Como você está agora?</CardTitle>
                <CardDescription>
                  {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <ScoreSelector
                    label="Humor"
                    icon={Smile}
                    value={mood}
                    onChange={setMood}
                  />

                  <Separator />

                  <ScoreSelector
                    label="Energia"
                    icon={Zap}
                    value={energy}
                    onChange={setEnergy}
                  />

                  <Separator />

                  <div className="space-y-2">
                    <label
                      htmlFor="gratitude"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Heart className="w-4 h-4" />
                      Gratidão
                    </label>
                    <Textarea
                      id="gratitude"
                      value={gratitude}
                      onChange={(e) => setGratitude(e.target.value)}
                      placeholder="Pelo que você é grato hoje?"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="intention"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Target className="w-4 h-4" />
                      Intenção do dia
                    </label>
                    <Textarea
                      id="intention"
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      placeholder="Qual é a sua principal intenção para hoje?"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {isEvening && (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="highlights"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          <Sun className="w-4 h-4" />
                          Destaques do dia
                          <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                        </label>
                        <Textarea
                          id="highlights"
                          value={highlights}
                          onChange={(e) => setHighlights(e.target.value)}
                          placeholder="O que aconteceu de bom hoje?"
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="challenges"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Desafios
                          <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                        </label>
                        <Textarea
                          id="challenges"
                          value={challenges}
                          onChange={(e) => setChallenges(e.target.value)}
                          placeholder="O que foi difícil hoje?"
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar check-in'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
