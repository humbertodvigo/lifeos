import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const reviews = [
  {
    type: 'Revisão Semanal',
    frequency: 'Toda segunda-feira',
    lastDone: '10/03/2026',
    duration: '~20 min',
    sections: [
      'O que funcionou bem esta semana?',
      'O que poderia ter sido melhor?',
      'Quais hábitos mantive?',
      'Intenções para a próxima semana',
    ],
  },
  {
    type: 'Revisão Mensal',
    frequency: 'Primeiro dia do mês',
    lastDone: '01/03/2026',
    duration: '~45 min',
    sections: [
      'Progresso nos OKRs do mês',
      'Finanças: saldo e metas',
      'Saúde: médias do mês',
      'Relacionamentos: quem conectei?',
      'Aprendizados e insights',
    ],
  },
  {
    type: 'Revisão Anual',
    frequency: 'Janeiro de cada ano',
    lastDone: '02/01/2026',
    duration: '~2h',
    sections: [
      'Conquistas do ano',
      'Maiores desafios superados',
      'Avaliação por área de vida',
      'Definição de OKRs para o próximo ano',
      'Palavra do ano',
    ],
  },
]

export default function ReviewsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Revisões"
        description="Reflexões semanais, mensais e anuais"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card key={review.type} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{review.type}</CardTitle>
                  <p className="text-xs text-muted-foreground">{review.frequency}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Última: {review.lastDone}</span>
                    <span>{review.duration}</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seções
                    </p>
                    <ul className="space-y-1">
                      {review.sections.map((section) => (
                        <li key={section} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {section}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full mt-auto" size="sm">
                    Iniciar
                  </Button>

                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
