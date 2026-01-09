import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import HelpersManagement from '@/components/helpers-management';

export const dynamic = 'force-dynamic';

export default async function HelpersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/');
  }

  return <HelpersManagement />;
}
