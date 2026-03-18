'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OKR, KeyResult } from '@/types'

export async function getLifeVision() {
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
      .from('life_vision')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('getLifeVision error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('getLifeVision unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao buscar visão de vida.' }
  }
}

export async function saveLifeVision(data: {
  mission?: string
  values?: string[]
}) {
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
      .from('life_vision')
      .upsert(
        {
          user_id: user.id,
          mission: data.mission ?? null,
          values: data.values ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('saveLifeVision error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/planning')

    return { success: true, error: null }
  } catch (err) {
    console.error('saveLifeVision unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao salvar visão de vida.' }
  }
}

export async function getOKRs(year?: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Usuário não autenticado.' }
    }

    const targetYear = year ?? new Date().getFullYear()

    const { data: okrs, error: okrsError } = await (supabase as any)
      .from('okrs')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', targetYear)
      .order('created_at', { ascending: true })

    if (okrsError) {
      console.error('getOKRs error:', okrsError)
      return { data: [], error: okrsError.message }
    }

    if (!okrs || okrs.length === 0) {
      return { data: [], error: null }
    }

    const typedOkrs = (okrs ?? []) as OKR[]
    const okrIds = typedOkrs.map((o) => o.id)

    const { data: keyResults, error: krError } = await (supabase as any)
      .from('key_results')
      .select('*')
      .in('okr_id', okrIds)
      .order('okr_id', { ascending: true })

    if (krError) {
      console.error('getOKRs key_results error:', krError)
      return { data: [], error: krError.message }
    }

    const typedKRs = (keyResults ?? []) as KeyResult[]
    const data = typedOkrs.map((okr) => ({
      ...okr,
      key_results: typedKRs.filter((kr) => kr.okr_id === okr.id),
    }))

    return { data, error: null }
  } catch (err) {
    console.error('getOKRs unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar OKRs.' }
  }
}

export async function createOKR(data: {
  title: string
  period: string
  year: number
  quarter?: number
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

    const { data: okr, error } = await (supabase as any)
      .from('okrs')
      .insert({
        user_id: user.id,
        title: data.title,
        period: data.period,
        year: data.year,
        quarter: data.quarter ?? null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('createOKR error:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/planning')

    return { data: okr, error: null }
  } catch (err) {
    console.error('createOKR unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao criar OKR.' }
  }
}

export async function updateOKR(
  id: string,
  data: Partial<{
    title: string
    period: string
    year: number
    quarter: number | null
    status: string
    shared: boolean
  }>
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
      .from('okrs')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateOKR error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/planning')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateOKR unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar OKR.' }
  }
}

export async function deleteOKR(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' }
    }

    // Delete key results first
    const { error: krError } = await (supabase as any)
      .from('key_results')
      .delete()
      .eq('okr_id', id)

    if (krError) {
      console.error('deleteOKR key_results error:', krError)
      return { success: false, error: krError.message }
    }

    const { error } = await (supabase as any)
      .from('okrs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteOKR error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/planning')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteOKR unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir OKR.' }
  }
}

export async function createKeyResult(data: {
  okr_id: string
  title: string
  target: number
  unit: string
  due_date?: string
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

    const { data: kr, error } = await (supabase as any)
      .from('key_results')
      .insert({
        okr_id: data.okr_id,
        title: data.title,
        target: data.target,
        current: 0,
        unit: data.unit,
        due_date: data.due_date ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('createKeyResult error:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/planning')

    return { data: kr, error: null }
  } catch (err) {
    console.error('createKeyResult unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao criar resultado-chave.' }
  }
}

export async function updateKeyResult(id: string, current: number) {
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
      .from('key_results')
      .update({ current })
      .eq('id', id)

    if (error) {
      console.error('updateKeyResult error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/planning')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateKeyResult unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar resultado-chave.' }
  }
}

export async function deleteKeyResult(id: string) {
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
      .from('key_results')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('deleteKeyResult error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/planning')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteKeyResult unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir resultado-chave.' }
  }
}
