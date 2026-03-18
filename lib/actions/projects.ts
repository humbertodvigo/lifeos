'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Project, Task, Subtask } from '@/types'

interface CreateProjectData {
  title: string
  description?: string
  area?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}

interface CreateTaskData {
  title: string
  project_id?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  tags?: string[]
}

type SubtasksResult = { data: Subtask[]; error: string | null }
type ProjectsResult = { data: (Project & { task_count: number })[]; error: string | null }
type TasksResult = { data: Task[]; error: string | null }
type ActionResult = { success: boolean; error: string | null }

export async function getProjects(): Promise<ProjectsResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Usuário não autenticado.' }
    }

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('getProjects error:', projectsError)
      return { data: [], error: projectsError.message }
    }

    const typedProjects = (projects ?? []) as Project[]

    if (typedProjects.length === 0) {
      return { data: [], error: null }
    }

    // Get task counts for each project
    const projectIds = typedProjects.map((p) => p.id)

    const { data: taskCounts, error: countError } = await supabase
      .from('tasks')
      .select('project_id')
      .in('project_id', projectIds)

    const countMap: Record<string, number> = {}
    if (!countError && taskCounts) {
      for (const t of taskCounts as { project_id: string | null }[]) {
        if (t.project_id) {
          countMap[t.project_id] = (countMap[t.project_id] ?? 0) + 1
        }
      }
    }

    const projectsWithCount = typedProjects.map((p) => ({
      ...p,
      task_count: countMap[p.id] ?? 0,
    }))

    return { data: projectsWithCount, error: null }
  } catch (err) {
    console.error('getProjects unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar projetos.' }
  }
}

export async function createProject(data: CreateProjectData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('projects').insert({
      user_id: user.id,
      title: data.title,
      description: data.description ?? null,
      area: data.area ?? null,
      priority: data.priority ?? 'medium',
      due_date: data.due_date ?? null,
      status: 'active',
    })

    if (error) {
      console.error('createProject error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('createProject unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao criar projeto.' }
  }
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // Remove read-only fields before update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, user_id: _uid, created_at: _cat, ...updateData } = data as Record<string, unknown>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateProject error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateProject unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar projeto.' }
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteProject error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteProject unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir projeto.' }
  }
}

export async function getTasks(projectId?: string): Promise<TasksResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Usuário não autenticado.' }
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('getTasks error:', error)
      return { data: [], error: error.message }
    }

    return { data: (data ?? []) as Task[], error: null }
  } catch (err) {
    console.error('getTasks unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar tarefas.' }
  }
}

export async function getAllTasks(): Promise<TasksResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Usuário não autenticado.' }
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getAllTasks error:', error)
      return { data: [], error: error.message }
    }

    return { data: (data ?? []) as Task[], error: null }
  } catch (err) {
    console.error('getAllTasks unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar tarefas.' }
  }
}

export async function createTask(data: CreateTaskData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('tasks').insert({
      user_id: user.id,
      title: data.title,
      project_id: data.project_id ?? null,
      priority: data.priority ?? 'medium',
      due_date: data.due_date ?? null,
      tags: data.tags ?? [],
      status: 'todo',
    })

    if (error) {
      console.error('createTask error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('createTask unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao criar tarefa.' }
  }
}

export async function updateTask(
  id: string,
  data: Partial<Task>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // Remove read-only fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, user_id: _uid, created_at: _cat, ...updateData } = data as Record<string, unknown>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateTask error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateTask unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar tarefa.' }
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteTask error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteTask unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir tarefa.' }
  }
}

export async function updateTaskStatus(
  id: string,
  status: 'todo' | 'in_progress' | 'done' | 'archived'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateTaskStatus error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateTaskStatus unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar status.' }
  }
}

export async function getSubtasks(taskId: string): Promise<SubtasksResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: [], error: 'Usuário não autenticado.' }
    // user check is for auth gate — subtasks table has no user_id column (scoped by task_id → user ownership)
    void user

    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)

    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as Subtask[], error: null }
  } catch {
    return { data: [], error: 'Erro inesperado.' }
  }
}

export async function createSubtask(taskId: string, title: string): Promise<{ data: Subtask | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('subtasks')
      .insert({ task_id: taskId, title, done: false })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as Subtask, error: null }
  } catch {
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function toggleSubtask(id: string, done: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('subtasks')
      .update({ done })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function deleteSubtask(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}
