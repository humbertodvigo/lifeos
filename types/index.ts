export type { Database, Json } from './database'

export type LifeArea = {
  id: string
  slug: string
  name: string
  color: string
  icon: string
}

export type Profile = {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  timezone: string
  household_id: string | null
  created_at: string
}

export type DailyCheckin = {
  id: string
  user_id: string
  date: string
  mood: number | null
  energy: number | null
  gratitude: string | null
  intention: string | null
  highlights: string | null
  challenges: string | null
  done: boolean
}

export type Habit = {
  id: string
  user_id: string
  title: string
  frequency: 'daily' | 'weekly' | 'custom'
  area: string | null
  target_streak: number
  shared: boolean
  active: boolean
  created_at: string
}

export type HabitLog = {
  id: string
  habit_id: string
  user_id: string
  date: string
  done: boolean
  note: string | null
}

export type Task = {
  id: string
  project_id: string | null
  user_id: string
  title: string
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  due_date: string | null
  priority: 'low' | 'medium' | 'high'
  assignee_id: string | null
  tags: string[]
  created_at: string
}

export type Subtask = {
  id: string
  task_id: string
  title: string
  done: boolean
}

export type Project = {
  id: string
  user_id: string
  title: string
  description: string | null
  area: string | null
  status: 'active' | 'completed' | 'archived'
  due_date: string | null
  priority: 'low' | 'medium' | 'high'
  shared: boolean
  created_at: string
}

export type HealthLog = {
  id: string
  user_id: string
  date: string
  sleep_hours: number | null
  sleep_quality: number | null
  exercise_min: number | null
  water_ml: number | null
  mood: number | null
  energy: {
    mental?: number
    physical?: number
    emotional?: number
    creative?: number
    social?: number
  }
  notes: string | null
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: number
  type: 'income' | 'expense'
  date: string
  description: string | null
  shared: boolean
}

export type Contact = {
  id: string
  user_id: string
  name: string
  relationship: string | null
  frequency_days: number | null
  notes: string | null
  birthday: string | null
  last_contact_at: string | null
  tags: string[]
}

export type Note = {
  id: string
  user_id: string
  title: string
  content: string | null
  tags: string[]
  type: 'note' | 'idea' | 'learning' | 'reference' | 'project'
  linked_notes: string[]
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  user_id: string
  title: string
  author: string | null
  status: 'want_to_read' | 'reading' | 'read'
  rating: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
}

export type OKR = {
  id: string
  user_id: string
  title: string
  period: 'annual' | 'quarterly'
  year: number
  quarter: number | null
  status: 'active' | 'completed' | 'cancelled'
  shared: boolean
  created_at: string
}

export type KeyResult = {
  id: string
  okr_id: string
  title: string
  target: number
  current: number
  unit: string
  due_date: string | null
}

export type Review = {
  id: string
  user_id: string
  type: 'weekly' | 'monthly' | 'yearly'
  period_start: string
  period_end: string
  content: Record<string, unknown>
  created_at: string
}

export const LIFE_AREAS = [
  { slug: 'health', name: 'Saúde', color: '#22c55e', icon: 'Heart' },
  { slug: 'career', name: 'Carreira', color: '#3b82f6', icon: 'Briefcase' },
  { slug: 'finances', name: 'Finanças', color: '#f59e0b', icon: 'DollarSign' },
  { slug: 'relationships', name: 'Relacionamentos', color: '#ec4899', icon: 'Users' },
  { slug: 'personal', name: 'Desenvolvimento', color: '#8b5cf6', icon: 'Star' },
  { slug: 'leisure', name: 'Lazer', color: '#f97316', icon: 'Smile' },
  { slug: 'family', name: 'Família', color: '#ef4444', icon: 'Home' },
  { slug: 'spirituality', name: 'Espiritualidade', color: '#6366f1', icon: 'Sun' },
] as const
