import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import type { AdminAccess } from '../lib/admin';
import { getAdminAccess } from '../lib/admin';
import { AdminCreatureTable } from '../components/admin/AdminCreatureTable';
import { supabase } from '../lib/supabase';
import './AdminPage.css';

export function AdminPage() {
  const [access, setAccess] = useState<AdminAccess | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => void getAdminAccess().then((result) => {
      if (active) setAccess(result);
    });
    refresh();
    const { data } = supabase.auth.onAuthStateChange(refresh);
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!access) return <main className="admin-gate"><p>VERIFYING OWNER ACCESS…</p></main>;
  if (!access.user) {
    return (
      <main className="admin-gate">
        <small>OWNER CONSOLE</small>
        <h1>Sign in required</h1>
        <p>This route is protected by your Supabase account.</p>
        <Link href="/login">SIGN IN</Link>
      </main>
    );
  }
  if (!access.allowed) {
    return (
      <main className="admin-gate denied">
        <small>ACCESS DENIED</small>
        <h1>Owner only</h1>
        <p>{access.user.email} does not have permission to use this panel.</p>
        <Link href="/game">RETURN TO GAME</Link>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <nav><div><small>WAYFARER CONTROL</small><strong>OWNER ADMIN</strong></div><Link href="/game">← RETURN TO GAME</Link></nav>
      <header className="admin-hero">
        <div><small>AUTHENTICATED OWNER</small><h1>Ecosystem Command</h1><p>{access.user.email}</p></div>
        <section><span>SPECIES<strong>70</strong></span><span>AI STATES<strong>17</strong></span><span>ACCESS<strong>PRIVATE</strong></span></section>
      </header>
      <AdminCreatureTable />
    </main>
  );
}
