'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotes(type?: string) {
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
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('getNotes error:', error)
      return { data: [], error: error.message }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error('getNotes unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar notas.' }
  }
}

export async function getNote(id: string) {
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
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('getNote error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('getNote unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao buscar nota.' }
  }
}

export async function createNote(data: {
  title: string
  content?: string
  type?: string
  tags?: string[]
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

    const { data: note, error } = await (supabase as any)
      .from('notes')
      .insert({
        user_id: user.id,
        title: data.title,
        content: data.content ?? null,
        type: data.type ?? 'note',
        tags: data.tags ?? [],
      })
      .select()
      .single()

    if (error) {
      console.error('createNote error:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/knowledge')

    return { data: note, error: null }
  } catch (err) {
    console.error('createNote unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao criar nota.' }
  }
}

export async function updateNote(
  id: string,
  data: {
    title?: string
    content?: string
    tags?: string[]
    type?: string
  }
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
      .from('notes')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateNote error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/knowledge')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateNote unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar nota.' }
  }
}

export async function deleteNote(id: string) {
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
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteNote error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/knowledge')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteNote unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir nota.' }
  }
}

export async function getBooks(status?: string) {
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
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('title', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('getBooks error:', error)
      return { data: [], error: error.message }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error('getBooks unexpected error:', err)
    return { data: [], error: 'Erro inesperado ao buscar livros.' }
  }
}

export async function createBook(data: {
  title: string
  author?: string
  status?: string
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

    const { data: book, error } = await (supabase as any)
      .from('books')
      .insert({
        user_id: user.id,
        title: data.title,
        author: data.author ?? null,
        status: data.status ?? 'want_to_read',
      })
      .select()
      .single()

    if (error) {
      console.error('createBook error:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/knowledge')

    return { data: book, error: null }
  } catch (err) {
    console.error('createBook unexpected error:', err)
    return { data: null, error: 'Erro inesperado ao criar livro.' }
  }
}

export async function updateBook(
  id: string,
  data: {
    status?: string
    rating?: number
    notes?: string
    started_at?: string
    finished_at?: string
  }
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
      .from('books')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateBook error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/knowledge')

    return { success: true, error: null }
  } catch (err) {
    console.error('updateBook unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao atualizar livro.' }
  }
}

export async function deleteBook(id: string) {
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
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteBook error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/knowledge')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteBook unexpected error:', err)
    return { success: false, error: 'Erro inesperado ao excluir livro.' }
  }
}
