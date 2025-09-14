"use client";

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import Image from 'next/image';

export default function SignInPage() {
  const { data: session } = useSession();
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
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[82vh]">
          <div className="hidden md:block relative h-full">
            <div className="absolute inset-0 h-full">
              <Image src="/house.jpg" alt="house" fill className="object-cover kenburns" priority />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          </div>
          <div className="p-16 flex flex-col justify-center space-y-8 h-full">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 rounded-3xl">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[82vh]">
        <div className="hidden md:block relative h-full">
          <div className="absolute inset-0 h-full">
            <Image src="/house.jpg" alt="house" fill className="object-cover kenburns" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        </div>

        <div className="p-16 flex flex-col justify-center space-y-8 h-full">
          {session ? (
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                You're signed in
              </h2>
              <p className="mt-2 text-sm text-gray-600">Proceed to your buyers dashboard.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/buyers')}>Go to buyers</Button>
              </div>
            </div>
          ) : (
          <>
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
            
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Scoped Ken Burns animation for the image panel
/* styled-jsx */
<style jsx>{`
  .kenburns {
    transform-origin: center;
    animation: kenburns 18s cubic-bezier(.2,.8,.2,1) infinite alternate;
  }

  @keyframes kenburns {
    0% { transform: scale(1) translateY(0); }
    100% { transform: scale(1.08) translateY(-6%); }
  }
`}</style>