import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const notes = [
  { title: 'Princípios de design de sistemas', tags: ['tecnologia', 'arquitetura'], updated: '17/03' },
  { title: 'Reflexões sobre produtividade', tags: ['mindset', 'produtividade'], updated: '15/03' },
  { title: 'Notas — Atomic Habits cap. 3', tags: ['livros', 'hábitos'], updated: '12/03' },
  { title: 'Ideias para o produto', tags: ['negócio', 'ideias'], updated: '10/03' },
  { title: 'Resumo da reunião com mentor', tags: ['carreira'], updated: '08/03' },
]

const books = [
  { title: 'Atomic Habits', author: 'James Clear', status: 'Lendo', progress: 68 },
  { title: 'Deep Work', author: 'Cal Newport', status: 'Concluído', progress: 100 },
  { title: 'The Almanack of Naval Ravikant', author: 'Eric Jorgenson', status: 'Lendo', progress: 30 },
  { title: 'Zero to One', author: 'Peter Thiel', status: 'Na fila', progress: 0 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', status: 'Na fila', progress: 0 },
]

const statusColor: Record<string, string> = {
  'Lendo': 'bg-blue-100 text-blue-700',
  'Concluído': 'bg-green-100 text-green-700',
  'Na fila': 'bg-muted text-muted-foreground',
}

export default function KnowledgePage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Conhecimento"
        description="Seu segundo cérebro — notas e livros"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

          <Tabs defaultValue="notes">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="notes">Notas</TabsTrigger>
                <TabsTrigger value="books">Livros</TabsTrigger>
              </TabsList>
              <Button size="sm">Nova nota</Button>
            </div>

            {/* Notas */}
            <TabsContent value="notes" className="space-y-3 mt-0">
              {notes.map((note) => (
                <Card key={note.title} className="cursor-pointer hover:bg-muted/40 transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{note.title}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {note.updated}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Livros */}
            <TabsContent value="books" className="space-y-3 mt-0">
              {books.map((book) => (
                <Card key={book.title}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{book.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[book.status]}`}>
                            {book.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                        {book.progress > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{book.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
