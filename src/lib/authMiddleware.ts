import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from './supabase'

export async function authMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new Error('Invalid token')
    }

    // Add the user to the request object
    ;(req as any).user = user

    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Invalid authorization token' })
  }
}
