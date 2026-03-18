'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) return { data: null, error: error.message }
    const profile = data as Record<string, unknown>
    return { data: { ...profile, email: user.email }, error: null }
  } catch {
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function updateProfile(name: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ name })
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function deleteAccount() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }
    await supabase.auth.signOut()
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'Erro inesperado.' }
  }
}
