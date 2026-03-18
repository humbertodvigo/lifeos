'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, User, Lock, LogOut } from 'lucide-react'
import { getProfile, updateProfile, updatePassword } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/client'

interface ProfileData {
  name: string
  email?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    getProfile().then(({ data }) => {
      if (data) {
        const pd = data as ProfileData
        setProfile(pd)
        setName(pd.name ?? '')
      }
      setLoading(false)
    })
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('O nome não pode estar vazio.')
      return
    }
    setSavingName(true)
    const result = await updateProfile(name.trim())
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Nome atualizado com sucesso!')
      setProfile(prev => prev ? { ...prev, name: name.trim() } : prev)
    }
    setSavingName(false)
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    setSavingPassword(true)
    const result = await updatePassword(newPassword)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Senha atualizada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Configurações" description="Gerencie sua conta e preferências" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="Configurações" description="Gerencie sua conta e preferências" />

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil
              </CardTitle>
              <CardDescription>Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.name ?? 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <Separator />

              <form onSubmit={handleSaveName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome de exibição</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome..."
                  />
                </div>
                <Button type="submit" disabled={savingName}>
                  {savingName ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar nome'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Segurança
              </CardTitle>
              <CardDescription>Altere sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={savingPassword || !newPassword}>
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Alterar senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Session */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sessão
              </CardTitle>
              <CardDescription>Gerencie sua sessão ativa</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleSignOut} className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                <LogOut className="w-4 h-4 mr-2" />
                Sair da conta
              </Button>
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  )
}
