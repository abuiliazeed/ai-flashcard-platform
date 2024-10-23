import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import Flashcard from '@/components/Flashcard'
import { Button } from '@/components/ui/button'
import ErrorMessage from '@/components/ErrorMessage'
import { supabase } from '@/lib/supabase'

interface FlashcardType {
  id: string
  question: string
  answer: string
}

const FlashcardsPage: NextPage = () => {
  const router = useRouter()
  const { topicId } = router.query
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (topicId) {
      fetchFlashcards()
    }
  }, [topicId])

  const fetchFlashcards = async () => {
    setIsLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId)

      if (error) throw error

      setFlashcards(data)
    } catch (error) {
      console.error('Error fetching flashcards:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length)
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length)
  }

  if (isLoading) {
    return <div>Loading flashcards...</div>
  }

  return (
    <div>
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Flashcards for Topic {topicId}</h1>
        {error && <ErrorMessage message={error} />}
        {flashcards.length > 0 ? (
          <div>
            <Flashcard {...flashcards[currentIndex]} />
            <div className="mt-4 flex justify-between">
              <Button onClick={handlePrevious}>Previous</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
            <p className="text-center mt-4">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
          </div>
        ) : (
          <p>No flashcards available for this topic.</p>
        )}
      </main>
    </div>
  )
}

export default FlashcardsPage
