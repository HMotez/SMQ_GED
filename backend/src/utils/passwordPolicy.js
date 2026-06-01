// ─────────────────────────────────────────────────────────────
// utils/passwordPolicy.js
// RÔLE : Valide la complexité des mots de passe selon la politique
//        de sécurité de l'application.
//        Appliqué lors de l'inscription (/register) et de la
//        réinitialisation du mot de passe (/reset-password).
//        Règles obligatoires :
//          - Minimum 12 caractères
//          - Au moins une lettre majuscule
//          - Au moins une lettre minuscule
//          - Au moins un chiffre
//          - Au moins un caractère spécial (!, @, #...)
//        Retourne { valid: boolean, errors: string[] }
// ─────────────────────────────────────────────────────────────

const POLICY = {
  minLength:   12,
  uppercase:   /[A-Z]/,
  lowercase:   /[a-z]/,
  digit:       /[0-9]/,
  special:     /[^A-Za-z0-9]/,
};

function validatePassword(password) {
  const errors = [];

  if (!password || password.length < POLICY.minLength)
    errors.push(`Au moins ${POLICY.minLength} caractères.`);
  if (!POLICY.uppercase.test(password))
    errors.push("Au moins une lettre majuscule.");
  if (!POLICY.lowercase.test(password))
    errors.push("Au moins une lettre minuscule.");
  if (!POLICY.digit.test(password))
    errors.push("Au moins un chiffre.");
  if (!POLICY.special.test(password))
    errors.push("Au moins un caractère spécial (!, @, #, …).");

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePassword };
