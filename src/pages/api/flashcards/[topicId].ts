import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import groq from '@/lib/groq'
import { authMiddleware } from '@/lib/authMiddleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'GET') {
    const { topicId } = req.query
    const user = (req as any).user

    if (typeof topicId !== 'string') {
      return res.status(400).json({ error: 'Invalid topicId' })
    }

    try {
      // Fetch the topic from Supabase
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('topic')
        .eq('id', topicId)
        .eq('user_id', user.id)
        .single()

      if (topicError) {
        if (topicError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Topic not found' })
        }
        throw topicError
      }

      const topic = topicData.topic

      // Check if flashcards already exist
      const { data: existingFlashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId)

      if (flashcardsError) throw flashcardsError

      if (existingFlashcards.length > 0) {
        // Flashcards already exist, return them
        res.status(200).json({ flashcards: existingFlashcards })
      } else {
        // Generate flashcards using Groq API
        const prompt = `Create a set of 5 flashcards to teach the topic: "${topic}". Each flashcard should be in JSON format with "question" and "answer" fields.`

        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'mixtral-8x7b-32768',
        })

        const flashcardContent = completion.choices[0]?.message?.content || ''

        // Parse the flashcards
        let generatedFlashcards
        try {
          generatedFlashcards = JSON.parse(flashcardContent)
        } catch (error) {
          console.error('Error parsing flashcards:', error)
          throw new Error('Failed to generate valid flashcards')
        }

        // Validate the generated flashcards
        if (!Array.isArray(generatedFlashcards) || generatedFlashcards.length === 0) {
          throw new Error('Invalid flashcard data generated')
        }

        // Insert flashcards into Supabase
        const { data: insertedFlashcards, error: insertError } = await supabase
          .from('flashcards')
          .insert(
            generatedFlashcards.map((fc: any) => ({
              topic_id: topicId,
              question: fc.question,
              answer: fc.answer,
            }))
          )
          .select()

        if (insertError) throw insertError

        res.status(200).json({ flashcards: insertedFlashcards })
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
      res.status(500).json({ error: 'Error generating flashcards' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
