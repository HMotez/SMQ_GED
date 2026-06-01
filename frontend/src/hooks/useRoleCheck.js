/**
 * hooks/useRoleCheck.js — EF06
 * RÔLE : Hook React centralisant toute la logique de vérification
 *        des permissions RBAC côté frontend.
 *        Utilisé par DocumentList, Archive, Validations et tous les
 *        composants qui ont besoin de vérifier les droits d'un user.
 *        Fonctions exposées :
 *          canPerformAction(action, document) → boolean
 *          getBlockReason(action, document)   → string | null
 *          canTransitionStatus(from, to)      → boolean
 *          getAllowedTransitions(currentStatus)→ string[]
 *          canArchive(document)               → boolean
 *        La matrice de transitions doit rester synchronisée
 *        avec roleMiddleware.js côté backend.
 *
 * Sprint 2 - EF06 (Role Management)
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
    const effectiveRole = userRole || 'Visiteur';
    // Visiteur (or unauthenticated) can only read
    if (!userRole && action !== 'read') return false;

    // ACTIONS WITHOUT DOCUMENT CONTEXT
    if (!document) {
      switch (action) {
        case 'create':       return ['Admin', 'Ing. Qualité'].includes(effectiveRole);
        case 'read':         return true;
        case 'update':       return ['Admin', 'Ing. Qualité'].includes(effectiveRole);
        case 'validate':     return ['Admin', 'Ing. Qualité', 'Reviewer'].includes(effectiveRole);
        case 'change_status':return ['Admin', 'Ing. Qualité'].includes(effectiveRole);
        case 'comment':      return ['Admin', 'Ing. Qualité', 'Reviewer'].includes(effectiveRole);
        case 'archive':      return ['Admin', 'Ing. Qualité'].includes(effectiveRole);
        default:             return false;
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
        if (isDocumentLocked) return false;
        return ['Admin', 'Ing. Qualité'].includes(effectiveRole);

      case 'delete':
        return effectiveRole === 'Admin' && docStatus === 'Brouillon';

      case 'change_status':
        return ['Admin', 'Ing. Qualité'].includes(effectiveRole);

      case 'validate':
        if (!['Admin', 'Ing. Qualité', 'Reviewer'].includes(effectiveRole)) {
          return false;
        }
        if (currentUser?.name === docResponsible) {
          return false;
        }
        return true;

      case 'comment':
        return ['Admin', 'Ing. Qualité', 'Reviewer'].includes(effectiveRole);

      case 'archive':
        return ['Admin', 'Ing. Qualité'].includes(effectiveRole) && ['Obsolète', 'Archivé'].includes(docStatus);

      case 'distribute':
        if (!['Admin'].includes(effectiveRole)) {
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
        if (!['Admin', 'Ing. Qualité'].includes(userRole)) {
          return `Votre rôle (${userRole || 'Visiteur'}) ne dispose pas des droits de modification. Rôles autorisés : Admin, Ing. Qualité.`;
        }
        return null;

      case 'validate':
        if (!['Admin', 'Ing. Qualité', 'Reviewer'].includes(userRole)) {
          return `Votre rôle (${userRole || 'Visiteur'}) ne dispose pas des droits de validation. Rôles autorisés : Admin, Ing. Qualité, Reviewer.`;
        }
        if (currentUser?.name === docResponsible) {
          return `⛔ Vous ne pouvez pas valider votre propre document. ` +
                 `Le validateur doit être différent du responsable (${docResponsible}).`;
        }
        return null;

      case 'delete':
        if (docStatus !== 'Brouillon') {
          return `⛔ Impossible de supprimer un document en statut "${docStatus}". ` +
                 `Seuls les brouillons peuvent être supprimés.`;
        }
        if (userRole !== 'Admin') {
          return `Votre rôle (${userRole || 'Visiteur'}) ne dispose pas des droits de suppression. Rôle autorisé : Admin uniquement.`;
        }
        return null;

      case 'distribute':
        if (!['Admin'].includes(userRole)) {
          return `Votre rôle (${userRole || 'Visiteur'}) ne dispose pas des droits de distribution. Rôle autorisé : Admin uniquement.`;
        }
        if (docStatus !== 'Validé') {
          return `⛔ Le document doit être au statut "Validé" pour être distribué. ` +
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
  // Vérifie si la transition fromStatus→toStatus est autorisée pour le rôle courant.
  // Ne couvre que les transitions AVANT (forward). Le retour arrière (rollback)
  // est géré séparément dans DocumentList.jsx via canGoBack (Admin/Ing. Qualité uniquement).
  const canTransitionStatus = useCallback((fromStatus, toStatus) => {
    // Machine à états ISO 9001 — transitions autorisées vers l'avant uniquement
    const ALLOWED = {
      "Brouillon":           ["En rédaction"],
      "En rédaction":        ["Appel en relecture"],
      "Appel en relecture":  ["En relecture"],
      "En relecture":        ["En correction", "En validation"],
      "En correction":       ["Appel en relecture"],
      "En validation":       ["Validé"],
      "Validé":              ["Diffusé"],
      "Diffusé":             ["Obsolète"],
      "Obsolète":            ["Archivé"],
      "Archivé":             [],
    };

    const allowed = ALLOWED[fromStatus] || [];
    if (!allowed.includes(toStatus)) return false;

    // Matrice rôle × transition — doit rester synchronisée avec roleMiddleware.js côté backend
    const key = `${fromStatus}→${toStatus}`;
    const TRANSITION_ROLE_MAP = {
      "Brouillon→En rédaction":                   ["Admin", "Ing. Qualité"],
      "En rédaction→Appel en relecture":           ["Admin", "Ing. Qualité"],
      "Appel en relecture→En relecture":           ["Admin", "Ing. Qualité", "Reviewer"],
      "En relecture→En correction":                ["Admin", "Ing. Qualité", "Reviewer"],
      "En relecture→En validation":                ["Admin", "Ing. Qualité", "Reviewer"],
      "En correction→Appel en relecture":          ["Admin", "Ing. Qualité"],
      "En validation→Validé":                      ["Admin", "Ing. Qualité", "Reviewer"],
      "Validé→Diffusé":                             ["Admin", "Ing. Qualité"],
      "Diffusé→Obsolète":                          ["Admin", "Ing. Qualité"],
      "Obsolète→Archivé":                          ["Admin", "Ing. Qualité"],
    };

    const allowedRoles = TRANSITION_ROLE_MAP[key] || [];
    return allowedRoles.includes(userRole);
  }, [userRole]);

  /**
   * Get all allowed transitions from current status for current role
   * @param {string} currentStatus
   * @returns {string[]} Array of allowed destination statuses
   */
  // Retourne la liste des statuts cibles accessibles depuis currentStatus pour le rôle courant
  const getAllowedTransitions = useCallback((currentStatus) => {
    const ALLOWED = {
      "Brouillon":           ["En rédaction"],
      "En rédaction":        ["Appel en relecture"],
      "Appel en relecture":  ["En relecture"],
      "En relecture":        ["En correction", "En validation"],
      "En correction":       ["Appel en relecture"],
      "En validation":       ["Validé"],
      "Validé":              ["Diffusé"],
      "Diffusé":             ["Obsolète"],
      "Obsolète":            ["Archivé"],
      "Archivé":             [],
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
    if (!['Admin', 'Ing. Qualité'].includes(userRole)) {
      return false;
    }
    return ['Obsolète', 'Archivé'].includes(document.status_name);
  }, [userRole]);

  const canComment = useCallback(() => {
    return true; // All authenticated roles can comment
  }, []);

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
