'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProjectsPanel } from '@/components/projects/projects-panel'
import { KanbanBoard } from '@/components/projects/kanban-board'
import { Project, Task, KanbanStage } from '@/types'

interface ProjectsViewProps {
  initialProjects: (Project & { task_count: number })[]
  initialTasks: Task[]
  initialStages: KanbanStage[]
}

export function ProjectsView({ initialProjects, initialTasks, initialStages }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [stages, setStages] = useState<KanbanStage[]>(initialStages)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  useEffect(() => {
    setProjects(initialProjects)
    setTasks(initialTasks)
    setStages(initialStages)
  }, [initialProjects, initialTasks, initialStages])

  return (
    <>
      <ProjectsPanel
        projects={projects}
        tasks={tasks}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onProjectsChange={setProjects}
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <KanbanBoard
            tasks={tasks}
            projects={projects}
            stages={stages}
            projectFilter={selectedProjectId}
            onTasksChange={setTasks}
            onStagesChange={setStages}
          />
        </div>
      </ScrollArea>
    </>
  )
}
