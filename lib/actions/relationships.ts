'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, addDays, parseISO, differenceInDays } from 'date-fns'
import { Database } from '@/types/database'

type Contact = Database['public']['Tables']['contacts']['Row']

export async function getContacts() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('last_contact_at', { ascending: true, nullsFirst: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    console.error('getContacts error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function createContact(data: {
  name: string
  relationship?: string | null
  frequency_days?: number | null
  notes?: string | null
  birthday?: string | null
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    const { error } = await (supabase as any).from('contacts').insert({
      user_id: user.id,
      name: data.name,
      relationship: data.relationship ?? null,
      frequency_days: data.frequency_days ?? null,
      notes: data.notes ?? null,
      birthday: data.birthday ?? null,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/relationships')
    return { success: true, error: null }
  } catch (err) {
    console.error('createContact error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function updateContact(id: string, data: Partial<Contact>) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    const { error } = await (supabase as any)
      .from('contacts')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/relationships')
    return { success: true, error: null }
  } catch (err) {
    console.error('updateContact error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function deleteContact(id: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    const { error } = await (supabase as any)
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/relationships')
    return { success: true, error: null }
  } catch (err) {
    console.error('deleteContact error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function logContact(
  contact_id: string,
  data: { medium?: string | null; summary?: string | null }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    const today = format(new Date(), 'yyyy-MM-dd')

    const { error: logError } = await (supabase as any).from('contact_logs').insert({
      contact_id,
      date: today,
      medium: data.medium ?? null,
      summary: data.summary ?? null,
    })

    if (logError) return { success: false, error: logError.message }

    const { error: updateError } = await (supabase as any)
      .from('contacts')
      .update({ last_contact_at: today })
      .eq('id', contact_id)
      .eq('user_id', user.id)

    if (updateError) return { success: false, error: updateError.message }

    revalidatePath('/relationships')
    return { success: true, error: null }
  } catch (err) {
    console.error('logContact error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function getContactLogs(contactId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser()
    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await (supabase as any)
      .from('contact_logs')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })
      .limit(20)

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch {
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function getContactsDueForReach() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)

    if (error) return { data: null, error: error.message }

    const today = new Date()
    const due = ((data ?? []) as Contact[]).filter((contact) => {
      if (!contact.frequency_days) return false
      if (!contact.last_contact_at) return true
      const lastContact = parseISO(contact.last_contact_at)
      const daysSince = differenceInDays(today, lastContact)
      return daysSince >= contact.frequency_days
    })

    return { data: due, error: null }
  } catch (err) {
    console.error('getContactsDueForReach error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function getUpcomingBirthdays(days: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .not('birthday', 'is', null)

    if (error) return { data: null, error: error.message }

    const today = new Date()
    const upcoming = ((data ?? []) as Contact[]).filter((contact) => {
      if (!contact.birthday) return false
      try {
        const bday = parseISO(contact.birthday)
        // Normalize birthday to current year
        const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
        if (thisYearBday < today) {
          thisYearBday.setFullYear(today.getFullYear() + 1)
        }
        const daysUntil = differenceInDays(thisYearBday, today)
        return daysUntil >= 0 && daysUntil <= days
      } catch {
        return false
      }
    })

    // Sort by upcoming date
    upcoming.sort((a, b) => {
      const getNextBday = (birthday: string) => {
        const bday = parseISO(birthday)
        const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
        if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1)
        return thisYear
      }
      return getNextBday(a.birthday!).getTime() - getNextBday(b.birthday!).getTime()
    })

    return { data: upcoming, error: null }
  } catch (err) {
    console.error('getUpcomingBirthdays error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}
