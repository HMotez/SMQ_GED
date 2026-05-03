/**
 * components/RoleBasedAccess.jsx
 * Sprint 2 - EF06 (Role Management)
 * 
 * Component to display and enforce role-based access control
 */

import React from 'react';
import { LuCheck, LuX, LuShieldCheck, LuInfo, LuUser, LuUserX } from 'react-icons/lu';
import { useUser, ROLE_PERMISSIONS } from '../context/UserContext';
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
      background: '#2a1215',
      border: '1px solid #5c2020',
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 16,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: '#3d1a1a',
        border: '1px solid #6e2020',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      }}>
        <LuX size={16} color="#ff7b72" />
      </div>
      <div>
        <p style={{ color: '#ff7b72', fontWeight: 700, margin: '0 0 4px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Accès refusé
        </p>
        <p style={{ color: '#cda0a0', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
          {reason}
        </p>
        <p style={{ color: '#6e7681', fontSize: 11, margin: '6px 0 0' }}>
          Rôle actuel :{' '}
          <span style={{
            display: 'inline-block',
            padding: '1px 7px',
            borderRadius: 4,
            background: '#3d1a1a',
            border: '1px solid #6e2020',
            color: '#ff7b72',
            fontWeight: 600,
            fontSize: 10,
            textTransform: 'uppercase',
          }}>
            {userRole || 'Visiteur'}
          </span>
        </p>
      </div>
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
    "Admin":        { bg: "#3d1a1a", color: "#f87171", border: "#6e2020" },
    "Ing. Qualité": { bg: "#0d2b2b", color: "#2dd4bf", border: "#1d5c5c" },
    "Reviewer":     { bg: "#04260f", color: "#4ade80", border: "#196c2e" },
  };

  const isGuest = !currentUser;
  const style = ROLE_STYLES[userRole] || {
    bg: "#1a1a2e",
    color: "#6b7280",
    border: "#2d2d44",
  };

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 8,
      padding: '10px 14px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: isGuest ? '#21262d' : style.color + '22',
        border: `1px solid ${style.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isGuest
          ? <LuUserX size={18} color="#6b7280" />
          : <LuUser size={18} color={style.color} />
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: '#6e7681', fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
          Utilisateur connecté
        </p>
        <p style={{ color: isGuest ? '#6b7280' : style.color, fontSize: 13, margin: '2px 0 0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentUser?.name || 'Visiteur'}
        </p>
        <span style={{
          display: 'inline-block',
          marginTop: 4,
          padding: '1px 7px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          background: isGuest ? '#21262d' : style.color + '22',
          color: isGuest ? '#6b7280' : style.color,
          border: `1px solid ${style.border}`,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          {userRole || 'Accès non défini'}
        </span>
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
 * DocumentRolePermissionsMatrix
 * Shows what EACH ROLE can do with this document
 */
export function DocumentRolePermissionsMatrix({ document }) {
  const ROLES = [
    'Admin',
    'Ing. Qualité',
    'Reviewer',
    'Visiteur',
  ];

  // Truth table mirroring useRoleCheck.js canPerformAction (without document context)
  const ACTIONS = [
    { label: 'Lire',               allowed: { 'Admin': true,  'Ing. Qualité': true,  'Reviewer': true,  'Visiteur': true  } },
    { label: 'Modifier',           allowed: { 'Admin': true,  'Ing. Qualité': true,  'Reviewer': false, 'Visiteur': false } },
    { label: 'Valider',            allowed: { 'Admin': true,  'Ing. Qualité': true,  'Reviewer': true,  'Visiteur': false } },
    { label: 'Changer statut',     allowed: { 'Admin': true,  'Ing. Qualité': true,  'Reviewer': false, 'Visiteur': false } },
    { label: 'Commenter',          allowed: { 'Admin': true,  'Ing. Qualité': true,  'Reviewer': true,  'Visiteur': false } },
    { label: 'Archiver',           allowed: { 'Admin': true,  'Ing. Qualité': true,  'Reviewer': false, 'Visiteur': false } },
    { label: 'Gérer utilisateurs', allowed: { 'Admin': true,  'Ing. Qualité': false, 'Reviewer': false, 'Visiteur': false } },
  ];

  const canRolePerformAction = (role, action) => action.allowed[role] ?? false;

  const getRoleColor = (role) => {
    const colors = {
      'Admin':        '#f87171',
      'Ing. Qualité': '#2dd4bf',
      'Reviewer':     '#4ade80',
      'Visiteur':     '#a78bfa',
    };
    return colors[role] || '#8b949e';
  };

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #21262d',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      overflowX: 'auto',
    }}>
      <p style={{ color: '#8b949e', fontSize: 12, margin: '0 0 12px', textTransform: 'uppercase', fontWeight: 600 }}>
        <LuShieldCheck size={13} style={{marginRight:6,verticalAlign:"middle"}} /> Matrice de permissions par rôle
      </p>

      <div style={{ display: 'block', overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #21262d' }}>
              <th style={{
                padding: '8px',
                textAlign: 'left',
                color: '#8b949e',
                fontWeight: 600,
                borderRight: '1px solid #21262d',
              }}>
                Rôle
              </th>
              {ACTIONS.map(({ label }) => (
                <th
                  key={label}
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    color: '#8b949e',
                    fontWeight: 600,
                    borderRight: '1px solid #21262d',
                    minWidth: 80,
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role} style={{ borderBottom: '1px solid #21262d' }}>
                <td style={{
                  padding: '8px',
                  color: getRoleColor(role),
                  fontWeight: 600,
                  borderRight: '1px solid #21262d',
                }}>
                  {role}
                </td>
                {ACTIONS.map((action) => {
                  const { label } = action;
                  const allowed = canRolePerformAction(role, action);
                  return (
                    <td
                      key={label}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        borderRight: '1px solid #21262d',
                      }}
                    >
                      {allowed ? (
                        <div style={{
                          background: '#03803d',
                          border: '1px solid #196c2e',
                          borderRadius: 4,
                          padding: '4px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#3fb950',
                        }}>
                          <LuCheck size={14} />
                        </div>
                      ) : (
                        <div style={{
                          background: '#3d1a1a',
                          border: '1px solid #6e2020',
                          borderRadius: 4,
                          padding: '4px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ff7b72',
                        }}>
                          <LuX size={14} />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: 12,
        padding: 8,
        background: '#161b22',
        borderRadius: 4,
        fontSize: 11,
        color: '#8b949e',
      }}>
        <p style={{ margin: 0 }}>
          <LuInfo size={13} style={{marginRight:6,verticalAlign:"middle",flexShrink:0}} /> <strong>Légende :</strong> Admin a accès complet. Ing. Qualité peut créer, modifier, valider, changer de statut et archiver. Reviewer peut valider et commenter. Visiteur peut uniquement lire.
        </p>
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
      roles: ['Admin', 'Ing. Qualité'],
    },
    update: {
      label: 'Modifier document',
      roles: ['Admin', 'Ing. Qualité'],
    },
    validate: {
      label: 'Valider document',
      roles: ['Admin', 'Reviewer'],
      note: '⚠️ Reviewer ≠ Rédacteur',
    },
    change_status: {
      label: 'Changer le statut',
      roles: ['Admin', 'Ing. Qualité', 'Reviewer'],
    },
    delete: {
      label: 'Supprimer',
      roles: ['Admin'],
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
  DocumentRolePermissionsMatrix,
  ConditionalAccess,
  ActionButton,
  RolePermissionTag,
};
