"use client";

import { signOut, useSession } from 'next-auth/react';
import { Button } from './ui/button';

export default function LogoutButton() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
      Logout
    </Button>
  );
}
