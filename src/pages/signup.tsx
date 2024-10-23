import { useState } from 'react'
import { useRouter } from 'next/router'
import { NextPage } from 'next'
import NavBar from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp } from '@/lib/supabase'

const SignupPage: NextPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const { error } = await signUp(email, password)
      if (error) throw error
      router.push('/login')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  return (
    <div>
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">Sign Up</Button>
        </form>
      </main>
    </div>
  )
}

export default SignupPage
