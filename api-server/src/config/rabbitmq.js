const amqplib = require('amqplib');

let connection = null;
let channel = null;
let connectionFailed = false;

async function getRabbitChannel() {
  // Don't retry too frequently if connection failed
  if (connectionFailed) {
    if (Date.now() - connectionFailed < 30000) return null;
    connectionFailed = false;
  }

  if (channel) return channel;

  try {
    const url = `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;
    connection = await amqplib.connect(url);
    channel = await connection.createChannel();

    // Declare queues
    await channel.assertQueue('booking_requests', { durable: true });

    // Handle connection close
    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      channel = null;
      connection = null;
    });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      channel = null;
      connection = null;
    });

    console.log('RabbitMQ connected');
    connectionFailed = false;
    return channel;
  } catch (err) {
    console.error('RabbitMQ connection failed:', err.message);
    connectionFailed = Date.now();
    channel = null;
    connection = null;
    return null;
  }
}

async function publishToQueue(queue, message) {
  try {
    const ch = await getRabbitChannel();
    if (ch) {
      ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
      return true;
    }
  } catch (err) {
    console.error('RabbitMQ publish error:', err.message);
  }
  return false;
}

module.exports = { getRabbitChannel, publishToQueue };
