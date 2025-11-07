import React, { useState, useEffect } from 'react';
import { isUsernameAvailable, setUsername } from '../../services/profile';
import { supabase } from '../../lib/supabase';

export default function UsernameForm() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle');

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

  async function onSubmit(e) {
    e.preventDefault();
    const r = await setUsername(value);
    if (!r.ok) setStatus(r.error === 'Username already taken' ? 'taken' : 'invalid');
  }

  return (
    <form onSubmit={onSubmit} className="username-form">
      <div className="input-group">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Choose username"
          autoCapitalize="off"
          autoCorrect="off"
          className="username-input"
        />
        <div className="status-indicator">
          {status === 'checking' && <span className="status checking">Checking…</span>}
          {status === 'ok' && <span className="status available">✅ Available</span>}
          {status === 'taken' && <span className="status taken">❌ Taken</span>}
          {status === 'invalid' && <span className="status invalid">❌ Invalid</span>}
        </div>
      </div>
      <button disabled={status!=='ok'} className="username-save-btn">Save Username</button>
    </form>
  );
}
