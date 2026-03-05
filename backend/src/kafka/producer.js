// =============================================================
// kafka/producer.js — KafkaJS singleton producer
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
