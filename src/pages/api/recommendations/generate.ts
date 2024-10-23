import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/authMiddleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'GET') {
    const user = (req as any).user

    try {
      // Fetch user's progress
      const { data: progress, error: progressError } = await supabase
        .from('progress')
        .select('topic_id, score, progress_data')
        .eq('user_id', user.id)

      if (progressError) throw progressError

      // Fetch topics
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id, topic')
        .eq('user_id', user.id)

      if (topicsError) throw topicsError

      // Generate recommendations (you can implement your own logic here)
      const recommendations = [
        { title: "Review weak topics", description: "Focus on topics with lower scores" },
        { title: "Explore new topics", description: "Try learning something new" },
        { title: "Practice regularly", description: "Consistent practice improves retention" }
      ]

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
