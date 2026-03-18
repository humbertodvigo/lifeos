import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const columns = [
  {
    name: 'A Fazer',
    count: 4,
    items: [
      'Redesign do portfólio',
      'Estudar TypeScript avançado',
      'Planejar viagem de férias',
      'Organizar arquivo digital',
    ],
  },
  {
    name: 'Em Progresso',
    count: 3,
    items: [
      'LifeOS — módulo finanças',
      'Curso de Next.js 14',
      'Livro: Atomic Habits',
    ],
  },
  {
    name: 'Concluído',
    count: 5,
    items: [
      'Setup do ambiente de dev',
      'Layout principal do app',
      'Autenticação com Clerk',
      'Sidebar de navegação',
      'Tema dark/light',
    ],
  },
  {
    name: 'Arquivado',
    count: 2,
    items: [
      'Ideia: app de receitas',
      'Protótipo descartado v1',
    ],
  },
]

export default function ProjectsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Projetos & Tarefas"
        description="Board kanban de projetos e tarefas"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">

          <div className="flex justify-end">
            <Button>Nova tarefa</Button>
          </div>

          <div className="grid grid-cols-4 gap-4 min-w-[800px]">
            {columns.map((col) => (
              <Card key={col.name} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    {col.name}
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-bold">
                      {col.count}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {col.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-md border bg-background px-3 py-2 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                  <button className="w-full rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors">
                    + Adicionar tarefa
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
