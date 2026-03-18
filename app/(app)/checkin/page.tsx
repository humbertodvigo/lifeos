'use client'

import { useState } from 'react'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CheckinPage() {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [gratitude, setGratitude] = useState('')
  const [intention, setIntention] = useState('')

  function handleSave() {
    console.log({ mood, energy, gratitude, intention })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Check-in Diário"
        description="Registre como você está hoje"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Como você está agora?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Mood */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Humor&nbsp;
                  <span className="text-muted-foreground">
                    {mood !== null ? `— ${mood}/10` : '— selecione'}
                  </span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMood(n)}
                      className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors
                        ${mood === n
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-input'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Energia&nbsp;
                  <span className="text-muted-foreground">
                    {energy !== null ? `— ${energy}/10` : '— selecione'}
                  </span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEnergy(n)}
                      className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors
                        ${energy === n
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-input'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gratitude */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="gratitude">
                  Gratidão
                </label>
                <textarea
                  id="gratitude"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="Pelo que você é grato hoje?"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                    placeholder:text-muted-foreground focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Intention */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="intention">
                  Intenção do dia
                </label>
                <textarea
                  id="intention"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="Qual é a sua principal intenção para hoje?"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                    placeholder:text-muted-foreground focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                Salvar check-in
              </Button>

            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
