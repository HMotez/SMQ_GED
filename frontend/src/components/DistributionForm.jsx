/**
 * components/DistributionForm.jsx
 * Sprint 2 - Carte 3 (Distribution with Proof of Validation)
 * 
 * Form to create distribution records
 * - Only available if document is in "Validé" status
 * - Requires at least one APPROUVÉ validation
 * - Records recipients and distribution method
 */

import React, { useState } from 'react';
import axios from 'axios';
import { AccessDeniedMessage } from './RoleBasedAccess';

const API = "http://localhost:4000/api";

export function DistributionForm({ document, onSuccess, onClose }) {
  const [recipients, setRecipients] = useState('');
  const [format, setFormat] = useState('PDF');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check prerequisites
  const canDistribute = document?.status_name === 'Validé';
  const distributionError = !canDistribute
    ? `⛔ ISO EF14: La distribution nécessite le statut "Validé". Statut actuel: "${document?.status_name || '—'}"`
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recipients.trim()) {
      setError('Veuillez spécifier au moins un destinataire.');
      return;
    }

    if (!canDistribute) {
      setError(distributionError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API}/distributions/document/${document.id}`,
        {
          recipients: recipients.trim(),
          distribution_format: format,
          comments: comments.trim(),
        },
        {
          headers: {
            'x-user-id': localStorage.getItem('userId') || '',
          },
        }
      );

      setSuccess(true);
      setRecipients('');
      setComments('');
      setFormat('PDF');

      // Notify parent
      if (onSuccess) {
        onSuccess(response.data.distribution);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Distribution error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Erreur lors de la création de la distribution.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 8,
      padding: 16,
    }}>
      <h3 style={{ margin: '0 0 12px', color: '#e6edf3', fontSize: 14, fontWeight: 600 }}>
        📢 Nouvelle Distribution
      </h3>

      {success && (
        <div style={{
          background: '#04260f',
          border: '1px solid #196c2e',
          borderRadius: 6,
          padding: 12,
          marginBottom: 12,
        }}>
          <p style={{ color: '#3fb950', margin: 0, fontSize: 12, fontWeight: 600 }}>
            ✅ Distribution enregistrée avec succès (ISO EF14 conforme)
          </p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#3d1a1a',
          border: '1px solid #6e2020',
          borderRadius: 6,
          padding: 12,
          marginBottom: 12,
        }}>
          <p style={{ color: '#ff7b72', margin: 0, fontSize: 12 }}>
            {error}
          </p>
        </div>
      )}

      {!canDistribute && (
        <div style={{
          background: '#3d1a1a',
          border: '1px solid #6e2020',
          borderRadius: 6,
          padding: 12,
          marginBottom: 12,
        }}>
          <p style={{ color: '#ff7b72', margin: 0, fontSize: 12, fontWeight: 600 }}>
            🔒 Distribution bloquée
          </p>
          <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: 11 }}>
            Le document doit être au statut "Validé" pour être distribué.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ opacity: canDistribute ? 1 : 0.6, pointerEvents: canDistribute ? 'auto' : 'none' }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block',
            margin: '0 0 6px',
            color: '#e6edf3',
            fontSize: 12,
            fontWeight: 600,
          }}>
            📧 Destinataires
          </label>
          <input
            type="text"
            placeholder="user1@company.com, user2@company.com, ..."
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            disabled={!canDistribute || loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#e6edf3',
              fontSize: 12,
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              opacity: canDistribute ? 1 : 0.6,
            }}
          />
          <p style={{ margin: '4px 0 0', color: '#8b949e', fontSize: 11 }}>
            Adresses e-mail séparées par des virgules
          </p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block',
            margin: '0 0 6px',
            color: '#e6edf3',
            fontSize: 12,
            fontWeight: 600,
          }}>
            📄 Format de Distribution
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={!canDistribute || loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#e6edf3',
              fontSize: 12,
              boxSizing: 'border-box',
              opacity: canDistribute ? 1 : 0.6,
              cursor: canDistribute ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="PDF">📄 PDF</option>
            <option value="DOCX">📝 Word (DOCX)</option>
            <option value="EMAIL">📧 Email</option>
            <option value="LINK">🔗 Link partagé</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block',
            margin: '0 0 6px',
            color: '#e6edf3',
            fontSize: 12,
            fontWeight: 600,
          }}>
            💬 Commentaires (optionnel)
          </label>
          <textarea
            placeholder="Raison de la distribution, commentaires..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={!canDistribute || loading}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#e6edf3',
              fontSize: 12,
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              resize: 'vertical',
              opacity: canDistribute ? 1 : 0.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={!canDistribute || loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: canDistribute ? '#238636' : '#3d3d3d',
              border: 'none',
              borderRadius: 6,
              color: canDistribute ? '#fff' : '#6e7681',
              fontSize: 13,
              fontWeight: 600,
              cursor: canDistribute && !loading ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (canDistribute && !loading) e.target.style.background = '#2ea043';
            }}
            onMouseLeave={(e) => {
              if (canDistribute && !loading) e.target.style.background = '#238636';
            }}
          >
            {loading ? '⏳ Distribution...' : '📢 Distribuer'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 16px',
                background: '#21262d',
                border: '1px solid #30363d',
                borderRadius: 6,
                color: '#8b949e',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = '#30363d';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = '#21262d';
              }}
            >
              Annuler
            </button>
          )}
        </div>

        {/* Compliance Notice */}
        <div style={{
          marginTop: 12,
          padding: 8,
          background: '#0d1117',
          borderRadius: 4,
          borderLeft: '3px solid #3fb950',
        }}>
          <p style={{
            margin: 0,
            color: '#8b949e',
            fontSize: 10,
            lineHeight: 1.4,
          }}>
            🔐 <strong>ISO EF14 Compliance:</strong> Cette distribution crée une preuve immuable avec validation et signature numérique.
            Elle sera enregistrée dans l'audit trail permanent.
          </p>
        </div>
      </form>
    </div>
  );
}

export default DistributionForm;
