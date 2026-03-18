'use server'

import { createClient } from '@/lib/supabase/server'
import { KanbanStage } from '@/types'
import { revalidatePath } from 'next/cache'

type StagesResult = { data: KanbanStage[]; error: string | null }
type ActionResult = { success: boolean; error: string | null }
type StageResult = { data: KanbanStage | null; error: string | null }

const DEFAULT_STAGES = [
  { title: 'A Fazer',      slug: 'todo',        position: 0, color: '#64748b', is_terminal: false },
  { title: 'Em Progresso', slug: 'in_progress',  position: 1, color: '#3b82f6', is_terminal: false },
  { title: 'Concluído',    slug: 'done',         position: 2, color: '#22c55e', is_terminal: true  },
  { title: 'Arquivado',    slug: 'archived',     position: 3, color: '#9ca3af', is_terminal: true  },
]

export async function getStages(): Promise<StagesResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: [], error: 'Não autenticado.' }

    const { data: existing, error } = await supabase
      .from('kanban_stages')
      .select('*')
      .eq('user_id', user.id)
      .order('position')

    if (error) return { data: [], error: error.message }

    // Seed defaults on first access
    if (!existing || existing.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('kanban_stages')
        .insert(DEFAULT_STAGES.map((s) => ({ ...s, user_id: user.id })))

      const { data: seeded } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('user_id', user.id)
        .order('position')

      return { data: (seeded ?? []) as KanbanStage[], error: null }
    }

    return { data: existing as KanbanStage[], error: null }
  } catch {
    return { data: [], error: 'Erro inesperado.' }
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export async function createStage(data: {
  title: string
  color: string
  is_terminal: boolean
  position: number
}): Promise<StageResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: 'Não autenticado.' }

    const slug = slugify(data.title) || `stage_${Date.now()}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error } = await (supabase as any)
      .from('kanban_stages')
      .insert({ ...data, slug, user_id: user.id })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/projects')
    return { data: created as KanbanStage, error: null }
  } catch {
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function updateStage(
  id: string,
  data: Partial<Pick<KanbanStage, 'title' | 'color' | 'is_terminal' | 'position'>>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('kanban_stages')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/projects')
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function deleteStage(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Não autenticado.' }

    const { error } = await supabase
      .from('kanban_stages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/projects')
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function reorderStages(orderedIds: string[]): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Não autenticado.' }

    await Promise.all(
      orderedIds.map((stageId, index) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('kanban_stages')
          .update({ position: index })
          .eq('id', stageId)
          .eq('user_id', user.id)
      )
    )

    revalidatePath('/projects')
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}
