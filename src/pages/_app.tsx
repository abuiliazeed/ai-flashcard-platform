import type { AppProps } from 'next/app'
import { AuthProvider } from '@/components/AuthProvider'
import '@/app/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
