import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FlashcardProps {
  question: string
  answer: string
}

const Flashcard = ({ question, answer }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {isFlipped ? 'Answer' : 'Question'}
          </h3>
          <p className="mb-4">{isFlipped ? answer : question}</p>
          <Button onClick={() => setIsFlipped(!isFlipped)}>
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default Flashcard
