import { useState, useEffect } from 'react';
import { isUsernameAvailable, setUsername } from '../services/profile';
import { supabase } from '../supabaseClient';

export default function UsernameForm() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle'|'checking'|'ok'|'invalid'|'taken'>('idle');

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!value) return setStatus('idle');
      const r = await isUsernameAvailable(value);
      if (r.ok) setStatus('ok');
      else if (r.reason === 'invalid') setStatus('invalid');
      else setStatus('taken');
    }, 400);
    return () => clearTimeout(handler);
  }, [value]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = await setUsername(value);
    if (!r.ok) setStatus(r.error === 'Username already taken' ? 'taken' : 'invalid');
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Choose username"
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div>
        {status === 'checking' && 'Checking…'}
        {status === 'ok' && '✅ Available'}
        {status === 'taken' && '❌ Taken'}
        {status === 'invalid' && '❌ Invalid'}
      </div>
      <button disabled={status!=='ok'}>Save</button>
    </form>
  );
}
