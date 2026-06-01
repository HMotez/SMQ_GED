// =============================================================
// kafka/producer.js
// RÔLE : Singleton Kafka producer pour la publication d'événements.
//        Publie des messages sur les topics Kafka quand des actions
//        importantes surviennent dans l'application :
//          smq.document.created        → document créé
//          smq.document.status_changed → statut changé
//          smq.document.version_added  → nouvelle version
//          smq.document.expiring       → révision proche
//          smq.document.inactive       → document inactif
//        Pattern fire-and-forget : ne bloque jamais la requête HTTP
//        en cas d'erreur Kafka (dégradation gracieuse).
//        Désactivé si KAFKA_BROKER n'est pas défini dans .env.
//
// Sprint 8 — Kafka + Email notifications
// =============================================================
const { Kafka } = require("kafkajs");

let kafka    = null;
let producer = null;
let connected = false;

function getKafka() {
  if (kafka) return kafka;
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || "smq-ged-backend",
    brokers:  [process.env.KAFKA_BROKER   || "kafka:9092"],
    retry: {
      initialRetryTime: 3000,
      retries:          10,
    },
  });
  return kafka;
}

async function connectProducer() {
  producer = getKafka().producer();
  await producer.connect();
  connected = true;
  console.log("[Kafka] Producer connected.");
}

async function disconnectProducer() {
  if (producer && connected) {
    await producer.disconnect();
    connected = false;
    console.log("[Kafka] Producer disconnected.");
  }
}

/**
 * Publish an event to a Kafka topic.
 * Fire-and-forget — never throws so callers are never blocked.
 * @param {string} topic
 * @param {object} payload
 * @param {string|number} [key]  — message key (docId for per-doc ordering)
 */
async function publishEvent(topic, payload, key) {
  if (!connected || !producer) return;
  try {
    await producer.send({
      topic,
      messages: [{
        key:   key != null ? String(key) : undefined,
        value: JSON.stringify(payload),
      }],
    });
    console.log(`[Kafka] Published → ${topic}`);
  } catch (err) {
    console.error(`[Kafka] publishEvent failed on ${topic}:`, err.message);
  }
}

module.exports = { getKafka, connectProducer, disconnectProducer, publishEvent };
