import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/lib/authMiddleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve) => authMiddleware(req, res, () => resolve()));

  if (req.method === 'POST') {
    const { topicId, score } = req.body
    const user = (req as any).user

    if (typeof topicId !== 'string' || typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid topicId or score' })
    }

    try {
      // Update or insert progress
      const { data, error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          topic_id: topicId,
          score: score,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      res.status(200).json({ progress: data[0] })
    } catch (error) {
      console.error('Error updating progress:', error)
      res.status(500).json({ error: 'Error updating progress' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
