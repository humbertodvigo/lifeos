'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getReviews(type?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Usuário não autenticado.' }
    }

    let query = supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('getReviews error:', error)
      return { data: [], error: error.message }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error('getReviews unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar revisões.' }
  }
}

export async function createReview(data: {
  type: string
  period_start: string
  period_end: string
  content: Record<string, unknown>
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Usuário não autenticado.' }
    }

    const { data: review, error } = await (supabase as any)
      .from('reviews')
      .insert({
        user_id: user.id,
        type: data.type,
        period_start: data.period_start,
        period_end: data.period_end,
        content: data.content,
      })
      .select()
      .single()

    if (error) {
      console.error('createReview error:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/reviews')

    return { data: review, error: null }
  } catch (err) {
    console.error('createReview unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao criar revisão.' }
  }
}

export async function updateReview(
  id: string,
  content: Record<string, unknown>
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    const { error } = await (supabase as any)
      .from('reviews')
      .update({ content })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateReview error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/reviews')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateReview unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar revisão.' }
  }
}

export async function getLastReview(type: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Usuário não autenticado.' }
    }

    const { data, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('getLastReview error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('getLastReview unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao buscar última revisão.' }
  }
}
