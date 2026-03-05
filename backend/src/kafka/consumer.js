// =============================================================
// kafka/consumer.js — KafkaJS consumer → email dispatch
// Sprint 8 — Kafka + Email notifications
// =============================================================
"use strict";

const { getKafka }   = require("./producer");
const pool           = require("../db");
const emailService   = require("../services/emailService");

const TOPICS = [
  "smq.document.created",
  "smq.document.status_changed",
  "smq.document.version_added",
  "smq.document.expiring",
  "smq.document.inactive",
];

// ── DB helpers ────────────────────────────────────────────────

/**
 * Get email addresses of all active users with any of the given role names.
 */
async function emailsByRoles(roles) {
  if (!roles || !roles.length) return [];
  const placeholders = roles.map((_, i) => `$${i + 1}`).join(",");
  const result = await pool.query(
    `SELECT u.email FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.name IN (${placeholders}) AND u.is_active = true AND u.email IS NOT NULL`,
    roles
  );
  return result.rows.map((r) => r.email);
}

/**
 * Get email addresses of all active users.
 */
async function allActiveEmails() {
  const result = await pool.query(
    `SELECT email FROM users WHERE is_active = true AND email IS NOT NULL`
  );
  return result.rows.map((r) => r.email);
}

// ── Topic handlers ────────────────────────────────────────────

async function handleDocumentCreated(payload) {
  const { docId, docCode, title, docType, createdBy } = payload;
  const emails = await emailsByRoles(["Admin GED", "Admin", "Ing. Qualité"]);
  await emailService.sendDocumentCreatedEmail({ to: emails, docCode, title, docType, createdBy });
}

async function handleStatusChanged(payload) {
  const { docId, docCode, title, docType, fromStatus, toStatus, actor } = payload;
  let emails = [];

  if (toStatus === "En validation") {
    emails = await emailsByRoles(["Admin GED", "Admin", "Ing. Qualité", "Validateur", "Reviewer"]);
  } else if (toStatus === "Validé" || toStatus === "Obsolète") {
    emails = await emailsByRoles(["Admin GED", "Admin"]);
  } else if (toStatus === "Diffusé") {
    emails = await allActiveEmails();
  } else {
    emails = await emailsByRoles(["Admin GED", "Admin"]);
  }

  await emailService.sendStatusChangedEmail({ to: emails, docCode, title, docType, fromStatus, toStatus, actor });
}

async function handleVersionAdded(payload) {
  const { docId, docCode, title, docType, version, uploadedBy } = payload;
  const emails = await emailsByRoles(["Admin GED", "Admin", "Ing. Qualité"]);
  await emailService.sendNewVersionEmail({ to: emails, docCode, title, docType, version, uploadedBy });
}

async function handleExpiring(payload) {
  const { docCode, title, docType, reviewDate } = payload;
  const emails = await emailsByRoles(["Admin GED", "Admin"]);
  await emailService.sendExpiringDocumentEmail({ to: emails, docCode, title, docType, reviewDate });
}

async function handleInactive(payload) {
  const { docCode, title, docType, lastModified } = payload;
  const emails = await emailsByRoles(["Admin GED", "Admin"]);
  await emailService.sendInactiveDocumentEmail({ to: emails, docCode, title, docType, lastModified });
}

const HANDLERS = {
  "smq.document.created":        handleDocumentCreated,
  "smq.document.status_changed": handleStatusChanged,
  "smq.document.version_added":  handleVersionAdded,
  "smq.document.expiring":       handleExpiring,
  "smq.document.inactive":       handleInactive,
};

// ── Consumer init ─────────────────────────────────────────────

async function ensureTopicsExist() {
  const admin = getKafka().admin();
  try {
    await admin.connect();
    await admin.createTopics({
      waitForLeaders: true,
      topics: TOPICS.map((topic) => ({
        topic,
        numPartitions:     1,
        replicationFactor: 1,
      })),
    });
    console.log("[Kafka] Topics ensured.");
  } catch (err) {
    // TopicAlreadyExists is fine — ignore it
    if (!err.message?.includes("already exists") && !err.message?.includes("TOPIC_ALREADY_EXISTS")) {
      console.warn("[Kafka] createTopics warning:", err.message);
    }
  } finally {
    await admin.disconnect().catch(() => {});
  }
}

async function connectConsumer() {
  await ensureTopicsExist();

  const consumer = getKafka().consumer({
    groupId: process.env.KAFKA_GROUP_ID || "smq-email-consumer",
  });

  await consumer.connect();
  console.log("[Kafka] Consumer connected.");

  await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      let payload;
      try {
        payload = JSON.parse(message.value.toString());
      } catch {
        console.error(`[Kafka] Bad JSON on ${topic}:`, message.value?.toString());
        return; // discard malformed message, commit offset
      }

      const handler = HANDLERS[topic];
      if (!handler) return;

      try {
        await handler(payload);
      } catch (err) {
        console.error(`[Kafka] Handler error for ${topic}:`, err.message);
        // swallow — offset is committed, consumer continues
      }
    },
  });

  console.log(`[Kafka] Consumer subscribed to: ${TOPICS.join(", ")}`);
}

module.exports = { connectConsumer };
