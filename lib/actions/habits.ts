'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, subDays } from 'date-fns'
import { Habit, HabitLog } from '@/types'

interface CreateHabitData {
  title: string
  frequency: 'daily' | 'weekly' | 'custom'
  area?: string
  target_streak?: number
}

type HabitsResult = { data: Habit[]; error: string | null }
type LogsResult = { data: HabitLog[]; error: string | null }
type ActionResult = { success: boolean; error: string | null }

export async function getHabits(): Promise<HabitsResult> {
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
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('getHabits error:', error)
      return { data: [], error: error.message }
    }

    return { data: (data ?? []) as Habit[], error: null }
  } catch (err) {
    console.error('getHabits unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar hábitos.' }
  }
}

export async function createHabit(data: CreateHabitData): Promise<ActionResult> {
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
    const { error } = await (supabase as any).from('habits').insert({
      user_id: user.id,
      title: data.title,
      frequency: data.frequency ?? 'daily',
      area: data.area ?? null,
      target_streak: data.target_streak ?? 21,
      active: true,
    })

    if (error) {
      console.error('createHabit error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/habits')

    return { success: true, error: null }
  } catch (err) {
    console.error('createHabit unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao criar hábito.' }
  }
}

export async function deleteHabit(id: string): Promise<ActionResult> {
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
      .from('habits')
      .update({ active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteHabit error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/habits')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteHabit unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir hábito.' }
  }
}

export async function toggleHabitLog(
  habitId: string,
  date: string,
  done: boolean
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
      .from('habit_logs')
      .upsert(
        {
          habit_id: habitId,
          user_id: user.id,
          date,
          done,
        },
        {
          onConflict: 'habit_id,date',
        }
      )

    if (error) {
      console.error('toggleHabitLog error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/habits')

    return { success: true, error: null }
  } catch (err) {
    console.error('toggleHabitLog unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao registrar hábito.' }
  }
}

export async function getHabitLogs(
  startDate: string,
  endDate: string
): Promise<LogsResult> {
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
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('getHabitLogs error:', error)
      return { data: [], error: error.message }
    }

    return { data: (data ?? []) as HabitLog[], error: null }
  } catch (err) {
    console.error('getHabitLogs unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar logs de hábitos.' }
  }
}

export async function calculateStreak(habitId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return 0

    // Fetch last 365 days of logs for this habit
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const startDate = format(subDays(new Date(), 365), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('habit_logs')
      .select('date, done')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .eq('done', true)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error || !data) return 0
    if (data.length === 0) return 0

    // Build a set of completed dates
    const doneDates = new Set((data as { date: string; done: boolean }[]).map((log) => log.date))

    let streak = 0
    let cursor = new Date()

    // Start from today; if today is not done, start from yesterday
    const todayStr = format(cursor, 'yyyy-MM-dd')
    if (!doneDates.has(todayStr)) {
      cursor = subDays(cursor, 1)
    }

    // Count consecutive days backwards
    while (true) {
      const dateStr = format(cursor, 'yyyy-MM-dd')
      if (doneDates.has(dateStr)) {
        streak++
        cursor = subDays(cursor, 1)
      } else {
        break
      }
    }

    return streak
  } catch (err) {
    console.error('calculateStreak unexpected error:', err)
    return 0
  }
}
