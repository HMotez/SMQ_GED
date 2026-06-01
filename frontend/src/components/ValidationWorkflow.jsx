/**
 * components/ValidationWorkflow.jsx — EF05 + EF06 + EF14
 * RÔLE : Composant de gestion des validations d'un document.
 *        Affiche le résumé des décisions (approuvé/rejeté/en attente)
 *        et le formulaire de création d'une nouvelle validation.
 *        Implémente les contraintes ISO EF05 :
 *          - Validateur ≠ responsable du document
 *          - Signature numérique SHA-256 générée automatiquement
 *          - Validation immuable après création (is_locked = true)
 *        Indique si le document peut passer en statut "Validé".
 *        Utilisé dans DocDetailModal.
 *
 * Sprint 2 - EF05 (Validation Workflow) + EF06 (Role Management) + EF14 (Audit Trail)
 *
 * Component pour afficher et gérer les validations d'un document
 * Applique les contraintes ISO : validator ≠ responsible, signature numérique, immuabilité
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LuClipboardList, LuLock, LuCheck } from 'react-icons/lu';

const ValidationWorkflow = ({ documentId, documentResponsible, userId, userRole }) => {
  const [validations, setValidations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [validators, setValidators] = useState([]);
  const [formData, setFormData] = useState({
    validatorId: '',
    decision: 'EN_ATTENTE',
    comment: '',
  });
  const [creating, setCreating] = useState(false);

  // Fetch validations et summary
  const fetchValidations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/validations/document/${documentId}`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json();
      setValidations(data.validations || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des validations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId, documentId]);

  const fetchValidationSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/validations/document/${documentId}/summary`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching validation summary:', err);
    }
  }, [userId, documentId]);

  useEffect(() => {
    fetchValidations();
    fetchValidationSummary();
  }, [fetchValidations, fetchValidationSummary]);

  const fetchValidators = async () => {
    try {
      const response = await fetch('/api/roles/users', {
        headers: { 'x-user-id': userId },
      });
      const users = await response.json();
      // Filtrer pour avoir que les validateurs et responsables qualité
      const eligibleValidators = users.filter(
        (u) => ['Reviewer', 'Admin'].includes(u.role)
          && u.name !== documentResponsible // ISO Constraint: validator ≠ responsible
      );
      setValidators(eligibleValidators);
    } catch (err) {
      console.error('Error fetching validators:', err);
    }
  };

  const handleCreateValidation = async (e) => {
    e.preventDefault();

    if (!formData.validatorId) {
      setError('Veuillez sélectionner un validateur');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/validations/document/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          validatorId: parseInt(formData.validatorId),
          decision: formData.decision,
          comment: formData.comment,
          signatureData: {
            device: 'WEB_APP',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la création de la validation');
        return;
      }

      const result = await response.json();
      setValidations([...validations, result.validation]);
      setSummary((prev) => ({
        ...prev,
        total_validations: prev.total_validations + 1,
        [result.validation.decision.toLowerCase()]: (prev[result.validation.decision.toLowerCase()] || 0) + 1,
      }));

      // Reset form
      setFormData({ validatorId: '', decision: 'EN_ATTENTE', comment: '' });
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError('Erreur serveur lors de la création de la validation');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const canCreateValidation = ['Reviewer', 'Admin'].includes(userRole);
  const canTransitionToValidated = summary?.can_transition_to_validated;
  const blockReasonEF05 = () => {
    if (!summary) return null;
    if (summary.approvals === 0) {
      return `Pas d'approbation. Statuts actuels : ${summary.rejections} rejet(s), ${summary.pending} en attente.`;
    }
    if (summary.rejections > 0) {
      return `Impossible avec ${summary.rejections} rejet(s). Archiver ou corriger le document.`;
    }
    if (summary.pending > 0) {
      return `${summary.pending} validation(s) en attente. Attendre ou finaliser les validations.`;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🔍 Validations ISO
            
          </h2>
          <p className="text-gray-600 mt-1">
            Workflow de validation ISO avec traçabilité légale
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Validation Summary */}
      {summary && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">📊 Résumé des validations</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.approvals}</div>
              <div className="text-sm text-gray-600">Approuvé(s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.rejections}</div>
              <div className="text-sm text-gray-600">Rejeté(s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.total_validations}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          {/* Transition Status */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            {canTransitionToValidated ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                <span className="text-xl">✅</span>
                <span><strong>Prêt pour transition "Validé"</strong> - Conditions ISO satisfaites</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded">
                <span className="text-xl">❌</span>
                <span><strong>Non prêt pour "Validé":</strong> {blockReasonEF05()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validations List */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3"><LuClipboardList className="inline mr-2" size={18} />Historique des validations</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : validations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
            Aucune validation enregistrée
          </div>
        ) : (
          <div className="space-y-3">
            {validations.map((validation) => (
              <div
                key={validation.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Decision Badge */}
                      <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          validation.decision === 'APPROUVÉ'
                            ? 'bg-green-100 text-green-800'
                            : validation.decision === 'REJETÉ'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {validation.decision}
                      </span>

                      {/* Immutability Badge */}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded flex items-center gap-1">
                        <LuLock size={12} /> Immuable
                      </span>

                      {/* Signed Badge */}
                      {validation.signature_hash && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded flex items-center gap-1">
                          <LuCheck size={12} /> Signé
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">
                      <strong>{validation.validator_name}</strong> —{' '}
                      {new Date(validation.validated_at).toLocaleString('fr-FR')}
                    </p>

                    {validation.comment && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        "{validation.comment}"
                      </p>
                    )}

                    {validation.version_letter && (
                      <p className="text-xs text-gray-500 mt-2">
                        Version: <strong>{validation.version_letter}</strong>
                      </p>
                    )}

                    {validation.signature_hash && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          Voir la signature...
                        </summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                          {validation.signature_hash.substring(0, 64)}...
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Validation Form */}
      {canCreateValidation && (
        <div className="mt-6 pt-6 border-t border-gray-300">
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (!showCreateForm) fetchValidators();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showCreateForm ? '✕' : '+'} {showCreateForm ? 'Annuler' : 'Nouvelle validation'}
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateValidation} className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">📝 Créer une nouvelle validation</h4>

              {/* Validator Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validateur <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.validatorId}
                  onChange={(e) => setFormData({ ...formData, validatorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner un validateur --</option>
                  {validators.length === 0 ? (
                    <option disabled>⚠️ Aucun validateur disponible (validateur ≠ {documentResponsible})</option>
                  ) : (
                    validators.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.role})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ ISO Constraint: Le validateur doit être différent du responsable ({documentResponsible})
                </p>
              </div>

              {/* Decision Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Décision <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {['APPROUVÉ', 'REJETÉ', 'EN_ATTENTE'].map((decision) => (
                    <label key={decision} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value={decision}
                        checked={formData.decision === decision}
                        onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{decision}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Entrez vos commentaires..."
                />
              </div>

              {/* Info Box */}
              <div className="mb-4 p-3 bg-blue-100 text-blue-800 text-sm rounded-lg">
                <strong>ℹ️ Information:</strong> Cette validation sera immuable après création (signature numérique SHA-256)
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {creating ? 'Enregistrement...' : 'Enregistrer la validation'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationWorkflow;
