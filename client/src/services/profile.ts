import { supabase } from '../utils/supabase'; // consolidated client

export async function isUsernameAvailable(candidate: string) {
  const v = candidate.trim();
  const okFormat = /^[A-Za-z0-9_]{3,20}$/.test(v) && !/^_|_$/.test(v);
  if (!okFormat) return { ok: false, reason: 'invalid' };

  const { data, error } = await supabase.rpc('username_available', { candidate: v });
  if (error) return { ok: false, reason: 'error' };
  return { ok: !!data };
}

export async function setUsername(username: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { error } = await supabase
    .from('profiles')
    .update({ username: username.trim() })
    .eq('id', user.id);

  if (!error) return { ok: true };
  if ((error as any).code === '23505') return { ok: false, error: 'Username already taken' };
  return { ok: false, error: 'Server error' };
}
