'use client'

import { useState } from 'react'
import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: number
  role: 'assistant' | 'user'
  content: string
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'assistant',
    content:
      'Olá! Sou seu assistente de vida pessoal. Como posso ajudar você hoje?',
  },
]

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')

  function handleSend() {
    const text = inputValue.trim()
    if (!text) return

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: text,
    }

    const assistantReply: Message = {
      id: messages.length + 2,
      role: 'assistant',
      content:
        'Entendi! Estou processando sua solicitação. Em breve a integração com IA estará disponível.',
    }

    setMessages((prev) => [...prev, userMessage, assistantReply])
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Assistente IA"
        description="Seu coach pessoal com IA"
      />

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <p className="text-xs font-semibold mb-1 opacity-60">Assistente</p>
                )}
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo ao seu assistente..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!inputValue.trim()}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
