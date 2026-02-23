/**
 * components/RoleBasedAccess.jsx
 * Sprint 2 - EF06 (Role Management)
 * 
 * Component to display and enforce role-based access control
 */

import React from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { useUser } from '../context/UserContext';
import useRoleCheck from '../hooks/useRoleCheck';

/**
 * AccessDeniedMessage
 * Shows why user doesn't have access
 */
export function AccessDeniedMessage({ reason }) {
  const { userRole } = useUser();

  if (!reason) return null;

  return (
    <div style={{
      background: '#3d1a1a',
      border: '1px solid #6e2020',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <p style={{ color: '#ff7b72', fontWeight: 600, margin: '0 0 8px' }}>
        Accès refusé
      </p>
      <p style={{ color: '#8b949e', fontSize: 13, margin: 0 }}>
        {reason}
      </p>
      {userRole && (
        <p style={{ color: '#6e7681', fontSize: 12, margin: '8px 0 0', fontStyle: 'italic' }}>
          Rôle actuel: <strong>{userRole}</strong>
        </p>
      )}
    </div>
  );
}

/**
 * RoleInfoBadge
 * Shows current user role with color coding
 */
export function RoleInfoBadge() {
  const { currentUser, userRole } = useUser();

  const ROLE_STYLES = {
    "Admin GED": { bg: "#3d1a1a", color: "#f78166", border: "#6e2020" },
    "Responsable Qualité": { bg: "#1c1a00", color: "#d29922", border: "#6e5c1e" },
    "Rédacteur": { bg: "#1a2238", color: "#79c0ff", border: "#388bfd" },
    "Validateur": { bg: "#04260f", color: "#3fb950", border: "#196c2e" },
    "Lecteur": { bg: "#1c2128", color: "#8b949e", border: "#30363d" },
  };

  const style = ROLE_STYLES[userRole] || {
    bg: "#161b22",
    color: "#484f58",
    border: "#30363d",
  };

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 6,
      padding: '8px 12px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ width: 12, height: 12, display: 'inline-block', background: style.color, borderRadius: 6 }} />
      <div>
        <p style={{ color: '#6e7681', fontSize: 11, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          User
        </p>
        <p style={{ color: style.color, fontSize: 12, margin: 0, fontWeight: 600 }}>
          {currentUser?.name || 'Non sélectionné'}
        </p>
        <p style={{ color: style.color, fontSize: 11, margin: '2px 0 0', opacity: 0.8 }}>
          {userRole || 'N/A'}
        </p>
      </div>
    </div>
  );
}

/**
 * DocumentAccessStatus
 * Shows what the current user can do with a document
 */
export function DocumentAccessStatus({ document }) {
  const { canPerformAction } = useRoleCheck();

  const actions = [
    { label: 'Lire', permission: 'read' },
    { label: 'Modifier', permission: 'update' },
    { label: 'Valider', permission: 'validate' },
    { label: 'Changer statut', permission: 'change_status' },
    { label: 'Commenter', permission: 'comment' },
    { label: 'Archiver', permission: 'archive' },
  ];

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #21262d',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    }}>
      <p style={{ color: '#8b949e', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 600 }}>
        Vos permissions sur ce document
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {actions.map(({ label, permission }) => {
          const allowed = canPerformAction(permission, document);
          return (
            <span
              key={permission}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                background: allowed ? '#03803d' : '#3d1a1a',
                color: allowed ? '#3fb950' : '#ff7b72',
                border: `1px solid ${allowed ? '#196c2e' : '#6e2020'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {allowed ? <LuCheck size={14} /> : <LuX size={14} />} {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ConditionalAccess
 * Wrapper component that conditionally renders content based on role
 */
export function ConditionalAccess({
  action,
  document,
  children,
  fallback = null,
  showReason = true,
}) {
  const { canPerformAction, getBlockReason } = useRoleCheck();
  const allowed = canPerformAction(action, document);
  const reason = !allowed ? getBlockReason(action, document) : null;

  if (allowed) {
    return children;
  }

  return (
    <>
      {showReason && <AccessDeniedMessage action={action} document={document} reason={reason} />}
      {fallback}
    </>
  );
}

/**
 * ActionButton
 * Button that respects role-based access control
 */
export function ActionButton({
  action,
  document,
  onClick,
  children,
  variant = 'primary',
  ...props
}) {
  const { canPerformAction, getBlockReason } = useRoleCheck();
  const allowed = canPerformAction(action, document);
  const reason = !allowed ? getBlockReason(action, document) : null;

  const styles = {
    primary: {
      bg: '#238636',
      bgHover: '#2ea043',
      bgDisabled: '#3d3d3d',
      color: '#fff',
      colorDisabled: '#6e7681',
    },
    danger: {
      bg: '#da3633',
      bgHover: '#f85149',
      bgDisabled: '#3d3d3d',
      color: '#fff',
      colorDisabled: '#6e7681',
    },
  };

  const style = styles[variant];

  return (
    <button
      onClick={onClick}
      disabled={!allowed}
      title={reason || undefined}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: 'none',
        fontWeight: 600,
        fontSize: 14,
        cursor: allowed ? 'pointer' : 'not-allowed',
        background: allowed ? style.bg : style.bgDisabled,
        color: allowed ? style.color : style.colorDisabled,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (allowed) e.target.style.background = style.bgHover;
      }}
      onMouseLeave={(e) => {
        if (allowed) e.target.style.background = style.bg;
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * RolePermissionTag
 * Displays which roles can perform an action
 */
export function RolePermissionTag({ action }) {

  const ROLE_REQUIREMENTS = {
    create: {
      label: 'Créer document',
      roles: ['Admin GED', 'Responsable Qualité', 'Rédacteur'],
    },
    update: {
      label: 'Modifier document',
      roles: ['Admin GED', 'Responsable Qualité', 'Rédacteur'],
    },
    validate: {
      label: 'Valider document',
      roles: ['Admin GED', 'Responsable Qualité', 'Validateur'],
      note: '⚠️ Validateur ≠ Responsable (ISO EF05)',
    },
    change_status: {
      label: 'Changer le statut',
      roles: ['Admin GED', 'Responsable Qualité', 'Rédacteur', 'Validateur'],
    },
    delete: {
      label: 'Supprimer',
      roles: ['Admin GED'],
      note: '⚠️ Brouillons uniquement',
    },
  };

  const info = ROLE_REQUIREMENTS[action];
  if (!info) return null;

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #21262d',
      borderRadius: 6,
      padding: 8,
      marginBottom: 8,
    }}>
      <p style={{ color: '#8b949e', fontSize: 11, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>
        👥 {info.label}: Rôles autorisés
      </p>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {info.roles.map((role) => (
          <span
            key={role}
            style={{
              background: '#1f6feb',
              color: '#e6edf3',
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {role}
          </span>
        ))}
      </div>
      {info.note && (
        <p style={{ color: '#d29922', fontSize: 11, margin: '4px 0 0', fontStyle: 'italic' }}>
          {info.note}
        </p>
      )}
    </div>
  );
}

export default {
  AccessDeniedMessage,
  RoleInfoBadge,
  DocumentAccessStatus,
  ConditionalAccess,
  ActionButton,
  RolePermissionTag,
};
