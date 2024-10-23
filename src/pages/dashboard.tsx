import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import NavBar from '@/components/NavBar'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import ErrorMessage from '@/components/ErrorMessage'

interface Topic {
  id: string
  topic: string
}

interface Progress {
  topic_id: string
  score: number
}

interface Recommendation {
  title: string
  description: string
}

const DashboardPage: NextPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      fetchData()
    }
  }, [user, loading, router])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchTopics(),
        fetchProgress(),
        fetchRecommendations(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data')
    }
  }

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, topic')
      .eq('user_id', user?.id)

    if (error) throw error
    setTopics(data)
  }

  const fetchProgress = async () => {
    const { data, error } = await supabase
      .from('progress')
      .select('topic_id, score, progress_data')
      .eq('user_id', user?.id)

    if (error) throw error
    setProgress(data.map(item => ({
      topic_id: item.topic_id,
      score: item.score || 0,  // Use 0 if score is null
      progress_data: item.progress_data
    })))
  }

  const fetchRecommendations = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch('/api/recommendations/generate', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch recommendations')
    }

    const data = await response.json()
    setRecommendations(data.recommendations)
  }

  const handleTakeQuiz = (topicId: string) => {
    router.push(`/quiz/${topicId}`)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="mb-4">Welcome, {user.email}!</p>
        {error && <ErrorMessage message={error} />}
        
        <h2 className="text-2xl font-semibold mb-4">Your Topics</h2>
        {topics.length > 0 ? (
          <ul className="space-y-4">
            {topics.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between">
                <span>{topic.topic}</span>
                <div>
                  <span className="mr-4">
                    Score: {progress.find(p => p.topic_id === topic.id)?.score || 0}%
                  </span>
                  <Button onClick={() => handleTakeQuiz(topic.id)}>Take Quiz</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven't created any topics yet.</p>
        )}
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Recommendations</h2>
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((recommendation, index) => (
              <Card key={index} className="p-4">
                <h3 className="text-lg font-semibold mb-2">{recommendation.title}</h3>
                <p>{recommendation.description}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p>No recommendations available.</p>
        )}
        
        <Button onClick={() => router.push('/')} className="mt-8">Create New Topic</Button>
      </main>
    </div>
  )
}

export default DashboardPage
