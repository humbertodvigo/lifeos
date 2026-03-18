'use server'

import { createClient } from '@/lib/supabase/server'
import { TimeEntry } from '@/types'

type TimeResult = { data: TimeEntry | null; error: string | null }
type TimeListResult = { data: TimeEntry[]; error: string | null }
type ActionResult = { success: boolean; error: string | null }

export async function getTimeEntries(taskId: string): Promise<TimeListResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: [], error: 'Não autenticado.' }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: (data ?? []) as TimeEntry[], error: null }
  } catch {
    return { data: [], error: 'Erro inesperado.' }
  }
}

export async function startTimer(taskId: string): Promise<TimeResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: 'Não autenticado.' }

    // Stop any currently active timer for this user
    const { data: active } = await supabase
      .from('time_entries')
      .select('id, started_at')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .limit(1)
      .maybeSingle()

    if (active) {
      const dur = Math.floor(
        (Date.now() - new Date((active as { started_at: string }).started_at).getTime()) / 1000
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('time_entries')
        .update({ ended_at: new Date().toISOString(), duration_seconds: dur })
        .eq('id', (active as { id: string }).id)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('time_entries')
      .insert({
        task_id: taskId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as TimeEntry, error: null }
  } catch {
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function stopTimer(entryId: string): Promise<TimeResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: 'Não autenticado.' }

    const { data: entry } = await supabase
      .from('time_entries')
      .select('started_at')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single()

    if (!entry) return { data: null, error: 'Entrada não encontrada.' }

    const endedAt = new Date().toISOString()
    const duration = Math.floor(
      (Date.now() - new Date((entry as { started_at: string }).started_at).getTime()) / 1000
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('time_entries')
      .update({ ended_at: endedAt, duration_seconds: duration })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as TimeEntry, error: null }
  } catch {
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function deleteTimeEntry(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Não autenticado.' }

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}
