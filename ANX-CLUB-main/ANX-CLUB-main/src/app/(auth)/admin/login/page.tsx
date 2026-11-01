import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Administrator Sign In' }

export default function AdminLoginPage() {
  return <LoginForm adminOnly />
}