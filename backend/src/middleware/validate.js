// ============================================================
// middleware/validate.js
// RÔLE : Valide et sanitise les données reçues dans les requêtes
//        HTTP avant qu'elles atteignent les controllers.
//        Utilise express-validator pour définir des règles par champ
//        (longueur, format email, caractères interdits...).
//        Si la validation échoue → retourne 400 avec les erreurs détaillées.
//        Protège contre les injections XSS et les données malformées.
//
// Usage : router.post("/route", validate([règles]), controller)
// ============================================================
"use strict";

const { body, param, validationResult } = require("express-validator");
const { validatePassword } = require("../controllers/authController");

// ─────────────────────────────────────────────────────────────
// validate() — exécute les règles et renvoie 400 si erreur
// ─────────────────────────────────────────────────────────────
const validate = (rules) => async (req, res, next) => {
  for (const rule of rules) await rule.run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error:  errors.array()[0].msg,
      errors: errors.array().map((e) => e.msg),
      code:   "VALIDATION_ERROR",
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// Règles — Authentification
// ─────────────────────────────────────────────────────────────
const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage("Format d'email invalide."),
  body("password")
    .notEmpty().withMessage("Le mot de passe est requis."),
];

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Le nom est requis.")
    .isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères."),
  body("email")
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage("Format d'email invalide."),
  body("password")
    .notEmpty().withMessage("Le mot de passe est requis.")
    .custom((value) => {
      const err = validatePassword(value);
      if (err) throw new Error(err);
      return true;
    }),
  body("confirmPassword")
    .notEmpty().withMessage("La confirmation du mot de passe est requise.")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Les mots de passe ne correspondent pas.");
      return true;
    }),
  body("requestedRole")
    .notEmpty().withMessage("Le rôle souhaité est requis.")
    .isIn(["Admin", "Ing. Qualité", "Reviewer"])
    .withMessage("Rôle invalide. Valeurs acceptées : Admin, Ing. Qualité, Reviewer."),
];

const forgotPasswordRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage("Format d'email invalide."),
];

const resetPasswordRules = [
  body("token")
    .notEmpty().withMessage("Le token de réinitialisation est requis.")
    .isLength({ min: 64, max: 64 }).withMessage("Token invalide."),
  body("password")
    .notEmpty().withMessage("Le mot de passe est requis.")
    .custom((value) => {
      const err = validatePassword(value);
      if (err) throw new Error(err);
      return true;
    }),
  body("confirmPassword")
    .notEmpty().withMessage("La confirmation est requise.")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Les mots de passe ne correspondent pas.");
      return true;
    }),
];

// ─────────────────────────────────────────────────────────────
// Règles — Documents
// ─────────────────────────────────────────────────────────────
const VALID_STATUSES = [
  "En rédaction", "Appel en relecture", "En relecture",
  "En correction", "En validation", "Validé",
  "Diffusé", "Obsolète", "Archivé",
];

const VALID_ORIGINS = ["INTERNE", "EXTERNE"];

const createDocumentRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Le titre du document est requis.")
    .isLength({ max: 255 }).withMessage("Le titre ne peut pas dépasser 255 caractères."),
  body("responsible")
    .trim()
    .notEmpty().withMessage("Le responsable est requis.")
    .isLength({ max: 100 }).withMessage("Le responsable ne peut pas dépasser 100 caractères."),
  body("nextReviewDate")
    .notEmpty().withMessage("La date de prochaine révision est requise.")
    .isISO8601().withMessage("Format de date invalide (attendu : YYYY-MM-DD)."),
  body("folderId")
    .notEmpty().withMessage("Le dossier est requis.")
    .isInt({ min: 1 }).withMessage("L'identifiant du dossier est invalide."),
  body("typeCode")
    .trim()
    .notEmpty().withMessage("Le type de document est requis."),
  body("origin")
    .optional()
    .isIn(VALID_ORIGINS).withMessage("Origine invalide. Valeurs acceptées : INTERNE, EXTERNE."),
  body("keywords")
    .optional()
    .isLength({ max: 500 }).withMessage("Les mots-clés ne peuvent pas dépasser 500 caractères."),
  body("context")
    .optional()
    .isLength({ max: 1000 }).withMessage("Le contexte ne peut pas dépasser 1000 caractères."),
];

const updateDocumentRules = [
  param("id")
    .isInt({ min: 1 }).withMessage("L'identifiant du document est invalide."),
  body("title")
    .optional()
    .trim()
    .notEmpty().withMessage("Le titre ne peut pas être vide.")
    .isLength({ max: 255 }).withMessage("Le titre ne peut pas dépasser 255 caractères."),
  body("nextReviewDate")
    .optional()
    .isISO8601().withMessage("Format de date invalide (attendu : YYYY-MM-DD)."),
  body("origin")
    .optional()
    .isIn(VALID_ORIGINS).withMessage("Origine invalide."),
];

const changeStatusRules = [
  param("id")
    .isInt({ min: 1 }).withMessage("L'identifiant du document est invalide."),
  body("newStatus")
    .trim()
    .notEmpty().withMessage("Le nouveau statut est requis.")
    .isIn(VALID_STATUSES).withMessage(`Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(", ")}.`),
];

const documentIdRules = [
  param("id")
    .isInt({ min: 1 }).withMessage("L'identifiant du document est invalide."),
];

module.exports = {
  validate,
  loginRules,
  registerRules,
  forgotPasswordRules,
  resetPasswordRules,
  createDocumentRules,
  updateDocumentRules,
  changeStatusRules,
  documentIdRules,
};
