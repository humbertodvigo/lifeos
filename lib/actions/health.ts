'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, subDays } from 'date-fns'

export async function getTodayHealthLog() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Usuário não autenticado.' }
    }

    const today = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (error) {
      console.error('getTodayHealthLog error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('getTodayHealthLog unexpected error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function getHealthLogs(days: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Usuário não autenticado.' }
    }

    const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('getHealthLogs error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('getHealthLogs unexpected error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function saveHealthLog(data: {
  sleep_hours?: number
  sleep_quality?: number
  exercise_min?: number
  water_ml?: number
  mood?: number
  energy?: number
  notes?: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    const today = format(new Date(), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('health_logs').upsert(
      {
        user_id: user.id,
        date: today,
        sleep_hours: data.sleep_hours ?? null,
        sleep_quality: data.sleep_quality ?? null,
        exercise_min: data.exercise_min ?? null,
        water_ml: data.water_ml ?? null,
        mood: data.mood ?? null,
        energy: data.energy ?? null,
        notes: data.notes ?? null,
      },
      { onConflict: 'user_id,date' }
    )

    if (error) {
      console.error('saveHealthLog error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/health')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (err) {
    console.error('saveHealthLog unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao salvar.' }
  }
}

export async function getHealthStats() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Usuário não autenticado.' }
    }

    const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase as any)
      .from('health_logs')
      .select('sleep_hours, exercise_min, mood, water_ml')
      .eq('user_id', user.id)
      .gte('date', startDate)

    if (error) {
      console.error('getHealthStats error:', error)
      return { data: null, error: error.message }
    }

    type StatRow = { sleep_hours: number | null; exercise_min: number | null; mood: number | null; water_ml: number | null }
    const logs = (rawData ?? []) as StatRow[]
    const count = logs.length || 1

    const avg = (field: keyof StatRow) => {
      const vals = logs.map((l) => l[field]).filter((v): v is number => v !== null && typeof v === 'number')
      if (vals.length === 0) return null
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    }

    return {
      data: {
        avg_sleep: avg('sleep_hours'),
        avg_exercise: avg('exercise_min'),
        avg_mood: avg('mood'),
        avg_water: avg('water_ml'),
        count,
      },
      error: null,
    }
  } catch (err) {
    console.error('getHealthStats unexpected error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}
