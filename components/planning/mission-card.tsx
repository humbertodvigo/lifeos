'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, X, Check, Plus } from 'lucide-react'
import { saveLifeVision } from '@/lib/actions/planning'

interface MissionCardProps {
  mission: string | null
  values: string[]
}

export function MissionCard({ mission: initialMission, values: initialValues }: MissionCardProps) {
  const [editing, setEditing] = useState(false)
  const [mission, setMission] = useState(initialMission ?? '')
  const [values, setValues] = useState<string[]>(initialValues ?? [])
  const [valueInput, setValueInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const result = await saveLifeVision({ mission, values })
      if (result.error) throw new Error(result.error)
      toast.success('Missão salva!')
      setEditing(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar missão.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function addValue() {
    const v = valueInput.trim()
    if (v && !values.includes(v)) {
      setValues((prev) => [...prev, v])
    }
    setValueInput('')
  }

  function removeValue(v: string) {
    setValues((prev) => prev.filter((val) => val !== v))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Mission */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Minha Missão</CardTitle>
          {!editing && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Escreva sua missão de vida..."
                rows={4}
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={loading}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {mission || 'Nenhuma missão definida ainda. Clique em editar para começar.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Meus Valores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addValue() }
                  }}
                  placeholder="Adicionar valor..."
                  className="text-sm"
                />
                <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0" onClick={addValue}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1">
                    {v}
                    <button onClick={() => removeValue(v)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              {values.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum valor definido.</p>
              ) : (
                values.map((v) => (
                  <div key={v} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    {v}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
