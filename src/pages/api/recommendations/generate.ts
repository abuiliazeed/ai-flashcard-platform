import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import groq from '@/lib/groq'
import { authMiddleware } from '@/lib/authMiddleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'GET') {
    const user = (req as any).user

    try {
      // Fetch user's progress
      const { data: progress, error: progressError } = await supabase
        .from('progress')
        .select('topic_id, score')
        .eq('user_id', user.id)

      if (progressError) throw progressError

      // Fetch topics
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id, topic')
        .eq('user_id', user.id)

      if (topicsError) throw topicsError

      // Generate recommendations using Groq API
      const prompt = `Based on the user's progress ${JSON.stringify(progress)} and their topics ${JSON.stringify(topics)}, provide 3 personalized learning recommendations. Return the recommendations in JSON format with fields: title and description.`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
      })

      const recommendationsContent = completion.choices[0]?.message?.content || ''

      // Parse the recommendations
      let recommendations
      try {
        recommendations = JSON.parse(recommendationsContent)
      } catch (error) {
        console.error('Error parsing recommendations:', error)
        throw new Error('Failed to generate valid recommendations')
      }

      // Save recommendations to the database
      const { data: insertedRecommendations, error: insertError } = await supabase
        .from('recommendations')
        .insert({
          user_id: user.id,
          recommendation_content: recommendations,
        })
        .select()

      if (insertError) throw insertError

      res.status(200).json({ recommendations })
    } catch (error) {
      console.error('Error generating recommendations:', error)
      res.status(500).json({ error: 'Error generating recommendations' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
