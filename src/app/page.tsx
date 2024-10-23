import { Metadata } from 'next'
import TopicForm from "@/components/TopicForm"
import NavBar from "@/components/NavBar"

export const metadata: Metadata = {
  title: 'AI Flashcard Platform',
  description: 'Generate flashcards and quizzes using AI',
}

export default function Home() {
  return (
    <div>
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to AI Flashcard Platform</h1>
        <p className="mb-4">Enter a topic to generate flashcards:</p>
        <TopicForm />
      </main>
    </div>
  )
}
