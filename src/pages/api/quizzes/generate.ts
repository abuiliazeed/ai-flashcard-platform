import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import groq from '@/lib/groq'
import { authMiddleware } from '@/lib/authMiddleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'POST') {
    const { topicId } = req.body
    const user = (req as any).user

    if (typeof topicId !== 'string') {
      return res.status(400).json({ error: 'Invalid topicId' })
    }

    try {
      // Fetch the flashcards for the topic
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId)

      if (flashcardsError) throw flashcardsError

      if (flashcards.length === 0) {
        return res.status(404).json({ error: 'No flashcards found for this topic' })
      }

      // Generate quiz questions using Groq API
      const prompt = `Create a quiz with 5 multiple-choice questions based on these flashcards: ${JSON.stringify(flashcards)}. Each question should have 4 options. Return the quiz in JSON format with fields: question, options (array), and correctAnswer.`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
      })

      const quizContent = completion.choices[0]?.message?.content || ''

      // Parse the quiz content
      let quiz
      try {
        quiz = JSON.parse(quizContent)
      } catch (error) {
        console.error('Error parsing quiz:', error)
        throw new Error('Failed to generate valid quiz')
      }

      // Save the quiz to the database
      const { data: insertedQuiz, error: insertError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          quiz_content: quiz,
        })
        .select()

      if (insertError) throw insertError

      res.status(200).json({ quizId: insertedQuiz[0].id, quiz })
    } catch (error) {
      console.error('Error generating quiz:', error)
      res.status(500).json({ error: 'Error generating quiz' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
