/**
 * AuditTrailViewer.jsx
 * Sprint 2 - EF14 (Historique & Traçabilité ISO)
 * 
 * Affiche la timeline complète d'un document avec validations, statuts et versions
 * Conforme aux exigences légales ISO pour archivage
 */

import React, { useState, useEffect, useCallback } from 'react';

const AuditTrailViewer = ({ documentId, userId }) => {
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const fetchAuditTrail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/audit-trail`, {
        headers: { 'x-user-id': userId },
      });

      if (!response.ok) {
        throw new Error('Document not found');
      }

      const data = await response.json();
      setTimeline(data.timeline || []);
      setSummary(data.audit_summary);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId, documentId]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail, documentId]);

  const getTimelineIcon = (event) => {
    switch (event.type) {
      case 'LOG':
        switch (event.action) {
          case 'CREATE_DOCUMENT':
            return '📄';
          case 'STATUS_CHANGE':
            return '🔄';
          case 'NEW_VERSION':
            return '📝';
          case 'AUTO_ARCHIVE':
            return '📦';
          case 'VALIDATION_EDIT_ATTEMPT_BLOCKED':
            return '⛔';
          case 'VALIDATION_DELETE_ATTEMPT_BLOCKED':
            return '🚫';
          default:
            return '📋';
        }
      case 'VALIDATION':
        return event.decision === 'APPROUVÉ' ? '✅' : event.decision === 'REJETÉ' ? '❌' : '⏳';
      case 'VERSION':
        return '📄';
      default:
        return '📌';
    }
  };

  const getTimelineTitle = (event) => {
    switch (event.type) {
      case 'LOG':
        switch (event.action) {
          case 'CREATE_DOCUMENT':
            return `Document créé par ${event.details?.created_by || 'Système'}`;
          case 'STATUS_CHANGE':
            return `Statut: ${event.details?.from} → ${event.details?.to}`;
          case 'NEW_VERSION':
            return `Nouvelle version: ${event.details?.from} → ${event.details?.to}`;
          case 'AUTO_ARCHIVE':
            return `Archivage automatique: ${event.details?.from} → ${event.details?.to}`;
          case 'VALIDATION_CREATED':
            return `Validation créée par ${event.details?.validator_name}`;
          case 'VALIDATION_EDIT_ATTEMPT_BLOCKED':
            return `⚠️ Tentative d'édition bloquée (ISO Constraint)`;
          case 'VALIDATION_DELETE_ATTEMPT_BLOCKED':
            return `⚠️ Tentative de suppression bloquée (ISO Constraint)`;
          default:
            return event.action;
        }
      case 'VALIDATION':
        return `Validation ${event.decision} par ${event.validator_name}`;
      case 'VERSION':
        return `Version ${event.version_letter}: ${event.file_name}`;
      default:
        return 'Événement';
    }
  };

  const getTimelineDetails = (event) => {
    switch (event.type) {
      case 'LOG':
        return (
          <div className="text-sm text-gray-600 space-y-1">
            {event.details?.doc_code && (
              <p><strong>Document:</strong> {event.details.doc_code}</p>
            )}
            {event.details?.change_summary && (
              <p><strong>Résumé:</strong> {event.details.change_summary}</p>
            )}
            {event.action === 'VALIDATION_EDIT_ATTEMPT_BLOCKED' && (
              <p className="text-red-600">
                <strong>Raison:</strong> {event.details?.reason}
              </p>
            )}
            {event.details?.ISO_transition && (
              <p className="text-blue-600">
                <strong>ℹ️</strong> Transition ISO validée
              </p>
            )}
          </div>
        );
      case 'VALIDATION':
        return (
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Validateur:</strong> {event.validator_name}
            </p>
            {event.comment && (
              <p><strong>Commentaire:</strong> {event.comment}</p>
            )}
            <p>
              <strong>Version:</strong> {event.version}
            </p>
            <div className="flex gap-2 mt-2">
              {event.immutable && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  🔒 Immuable
                </span>
              )}
              {event.signed && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                  ✓ Signé
                </span>
              )}
            </div>
          </div>
        );
      case 'VERSION':
        return (
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Fichier:</strong> {event.file_name}</p>
            <p><strong>Taille:</strong> {(event.file_size / 1024).toFixed(2)} KB</p>
            {event.change_summary && (
              <p><strong>Résumé des changements:</strong> {event.change_summary}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const filteredTimeline = filterType === 'ALL'
    ? timeline
    : timeline.filter((event) => event.type === filterType);

  const eventTypeCounts = {
    LOG: timeline.filter((e) => e.type === 'LOG').length,
    VALIDATION: timeline.filter((e) => e.type === 'VALIDATION').length,
    VERSION: timeline.filter((e) => e.type === 'VERSION').length,
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📊 Audit Trail & Traçabilité ISO
          <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">EF14</span>
        </h2>
        <p className="text-gray-600 mt-1">
          Historique complet à des fins légales et de conformité ISO
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Summary Statistics */}
      {summary && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">📈 Résumé de l'audit</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.total_events}</div>
              <div className="text-sm text-gray-600">Événements total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.logs_count}</div>
              <div className="text-sm text-gray-600">Logs système</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.validations_count}</div>
              <div className="text-sm text-gray-600">Validations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.versions_count}</div>
              <div className="text-sm text-gray-600">Versions</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Tout ({summary?.total_events || 0})
        </button>
        <button
          onClick={() => setFilterType('LOG')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'LOG'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          📋 Logs ({eventTypeCounts.LOG})
        </button>
        <button
          onClick={() => setFilterType('VALIDATION')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'VALIDATION'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          ✅ Validations ({eventTypeCounts.VALIDATION})
        </button>
        <button
          onClick={() => setFilterType('VERSION')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'VERSION'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          📄 Versions ({eventTypeCounts.VERSION})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Chargement de l'historique...</p>
        </div>
      )}

      {/* Timeline */}
      {!loading && filteredTimeline.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 to-purple-300"></div>

          {/* Events */}
          <div className="space-y-4 ml-20">
            {filteredTimeline.map((event, index) => (
              <div key={index} className="relative">
                {/* Timeline dot */}
                <div className="absolute left-[-57px] top-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full"></div>

                {/* Event card */}
                <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTimelineIcon(event)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getTimelineTitle(event)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {event.type === 'VALIDATION' && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          event.decision === 'APPROUVÉ'
                            ? 'bg-green-100 text-green-800'
                            : event.decision === 'REJETÉ'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.decision}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  {getTimelineDetails(event)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No events found */}
      {!loading && filteredTimeline.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">
            Aucun événement trouvé pour ce filtre
          </p>
        </div>
      )}

      {/* ISO Compliance Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <strong>🔐 Conformité ISO:</strong> Cet audit trail est immuable et conservé à des fins
        légales. Les suppressions et modifications sont interdites (EF14 - Traçabilité).
      </div>
    </div>
  );
};

export default AuditTrailViewer;
