import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '../login/actions';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/admin/login');

const navLinks = [
{ href: '/admin', label: 'Creatives' },
{ href: '/admin/products', label: 'CHAY SOLE DROPS' },
{ href: '/admin/tasks', label: 'Tasks' },
{ href: '/admin/influencer-marketing', label: 'Influencer Marketing' },
{ href: '/admin/package-tracker', label: 'Package Tracker' },
{ href: '/admin/va-workflows', label: 'VA Workflows' },
];

return (
<div className="min-h-screen bg-white">
<header className="border-b border-rv-gray px-4 py-4">
<div className="max-w-screen-lg mx-auto flex items-center justify-between">
<div className="flex items-center gap-8">
<Link href="/admin" className="text-base font-semibold tracking-tight flex-shrink-0">
CHAY SOLE
</Link>
<nav className="flex items-center gap-4 text-sm overflow-x-auto">
{navLinks.map((link) => (
<Link key={link.href} href={link.href}
className="text-black hover:opacity-60 transition-all duration-250 flex-shrink-0">
{link.label}
</Link>
))}
</nav>
</div>
<form action={signOut}>
<button type="submit" className="text-sm text-rv-tab-inactive hover:text-black transition-all duration-250 flex-shrink-0">
Sign out
</button>
</form>
</div>
</header>
<main className="max-w-screen-lg mx-auto px-4 py-6">
{children}
</main>
</div>
);
}
