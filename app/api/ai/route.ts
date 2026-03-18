import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic/client'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await request.json()
    const { messages } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      context?: Record<string, unknown>
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensagens inválidas.' }, { status: 400 })
    }

    const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    const todayDate = format(new Date(), 'yyyy-MM-dd')

    // Fetch today's check-in
    const { data: checkinRaw } = await supabase
      .from('daily_checkins')
      .select('mood, energy, intention')
      .eq('user_id', user.id)
      .eq('date', todayDate)
      .maybeSingle()
    const checkin = checkinRaw as {mood:number|null;energy:number|null;intention:string|null} | null

    // Fetch recent tasks (last 5)
    const { data: tasksRaw } = await supabase
      .from('tasks')
      .select('title, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    const tasks = (tasksRaw ?? []) as Array<{title:string;status:string}>

    // Fetch active habits count
    const { count: habitsCount } = await supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('active', true)

    const moodInfo = checkin?.mood != null ? `${checkin.mood}/10` : 'não registrado'
    const energyInfo = checkin?.energy != null ? `${checkin.energy}/10` : 'não registrada'
    const intentionInfo = checkin?.intention ?? 'não registrada'
    const taskTitles =
      tasks && tasks.length > 0
        ? tasks.map((t) => `"${t.title}" (${t.status})`).join(', ')
        : 'nenhuma tarefa recente'

    const systemPrompt = `Você é um assistente pessoal de vida do usuário no Life OS. Você tem acesso ao contexto do usuário e pode ajudá-lo com reflexões, planejamento, produtividade e bem-estar.

Contexto atual do usuário:
- Hoje: ${today}
- Check-in de hoje: humor ${moodInfo}, energia ${energyInfo}
- Intenção do dia: ${intentionInfo}
- Hábitos ativos: ${habitsCount ?? 0}
- Tarefas recentes: ${taskTitles}

Seja empático, motivador e objetivo. Responda sempre em português brasileiro.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const assistantText =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ response: assistantText })
  } catch (err) {
    console.error('AI route error:', err)
    return NextResponse.json(
      { error: 'Erro ao processar sua mensagem. Tente novamente.' },
      { status: 500 }
    )
  }
}
