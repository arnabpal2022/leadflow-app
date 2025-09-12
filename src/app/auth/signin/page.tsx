'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
      });

      if (result?.ok) {
        setSent(true);
      } else {
        alert('Failed to send sign-in link');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo login for development
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signIn('email', {
        email: 'demo@example.com',
        redirect: false,
      });
      // In a real app, you'd implement a proper demo login
      router.push('/buyers');
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a sign-in link to {email}
            </p>
          </div>
          <div className="text-center">
            <Button variant="outline" onClick={() => setSent(false)}>
              Use different email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Buyer Leads
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a sign-in link
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full"
            />
          </div>

          <div className="space-y-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send sign-in link'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full"
            >
              Demo Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}