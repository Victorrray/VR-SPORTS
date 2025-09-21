// Debug component for real-time monitoring
import React, { useState, useEffect } from 'react';
import { Bug, Activity, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { DebugLogger, APIErrorTracker, UserActionTracker, NetworkMonitor } from '../utils/debugUtils';

export default function DebugPanel({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isOnline, setIsOnline] = useState(NetworkMonitor.isOnline);
  const [userActions, setUserActions] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Capture console logs
    const originalConsole = { ...console };

    const logCapture = (level) => (message, ...args) => {
      const logEntry = {
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        data: args.length > 0 ? args : null,
        timestamp: new Date().toISOString(),
        component: 'CONSOLE'
      };

      setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs

      // Call original console method
      originalConsole[level](message, ...args);
    };

    // Override console methods
    console.log = logCapture('log');
    console.error = logCapture('error');
    console.warn = logCapture('warn');
    console.debug = logCapture('debug');

    // Network monitoring
    const networkHandler = (online) => {
      setIsOnline(online);
      const status = online ? 'ONLINE' : 'OFFLINE';
      DebugLogger.info('NETWORK', `Status changed to ${status}`);
    };

    const unsubscribe = NetworkMonitor.onStatusChange(networkHandler);

    // Cleanup
    return () => {
      Object.assign(console, originalConsole);
      unsubscribe();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setErrors(APIErrorTracker.getSummary());
      setUserActions(UserActionTracker.actions.slice(-10)); // Last 10 actions
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearLogs = () => setLogs([]);
  const clearErrors = () => {
    APIErrorTracker.errors.clear();
    setErrors([]);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: '#1a1b23',
      borderLeft: '2px solid #3b82f6',
      zIndex: 9999,
      overflow: 'hidden',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <div style={{
        padding: '16px',
        background: '#2d3748',
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bug size={16} />
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '14px' }}>Debug Panel</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            background: isOnline ? '#48bb78' : '#f56565',
            color: 'white'
          }}>
            {isOnline ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a0aec0',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <XCircle size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #4a5568' }}>
        <button
          onClick={() => document.getElementById('logs-tab').scrollIntoView()}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: '#2d3748',
            border: 'none',
            color: '#ffffff',
            borderBottom: '2px solid #3b82f6'
          }}
        >
          Logs ({logs.length})
        </button>
        <button
          onClick={() => document.getElementById('errors-tab').scrollIntoView()}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: '#2d3748',
            border: 'none',
            color: '#ffffff'
          }}
        >
          Errors ({errors.length})
        </button>
        <button
          onClick={() => document.getElementById('actions-tab').scrollIntoView()}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: '#2d3748',
            border: 'none',
            color: '#ffffff'
          }}
        >
          Actions ({userActions.length})
        </button>
      </div>

      <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
        <div id="logs-tab" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '12px' }}>Console Logs</h4>
            <button onClick={clearLogs} style={{ fontSize: '10px', padding: '2px 8px' }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                marginBottom: '4px',
                padding: '4px',
                background: log.level === 'ERROR' ? '#2d1b20' : log.level === 'WARN' ? '#2d2a1b' : '#1a202c',
                borderLeft: `3px solid ${
                  log.level === 'ERROR' ? '#f56565' :
                  log.level === 'WARN' ? '#ed8936' :
                  log.level === 'DEBUG' ? '#9f7aea' : '#4299e1'
                }`,
                borderRadius: '2px',
                fontSize: '10px',
                color: '#e2e8f0'
              }}>
                <div style={{ color: '#a0aec0', marginBottom: '2px' }}>
                  {log.timestamp.split('T')[1].split('.')[0]} [{log.level}] {log.component}
                </div>
                <div style={{ color: '#ffffff', wordBreak: 'break-all' }}>
                  {log.message}
                </div>
                {log.data && (
                  <div style={{ color: '#68d391', marginTop: '4px', fontSize: '9px' }}>
                    {Array.isArray(log.data) ? log.data.join(', ') : String(log.data)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div id="errors-tab" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '12px' }}>API Errors</h4>
            <button onClick={clearErrors} style={{ fontSize: '10px', padding: '2px 8px' }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {errors.map((error, i) => (
              <div key={i} style={{
                marginBottom: '8px',
                padding: '8px',
                background: '#2d1b20',
                borderLeft: '3px solid #f56565',
                borderRadius: '2px'
              }}>
                <div style={{ color: '#f56565', fontSize: '11px', fontWeight: 'bold' }}>
                  {error.key.split('-')[0]}
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '10px', marginTop: '4px' }}>
                  Count: {error.count} | First: {error.firstSeen.toLocaleTimeString()}
                </div>
                <div style={{ color: '#a0aec0', fontSize: '9px', marginTop: '2px' }}>
                  {error.key.split('-').slice(1).join('-')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="actions-tab" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, color: '#ffffff', fontSize: '12px', marginBottom: '8px' }}>
            Recent User Actions
          </h4>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {userActions.map((action, i) => (
              <div key={i} style={{
                marginBottom: '4px',
                padding: '4px',
                background: '#1a202c',
                borderRadius: '2px',
                fontSize: '10px'
              }}>
                <div style={{ color: '#4299e1', marginBottom: '2px' }}>
                  {action.timestamp.split('T')[1].split('.')[0]}
                </div>
                <div style={{ color: '#68d391' }}>
                  {action.action}
                </div>
                {action.userId && (
                  <div style={{ color: '#a0aec0' }}>
                    User: {action.userId}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
