import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabaseServer';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/dashboard');
  }
  return (
    <>
      {children}
    </>
  );
}
