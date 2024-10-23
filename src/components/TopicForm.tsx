"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import ErrorMessage from '@/components/ErrorMessage'

const TopicForm = () => {
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit topic')
      }

      router.push(`/flashcards/${data.topicId}`)
    } catch (error) {
      console.error('Error submitting topic:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic to learn about"
        required
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !user}>
        {isLoading ? 'Generating...' : 'Generate Flashcards'}
      </Button>
    </form>
  )
}

export default TopicForm
