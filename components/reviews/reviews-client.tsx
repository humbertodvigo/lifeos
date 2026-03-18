'use client'

import { useState } from 'react'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReviewForm } from '@/components/reviews/review-form'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock } from 'lucide-react'

type ReviewType = 'weekly' | 'monthly' | 'annual'

interface LastReview {
  id: string
  created_at: string
  type: string
}

interface ReviewsClientProps {
  lastWeekly: LastReview | null
  lastMonthly: LastReview | null
  lastAnnual: LastReview | null
}

const REVIEW_CARDS = [
  {
    type: 'weekly' as ReviewType,
    title: 'Revisão Semanal',
    description: 'Reflita sobre a semana que passou',
    frequency: 'Toda semana',
    duration: '~20 min',
  },
  {
    type: 'monthly' as ReviewType,
    title: 'Revisão Mensal',
    description: 'Avalie o mês e planeje o próximo',
    frequency: 'Todo mês',
    duration: '~45 min',
  },
  {
    type: 'annual' as ReviewType,
    title: 'Revisão Anual',
    description: 'Celebre conquistas e defina visão para o ano',
    frequency: 'Todo ano',
    duration: '~2h',
  },
]

function getLastReview(type: ReviewType, props: ReviewsClientProps): LastReview | null {
  if (type === 'weekly') return props.lastWeekly
  if (type === 'monthly') return props.lastMonthly
  return props.lastAnnual
}

export function ReviewsClient({ lastWeekly, lastMonthly, lastAnnual }: ReviewsClientProps) {
  const [activeReview, setActiveReview] = useState<ReviewType | null>(null)

  function handleSaved() {
    setActiveReview(null)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="Revisões" description="Reflexões semanais, mensais e anuais" />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Review cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REVIEW_CARDS.map((card) => {
              const last = getLastReview(card.type, { lastWeekly, lastMonthly, lastAnnual })
              const isActive = activeReview === card.type

              return (
                <Card
                  key={card.type}
                  className={isActive ? 'border-primary' : undefined}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{card.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>
                          {last
                            ? `Última: ${formatDistanceToNow(new Date(last.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}`
                            : 'Nunca realizada'}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      variant={isActive ? 'secondary' : 'default'}
                      onClick={() =>
                        setActiveReview(isActive ? null : card.type)
                      }
                    >
                      {isActive ? 'Fechar' : 'Iniciar'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Active review form */}
          {activeReview && (
            <ReviewForm
              type={activeReview}
              onSaved={handleSaved}
              onCancel={() => setActiveReview(null)}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
