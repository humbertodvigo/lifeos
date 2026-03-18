import { Header } from '@/components/shared/header'
import { getProjects, getAllTasks } from '@/lib/actions/projects'
import { getStages } from '@/lib/actions/kanban-stages'
import { ProjectsView } from '@/components/projects/projects-view'

export const metadata = { title: 'Projetos & Tarefas' }

export default async function ProjectsPage() {
  const [projectsResult, tasksResult, stagesResult] = await Promise.all([
    getProjects(),
    getAllTasks(),
    getStages(),
  ])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Projetos & Tarefas"
        description="Gerencie projetos e acompanhe tarefas no kanban"
      />
      <div className="flex-1 flex overflow-hidden">
        <ProjectsView
          initialProjects={projectsResult.data}
          initialTasks={tasksResult.data}
          initialStages={stagesResult.data}
        />
      </div>
    </div>
  )
}
