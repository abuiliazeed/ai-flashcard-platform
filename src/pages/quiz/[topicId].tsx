import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ErrorMessage from '@/components/ErrorMessage'
import { supabase } from '@/lib/supabase'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

const QuizPage: NextPage = () => {
  const router = useRouter()
  const { topicId } = router.query
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (topicId) {
      generateQuiz()
    }
  }, [topicId])

  const generateQuiz = async () => {
    setIsLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topicId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Quiz generation error:', data)
        throw new Error(data.error || 'Failed to generate quiz')
      }

      if (!data.quiz || !Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error('Invalid quiz data received')
      }
      setQuiz(data.quiz)
    } catch (error) {
      console.error('Error generating quiz:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === quiz[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }

    if (currentQuestion + 1 < quiz.length) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
    } else {
      setQuizCompleted(true)
    }
  }

  if (isLoading) {
    return <div>Loading quiz...</div>
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (quizCompleted) {
    return (
      <div>
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Quiz Completed</h1>
          <p>Your score: {score} out of {quiz.length}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </main>
      </div>
    )
  }

  const currentQuizQuestion = quiz[currentQuestion]

  if (!currentQuizQuestion) {
    return <ErrorMessage message="No quiz questions available" />
  }

  return (
    <div>
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Quiz for Topic {topicId}</h1>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Question {currentQuestion + 1} of {quiz.length}</h2>
          <p className="mb-4">{currentQuizQuestion.question}</p>
          <div className="space-y-2">
            {currentQuizQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(option)}
                variant={selectedAnswer === option ? 'default' : 'outline'}
                className="w-full text-left justify-start"
              >
                {option}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className="mt-4"
          >
            {currentQuestion + 1 === quiz.length ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </Card>
      </main>
    </div>
  )
}

export default QuizPage
