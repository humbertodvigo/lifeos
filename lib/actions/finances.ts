'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export async function getAccounts() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    console.error('getAccounts error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function getCategories() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    console.error('getCategories error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function getTransactions(limit = 50) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, color, type), accounts(name, currency)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    console.error('getTransactions error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function createTransaction(data: {
  account_id: string
  category_id?: string | null
  amount: number
  type: string
  date: string
  description?: string | null
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any).from('transactions').insert({
      user_id: user.id,
      account_id: data.account_id,
      category_id: data.category_id ?? null,
      amount: data.amount,
      type: data.type,
      date: data.date,
      description: data.description ?? null,
    })

    if (insertError) return { success: false, error: insertError.message }

    // Update account balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: account, error: accountFetchError } = await (supabase as any)
      .from('accounts')
      .select('balance')
      .eq('id', data.account_id)
      .eq('user_id', user.id)
      .single()

    if (!accountFetchError && account) {
      const delta = data.type === 'income' ? data.amount : -data.amount
      const accountTyped = account as { balance: number }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: balanceError } = await (supabase as any)
        .from('accounts')
        .update({ balance: accountTyped.balance + delta })
        .eq('id', data.account_id)
        .eq('user_id', user.id)

      if (balanceError) console.error('Balance update error:', balanceError)
    }

    revalidatePath('/finances')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (err) {
    console.error('createTransaction error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function deleteTransaction(id: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // Fetch transaction first to reverse balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: txRaw, error: txError } = await (supabase as any)
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (txError || !txRaw) return { success: false, error: 'Transação não encontrada.' }
    const tx = txRaw as { id: string; account_id: string; type: string; amount: number }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) return { success: false, error: deleteError.message }

    // Reverse account balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: account, error: accountError } = await (supabase as any)
      .from('accounts')
      .select('balance')
      .eq('id', tx.account_id)
      .eq('user_id', user.id)
      .single()

    if (!accountError && account) {
      const accTyped = account as { balance: number }
      const delta = tx.type === 'income' ? -tx.amount : tx.amount
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('accounts')
        .update({ balance: accTyped.balance + delta })
        .eq('id', tx.account_id)
        .eq('user_id', user.id)
    }

    revalidatePath('/finances')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (err) {
    console.error('deleteTransaction error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function getFinancialSummary() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    // Total balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: accountsRaw, error: accError } = await (supabase as any)
      .from('accounts')
      .select('balance')
      .eq('user_id', user.id)

    if (accError) return { data: null, error: accError.message }

    const accounts = (accountsRaw ?? []) as { balance: number }[]
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

    // This month transactions
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: monthTxRaw, error: txError } = await (supabase as any)
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)

    if (txError) return { data: null, error: txError.message }

    const transactions = (monthTxRaw ?? []) as { amount: number; type: string }[]
    const monthIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const monthExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100) : 0

    return {
      data: {
        total_balance: totalBalance,
        month_income: monthIncome,
        month_expenses: monthExpenses,
        savings_rate: savingsRate,
      },
      error: null,
    }
  } catch (err) {
    console.error('getFinancialSummary error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function getFinancialGoals() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { data: null, error: 'Usuário não autenticado.' }

    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('deadline', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    console.error('getFinancialGoals error:', err)
    return { data: null, error: 'Erro inesperado.' }
  }
}

export async function createFinancialGoal(data: {
  title: string
  target: number
  deadline?: string | null
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('financial_goals').insert({
      user_id: user.id,
      title: data.title,
      target: data.target,
      current: 0,
      deadline: data.deadline ?? null,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/finances')
    return { success: true, error: null }
  } catch (err) {
    console.error('createFinancialGoal error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function updateGoalProgress(id: string, current: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('financial_goals')
      .update({ current })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/finances')
    return { success: true, error: null }
  } catch (err) {
    console.error('updateGoalProgress error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function createAccount(data: {
  name: string
  type: string
  balance: number
  currency?: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('accounts').insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      currency: data.currency ?? 'BRL',
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/finances')
    return { success: true, error: null }
  } catch (err) {
    console.error('createAccount error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}

export async function createCategory(data: {
  name: string
  type: string
  color?: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Usuário não autenticado.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('categories').insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      color: data.color ?? '#6b7280',
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/finances')
    return { success: true, error: null }
  } catch (err) {
    console.error('createCategory error:', err)
    return { success: false, error: 'Erro inesperado.' }
  }
}
