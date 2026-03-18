import { getNotes, getBooks } from '@/lib/actions/knowledge'
import { KnowledgeClient } from '@/components/knowledge/knowledge-client'

export default async function KnowledgePage() {
  const [notesResult, booksResult] = await Promise.all([
    getNotes(),
    getBooks(),
  ])

  return (
    <KnowledgeClient
      initialNotes={notesResult.data}
      initialBooks={booksResult.data}
    />
  )
}
