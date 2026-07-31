import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Link } from 'wouter';
import { getAdminAccess } from '../../lib/admin';

export function AdminLink({ user }: { user: User }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void getAdminAccess().then((access) => {
      if (active && access.user?.id === user.id) setAllowed(access.allowed);
    });
    return () => {
      active = false;
    };
  }, [user.id]);

  if (!allowed) return null;
  return <Link className="account-play" href="/admin">OPEN OWNER ADMIN PANEL</Link>;
}
