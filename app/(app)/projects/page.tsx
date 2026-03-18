import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getProjects, getAllTasks } from '@/lib/actions/projects'
import { KanbanBoard } from '@/components/projects/kanban-board'

export default async function ProjectsPage() {
  const [projectsResult, tasksResult] = await Promise.all([
    getProjects(),
    getAllTasks(),
  ])

  const projects = projectsResult.data
  const tasks = tasksResult.data

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Projetos & Tarefas"
        description="Board kanban de projetos e tarefas"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <KanbanBoard tasks={tasks} projects={projects} />
        </div>
      </ScrollArea>
    </div>
  )
}
