import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const okrs = [
  {
    objective: 'Lançar produto SaaS',
    progress: 40,
    keyResults: [
      'MVP publicado em produção — 0%',
      '100 usuários beta — 0%',
      'Receita de R$ 1.000/mês — 0%',
    ],
  },
  {
    objective: 'Melhorar saúde e disposição',
    progress: 65,
    keyResults: [
      'Exercitar 4x/semana por 3 meses — 65%',
      'Peso alvo: 78 kg — 50%',
      'VO2 max acima de 45 — 80%',
    ],
  },
  {
    objective: 'Aprofundar relacionamentos',
    progress: 30,
    keyResults: [
      'Ligar para família 1x/semana — 30%',
      '12 encontros com amigos no ano — 25%',
      'Viagem com cônjuge — 0%',
    ],
  },
]

export default function PlanningPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="OKRs & Visão"
        description="Planejamento estratégico e objetivos"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Minha Missão */}
            <Card>
              <CardHeader>
                <CardTitle>Minha Missão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground italic">
                  "Viver com intencionalidade, construir coisas que importam e nutrir as pessoas ao meu redor."
                </p>
                <Button variant="outline" size="sm">Editar missão</Button>
              </CardContent>
            </Card>

            {/* Valores */}
            <Card>
              <CardHeader>
                <CardTitle>Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {['Família', 'Crescimento', 'Integridade', 'Saúde', 'Criatividade', 'Liberdade'].map((v) => (
                    <li key={v} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      {v}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

          </div>

          {/* OKRs do Ano */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>OKRs do Ano</CardTitle>
              <Button size="sm">Novo objetivo</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {okrs.map((okr) => (
                <div key={okr.objective} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{okr.objective}</h3>
                    <span className="text-xs text-muted-foreground">{okr.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${okr.progress}%` }}
                    />
                  </div>
                  <ul className="space-y-1 pl-4">
                    {okr.keyResults.map((kr) => (
                      <li key={kr} className="text-xs text-muted-foreground list-disc">
                        {kr}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}
