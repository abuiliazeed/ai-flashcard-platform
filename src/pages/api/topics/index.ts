import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/authMiddleware'
import groq from '@/lib/groq'

const validateTopic = (topic: string) => {
  if (typeof topic !== 'string') {
    return 'Topic must be a string'
  }
  if (topic.trim().length < 3) {
    return 'Topic must be at least 3 characters long'
  }
  if (topic.trim().length > 100) {
    return 'Topic must be less than 100 characters long'
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'POST') {
    const { topic } = req.body
    const user = (req as any).user

    console.log('Received topic:', topic);
    console.log('User:', user);

    const validationError = validateTopic(topic)
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    try {
      // Insert the new topic
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .insert([{ user_id: user.id, topic: topic.trim() }])
        .select()

      if (topicError) {
        console.error('Error inserting topic:', topicError)
        throw topicError
      }

      console.log('Inserted topic:', topicData);

      if (!topicData || topicData.length === 0) {
        throw new Error('No topic data returned after insertion')
      }

      const topicId = topicData[0].id

      // Generate flashcards using Groq API
      console.log('Generating flashcards for topic:', topic);
      const prompt = `Create a set of 5 flashcards to teach the topic: "${topic}". Each flashcard should be in JSON format with "question" and "answer" fields.`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
      })

      const flashcardContent = completion.choices[0]?.message?.content || ''
      console.log('Generated flashcard content:', flashcardContent);

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

      console.log('Parsed flashcards:', generatedFlashcards);

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

      if (insertError) {
        console.error('Error inserting flashcards:', insertError)
        throw insertError
      }

      console.log('Inserted flashcards:', insertedFlashcards);

      res.status(200).json({ topicId, flashcards: insertedFlashcards })
    } catch (error) {
      console.error('Error submitting topic and generating flashcards:', error)
      res.status(500).json({ 
        error: 'Error submitting topic and generating flashcards', 
        details: error instanceof Error ? error.message : String(error) 
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
