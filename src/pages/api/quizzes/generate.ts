import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/authMiddleware'
import groq from '@/lib/groq'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'POST') {
    const { topicId } = req.body
    const user = (req as any).user

    console.log('Received request for topicId:', topicId)

    if (typeof topicId !== 'string') {
      return res.status(400).json({ error: 'Invalid topicId' })
    }

    try {
      // Fetch the flashcards for the topic
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId)

      if (flashcardsError) {
        console.error('Error fetching flashcards:', flashcardsError)
        throw flashcardsError
      }

      console.log('Fetched flashcards:', flashcards)

      if (flashcards.length === 0) {
        return res.status(404).json({ error: 'No flashcards found for this topic' })
      }

      // Generate quiz questions using Groq API
      const prompt = `Create a quiz with 5 multiple-choice questions based on these flashcards: ${JSON.stringify(flashcards)}. Each question should have 4 options. Return the quiz in JSON format with fields: question, options (array), and correctAnswer.`

      console.log('Sending prompt to Groq API:', prompt)

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
      })

      const quizContent = completion.choices[0]?.message?.content || ''

      console.log('Received quiz content from Groq API:', quizContent)

      // Parse the quiz content
      let quizData
      try {
        quizData = JSON.parse(quizContent)
      } catch (error) {
        console.error('Error parsing quiz:', error)
        throw new Error('Failed to parse quiz data')
      }

      // Extract the quiz array from the parsed data
      const quiz = quizData.quiz

      // Validate the generated quiz
      if (!Array.isArray(quiz) || quiz.length === 0) {
        console.error('Invalid quiz data:', quiz)
        throw new Error('Invalid quiz data generated')
      }

      // Validate each question in the quiz
      quiz.forEach((question, index) => {
        if (!question.question || !Array.isArray(question.options) || question.options.length !== 4 || !question.correctAnswer) {
          console.error(`Invalid question at index ${index}:`, question)
          throw new Error(`Invalid question format at index ${index}`)
        }
      })

      console.log('Parsed and validated quiz:', quiz)

      // Save the quiz to the database
      const { data: insertedQuiz, error: insertError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          quiz_content: quiz,
        })
        .select()

      if (insertError) {
        console.error('Error inserting quiz:', insertError)
        throw insertError
      }

      console.log('Inserted quiz:', insertedQuiz)

      res.status(200).json({ quizId: insertedQuiz[0].id, quiz })
    } catch (error) {
      console.error('Error generating quiz:', error)
      res.status(500).json({ 
        error: 'Error generating quiz', 
        details: error instanceof Error ? error.message : String(error) 
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
