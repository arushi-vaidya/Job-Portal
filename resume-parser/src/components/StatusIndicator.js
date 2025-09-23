import React, { useState, useEffect } from 'react';
import { Database, Cpu, RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import apiService from '../services/api';

const StatusIndicator = ({ isVisible = true, onToggle }) => {
  const [status, setStatus] = useState({
    database: { status: 'unknown', host: '', name: '' },
    ollama: { status: 'unknown', available: false, version: '' },
    server: { uptime: 0, memory: {}, timestamp: '' }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSystemStatus();
      setStatus(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setStatus({
        database: { status: 'error', host: '', name: '' },
        ollama: { status: 'error', available: false, version: '' },
        server: { uptime: 0, memory: {}, timestamp: '' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Update status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="status-icon connected" />;
      case 'disconnected':
        return <XCircle className="status-icon disconnected" />;
      case 'error':
        return <AlertCircle className="status-icon error" />;
      default:
        return <AlertCircle className="status-icon unknown" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return '#10b981';
      case 'disconnected':
        return '#ef4444';
      case 'error':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatMemory = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!isVisible) {
    return (
      <div className="status-indicator-minimal">
        <button 
          className="toggle-status-btn"
          onClick={onToggle}
          title="Show System Status"
        >
          <Eye className="toggle-icon" />
        </button>
      </div>
    );
  }

  return (
    <div className="status-indicator">
      <div className="status-header">
        <h4>System Status</h4>
        <div className="status-actions">
          <button 
            className="refresh-status-btn"
            onClick={fetchStatus}
            disabled={loading}
            title="Refresh Status"
          >
            <RefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
          </button>
          <button 
            className="toggle-status-btn"
            onClick={onToggle}
            title="Hide System Status"
          >
            <EyeOff className="toggle-icon" />
          </button>
        </div>
      </div>
      
      <div className="status-grid">
        {/* Database Status */}
        <div className="status-item">
          <div className="status-label">
            <Database className="status-icon" />
            <span>Database</span>
          </div>
          <div className="status-details">
            <div className="status-value">
              {getStatusIcon(status.database.status)}
              <span style={{ color: getStatusColor(status.database.status) }}>
                {status.database.status}
              </span>
            </div>
            {status.database.host && (
              <div className="status-info">
                <small>{status.database.host}</small>
              </div>
            )}
          </div>
        </div>

        {/* Ollama Status */}
        <div className="status-item">
          <div className="status-label">
            <Cpu className="status-icon" />
            <span>Ollama AI</span>
          </div>
          <div className="status-details">
            <div className="status-value">
              {getStatusIcon(status.ollama.status)}
              <span style={{ color: getStatusColor(status.ollama.status) }}>
                {status.ollama.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {status.ollama.version && (
              <div className="status-info">
                <small>v{status.ollama.version}</small>
              </div>
            )}
          </div>
        </div>

        {/* Server Info */}
        <div className="status-item">
          <div className="status-label">
            <CheckCircle className="status-icon" />
            <span>Server</span>
          </div>
          <div className="status-details">
            <div className="status-value">
              <span style={{ color: '#10b981' }}>
                Running
              </span>
            </div>
            <div className="status-info">
              <small>Uptime: {formatUptime(status.server.uptime)}</small>
              <small>Memory: {formatMemory(status.server.memory.heapUsed || 0)}</small>
            </div>
          </div>
        </div>
      </div>

      {lastUpdate && (
        <div className="status-footer">
          <small>Last updated: {lastUpdate.toLocaleTimeString()}</small>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
