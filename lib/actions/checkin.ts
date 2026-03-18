'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { DailyCheckin } from '@/types'

interface CheckinData {
  mood: number
  energy: number
  gratitude: string
  intention: string
  highlights?: string
  challenges?: string
}

type ActionResult = { success: boolean; error: string | null }
type CheckinResult = { data: DailyCheckin | null; error: string | null }

export async function saveDailyCheckin(data: CheckinData): Promise<ActionResult> {
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
    const { error } = await (supabase as any)
      .from('daily_checkins')
      .upsert(
        {
          user_id: user.id,
          date: today,
          mood: data.mood,
          energy: data.energy,
          gratitude: data.gratitude,
          intention: data.intention,
          highlights: data.highlights ?? null,
          challenges: data.challenges ?? null,
          done: true,
        },
        {
          onConflict: 'user_id,date',
        }
      )

    if (error) {
      console.error('saveDailyCheckin error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/checkin')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (err) {
    console.error('saveDailyCheckin unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao salvar check-in.' }
  }
}

export async function getTodayCheckin(): Promise<CheckinResult> {
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
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (error) {
      console.error('getTodayCheckin error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('getTodayCheckin unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao buscar check-in.' }
  }
}
