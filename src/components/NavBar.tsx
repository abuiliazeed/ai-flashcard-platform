"use client";

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/supabase'

const NavBar = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">
          AI Flashcard Platform
        </Link>
        <div className="space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default NavBar
