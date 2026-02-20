/**
 * hooks/useRoleCheck.js
 * Sprint 2 - EF06 (Role Management)
 * 
 * Advanced role checking utilities for document-specific permissions
 */

import { useUser } from '../context/UserContext';
import { useCallback } from 'react';

const LOCKED_STATUSES = ['Validé', 'Diffusé', 'Obsolète', 'Archivé'];

export function useRoleCheck() {
  const { userRole, currentUser } = useUser();

  /**
   * Check if user can perform action on a specific document
   * @param {string} action - 'create', 'read', 'update', 'delete', 'validate', 'change_status'
   * @param {object} document - Document object or null for creation
   * @returns {boolean}
   */
  const canPerformAction = useCallback((action, document = null) => {
    if (!userRole) return false;

    // ACTIONS WITHOUT DOCUMENT CONTEXT
    if (!document) {
      switch (action) {
        case 'create':
          return ['Admin GED', 'Responsable Qualité', 'Rédacteur'].includes(userRole);
        case 'read':
          return true; // Everyone can read
        default:
          return false;
      }
    }

    // DOCUMENT-SPECIFIC ACTIONS
    const docStatus = document.status_name;
    const docResponsible = document.responsible;
    const isDocumentLocked = LOCKED_STATUSES.includes(docStatus);

    switch (action) {
      case 'read':
        return true; // Everyone can read

      case 'update':
        // Cannot update locked documents
        if (isDocumentLocked) return false;
        // Only Rédacteur, Responsable Qualité, Admin GED can update
        return ['Admin GED', 'Responsable Qualité', 'Rédacteur'].includes(userRole);

      case 'delete':
        // Only Admin GED can delete (and only drafts)
        return userRole === 'Admin GED' && docStatus === 'Brouillon';

      case 'change_status':
        // Most roles can change status (with constraints)
        return ['Admin GED', 'Responsable Qualité', 'Rédacteur', 'Validateur'].includes(userRole);

      case 'validate':
        // Only Validateur, Responsable Qualité, Admin GED can validate
        // And they cannot be the document responsible (ISO constraint EF05)
        if (!['Admin GED', 'Responsable Qualité', 'Validateur'].includes(userRole)) {
          return false;
        }
        // CONSTRAINT EF05: Validator ≠ Responsible
        if (currentUser?.name === docResponsible) {
          return false;
        }
        return true;

      case 'comment':
        // Lecteur and Relecteur can comment
        return ['Lecteur', 'Relecteur', 'Admin GED', 'Responsable Qualité'].includes(userRole);

      case 'distribute':
        // Only Admin GED and Responsable Qualité can distribute (ISO EF14)
        if (!['Admin GED', 'Responsable Qualité'].includes(userRole)) {
          return false;
        }
        // Can only distribute if status is "Validé" (ISO EF14 requirement)
        return docStatus === 'Validé';

      default:
        return false;
    }
  }, [userRole, currentUser]);

  /**
   * Get detailed reason why action is blocked
   * @param {string} action
   * @param {object} document
   * @returns {string|null}
   */
  const getBlockReason = useCallback((action, document) => {
    if (!document) return null;

    const docStatus = document.status_name;
    const docResponsible = document.responsible;

    switch (action) {
      case 'update':
        if (LOCKED_STATUSES.includes(docStatus)) {
          return `⛔ Impossible de modifier: le document est en statut "${docStatus}". ` +
                 `Seuls les documents en Brouillon, En rédaction, En relecture ou En validation peuvent être modifiés.`;
        }
        if (!['Admin GED', 'Responsable Qualité', 'Rédacteur'].includes(userRole)) {
          return `⛔ Votre rôle (${userRole}) ne peut pas modifier les documents. ` +
                 `Seuls: Admin GED, Responsable Qualité, Rédacteur.`;
        }
        return null;

      case 'validate':
        if (!['Admin GED', 'Responsable Qualité', 'Validateur'].includes(userRole)) {
          return `⛔ Votre rôle (${userRole}) ne peut pas valider. ` +
                 `Seuls: Admin GED, Responsable Qualité, Validateur.`;
        }
        if (currentUser?.name === docResponsible) {
          return `⛔ ISO Constraint EF05: Vous ne pouvez pas valider votre propre document. ` +
                 `Le validateur doit être différent du responsable (${docResponsible}).`;
        }
        return null;

      case 'delete':
        if (docStatus !== 'Brouillon') {
          return `⛔ Impossible de supprimer un document en statut "${docStatus}". ` +
                 `Seuls les brouillons peuvent être supprimés.`;
        }
        if (userRole !== 'Admin GED') {
          return `⛔ Seul Admin GED peut supprimer des documents.`;
        }
        return null;

      case 'distribute':
        if (!['Admin GED', 'Responsable Qualité'].includes(userRole)) {
          return `⛔ ISO EF14: Seuls Admin GED et Responsable Qualité peuvent distribuer. ` +
                 `Votre rôle: ${userRole}.`;
        }
        if (docStatus !== 'Validé') {
          return `⛔ ISO EF14: Le document doit être au statut "Validé" pour être distribué. ` +
                 `Statut actuel: "${docStatus}".`;
        }
        return null;

      default:
        return null;
    }
  }, [userRole, currentUser]);

  /**
   * Check if current user can transition document to a new status
   * @param {string} fromStatus
   * @param {string} toStatus
   * @returns {boolean}
   */
  const canTransitionStatus = useCallback((fromStatus, toStatus) => {
    const ALLOWED = {
      "Brouillon": ["En rédaction"],
      "En rédaction": ["En relecture"],
      "En relecture": ["En validation"],
      "En validation": ["Validé"],
      "Validé": ["Diffusé"],
      "Diffusé": ["Obsolète"],
      "Obsolète": ["Archivé"],
      "Archivé": [],
    };

    const allowed = ALLOWED[fromStatus] || [];
    if (!allowed.includes(toStatus)) return false;

    // Check role permissions for this specific transition
    const key = `${fromStatus}→${toStatus}`;
    const TRANSITION_ROLE_MAP = {
      "Brouillon→En rédaction": ["Admin GED", "Responsable Qualité", "Rédacteur"],
      "En rédaction→En relecture": ["Admin GED", "Responsable Qualité", "Rédacteur"],
      "En relecture→En validation": ["Admin GED", "Responsable Qualité", "Rédacteur"],
      "En validation→Validé": ["Admin GED", "Responsable Qualité", "Validateur"],
      "Validé→Diffusé": ["Admin GED", "Responsable Qualité"],
      "Diffusé→Obsolète": ["Admin GED", "Responsable Qualité"],
      "Obsolète→Archivé": ["Admin GED", "Responsable Qualité"],
    };

    const allowedRoles = TRANSITION_ROLE_MAP[key] || [];
    return allowedRoles.includes(userRole);
  }, [userRole]);

  /**
   * Get all allowed transitions from current status for current role
   * @param {string} currentStatus
   * @returns {string[]} Array of allowed destination statuses
   */
  const getAllowedTransitions = useCallback((currentStatus) => {
    const ALLOWED = {
      "Brouillon": ["En rédaction"],
      "En rédaction": ["En relecture"],
      "En relecture": ["En validation"],
      "En validation": ["Validé"],
      "Validé": ["Diffusé"],
      "Diffusé": ["Obsolète"],
      "Obsolète": ["Archivé"],
      "Archivé": [],
    };

    const possibilities = ALLOWED[currentStatus] || [];
    return possibilities.filter(dest => canTransitionStatus(currentStatus, dest));
  }, [canTransitionStatus]);

  /**
   * Check if user is the document responsible
   * @param {object} document
   * @returns {boolean}
   */
  const isDocumentResponsible = useCallback((document) => {
    return currentUser?.name === document.responsible;
  }, [currentUser]);

  /**
   * Check if user can ARCHIVE a document (automatic or manual)
   * @param {object} document
   * @returns {boolean}
   */
  const canArchive = useCallback((document) => {
    if (!['Admin GED', 'Responsable Qualité'].includes(userRole)) {
      return false;
    }
    // Can only archive if in Obsolète or Archivé status
    return ['Obsolète', 'Archivé'].includes(document.status_name);
  }, [userRole]);

  /**
   * Check if user can COMMENT on a document
   * (All roles can comment, but this is for consistency)
   * @returns {boolean}
   */
  const canComment = useCallback(() => {
    // Relecteur and Lecteur roles are for review/comments
    return ['Lecteur', 'Relecteur', 'Admin GED', 'Responsable Qualité'].includes(userRole);
  }, [userRole]);

  return {
    canPerformAction,
    getBlockReason,
    canTransitionStatus,
    getAllowedTransitions,
    isDocumentResponsible,
    canArchive,
    canComment,
    userRole,
  };
}

export default useRoleCheck;
