import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../lib/apiBase';

export default function PropsDebugCard({ url }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const fullUrl = url.startsWith('http') ? url : `${getApiBase()}${url}`;

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    
    fetch(fullUrl, { credentials: 'include' })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json?.error || r.statusText || 'Request failed');
        return json;
      })
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [fullUrl]);

  return (
    <div className="rounded-xl border border-white/10 p-3 text-xs bg-gray-900/50">
      <div className="font-medium mb-2">API Debug Card</div>
      
      <div className="space-y-1 opacity-80">
        <div><strong>URL:</strong> {fullUrl}</div>
        <div><strong>Status:</strong> {loading ? 'Loading...' : error ? `Error: ${error}` : 'Success'}</div>
        
        {data && (
          <>
            <div><strong>Keys:</strong> {Object.keys(data).join(', ')}</div>
            <div><strong>__nonEmpty:</strong> {String(data.__nonEmpty)}</div>
            <div><strong>Data length:</strong> {Array.isArray(data.data) ? data.data.length : 'N/A'}</div>
            <div><strong>Books:</strong> {Array.isArray(data.books) ? data.books.join(', ') : 'N/A'}</div>
          </>
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          {collapsed ? 'Show JSON' : 'Hide JSON'}
        </button>
        
        {!collapsed && (
          <div className="mt-2 max-h-40 overflow-auto bg-black/30 p-2 rounded">
            <pre className="text-xs">{JSON.stringify(data || error, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
