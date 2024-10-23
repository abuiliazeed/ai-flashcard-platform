import { Card, CardContent } from "@/components/ui/card"

interface FlashcardProps {
  question: string
  answer: string
}

const Flashcard: React.FC<FlashcardProps> = ({ question, answer }) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Question</h3>
          <p className="mb-6">{question}</p>
          <h3 className="text-lg font-semibold mb-4">Answer</h3>
          <p>{answer}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default Flashcard
