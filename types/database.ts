export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          avatar_url: string | null
          timezone: string
          household_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          avatar_url?: string | null
          timezone?: string
          household_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          avatar_url?: string | null
          timezone?: string
          household_id?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: Json
          updated_at?: string
        }
      }
      life_areas: {
        Row: {
          id: string
          slug: string
          name: string
          color: string
          icon: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          color: string
          icon: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          color?: string
          icon?: string
        }
      }
      area_scores: {
        Row: {
          id: string
          user_id: string
          area_id: string
          score: number
          week_of: string
          computed_from: Json
        }
        Insert: {
          id?: string
          user_id: string
          area_id: string
          score: number
          week_of: string
          computed_from?: Json
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string
          score?: number
          week_of?: string
          computed_from?: Json
        }
      }
      life_vision: {
        Row: {
          id: string
          user_id: string
          mission: string | null
          values: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mission?: string | null
          values?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mission?: string | null
          values?: string[]
          updated_at?: string
        }
      }
      okrs: {
        Row: {
          id: string
          user_id: string
          title: string
          period: string
          year: number
          quarter: number | null
          status: string
          shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          period: string
          year: number
          quarter?: number | null
          status?: string
          shared?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          period?: string
          year?: number
          quarter?: number | null
          status?: string
          shared?: boolean
          created_at?: string
        }
      }
      key_results: {
        Row: {
          id: string
          okr_id: string
          title: string
          target: number
          current: number
          unit: string
          due_date: string | null
        }
        Insert: {
          id?: string
          okr_id: string
          title: string
          target: number
          current?: number
          unit: string
          due_date?: string | null
        }
        Update: {
          id?: string
          okr_id?: string
          title?: string
          target?: number
          current?: number
          unit?: string
          due_date?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          area: string | null
          status: string
          due_date: string | null
          priority: string
          shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          area?: string | null
          status?: string
          due_date?: string | null
          priority?: string
          shared?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          area?: string | null
          status?: string
          due_date?: string | null
          priority?: string
          shared?: boolean
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string | null
          user_id: string
          title: string
          status: string
          due_date: string | null
          priority: string
          assignee_id: string | null
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id: string
          title: string
          status?: string
          due_date?: string | null
          priority?: string
          assignee_id?: string | null
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string
          title?: string
          status?: string
          due_date?: string | null
          priority?: string
          assignee_id?: string | null
          tags?: string[]
          created_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          done: boolean
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          done?: boolean
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          done?: boolean
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          frequency: string
          area: string | null
          target_streak: number
          shared: boolean
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          frequency?: string
          area?: string | null
          target_streak?: number
          shared?: boolean
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          frequency?: string
          area?: string | null
          target_streak?: number
          shared?: boolean
          active?: boolean
          created_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          date: string
          done: boolean
          note: string | null
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          date: string
          done?: boolean
          note?: string | null
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          date?: string
          done?: boolean
          note?: string | null
        }
      }
      health_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          sleep_hours: number | null
          sleep_quality: number | null
          exercise_min: number | null
          water_ml: number | null
          mood: number | null
          energy: Json
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          sleep_hours?: number | null
          sleep_quality?: number | null
          exercise_min?: number | null
          water_ml?: number | null
          mood?: number | null
          energy?: Json
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          sleep_hours?: number | null
          sleep_quality?: number | null
          exercise_min?: number | null
          water_ml?: number | null
          mood?: number | null
          energy?: Json
          notes?: string | null
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          balance: number
          currency: string
          shared: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          balance?: number
          currency?: string
          shared?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          balance?: number
          currency?: string
          shared?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          color: string
          budget_monthly: number | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          color?: string
          budget_monthly?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          color?: string
          budget_monthly?: number | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          amount: number
          type: string
          date: string
          description: string | null
          shared: boolean
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          category_id?: string | null
          amount: number
          type: string
          date: string
          description?: string | null
          shared?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string | null
          amount?: number
          type?: string
          date?: string
          description?: string | null
          shared?: boolean
        }
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          target: number
          current: number
          deadline: string | null
          shared: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target: number
          current?: number
          deadline?: string | null
          shared?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target?: number
          current?: number
          deadline?: string | null
          shared?: boolean
        }
      }
      contacts: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship?: string | null
          frequency_days?: number | null
          notes?: string | null
          birthday?: string | null
          last_contact_at?: string | null
          tags?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relationship?: string | null
          frequency_days?: number | null
          notes?: string | null
          birthday?: string | null
          last_contact_at?: string | null
          tags?: string[]
        }
      }
      contact_logs: {
        Row: {
          id: string
          contact_id: string
          date: string
          medium: string | null
          summary: string | null
        }
        Insert: {
          id?: string
          contact_id: string
          date: string
          medium?: string | null
          summary?: string | null
        }
        Update: {
          id?: string
          contact_id?: string
          date?: string
          medium?: string | null
          summary?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          tags: string[]
          type: string
          linked_notes: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          tags?: string[]
          type?: string
          linked_notes?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          tags?: string[]
          type?: string
          linked_notes?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string | null
          status: string
          rating: number | null
          notes: string | null
          started_at: string | null
          finished_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author?: string | null
          status?: string
          rating?: number | null
          notes?: string | null
          started_at?: string | null
          finished_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string | null
          status?: string
          rating?: number | null
          notes?: string | null
          started_at?: string | null
          finished_at?: string | null
        }
      }
      daily_checkins: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          date: string
          mood?: number | null
          energy?: number | null
          gratitude?: string | null
          intention?: string | null
          highlights?: string | null
          challenges?: string | null
          done?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          mood?: number | null
          energy?: number | null
          gratitude?: string | null
          intention?: string | null
          highlights?: string | null
          challenges?: string | null
          done?: boolean
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          type: string
          period_start: string
          period_end: string
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          period_start: string
          period_end: string
          content?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          period_start?: string
          period_end?: string
          content?: Json
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
