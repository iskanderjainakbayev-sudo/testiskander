import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AdminAccess {
  user: User | null;
  allowed: boolean;
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { user: null, allowed: false };

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return { user, allowed: !error && data?.user_id === user.id };
}
