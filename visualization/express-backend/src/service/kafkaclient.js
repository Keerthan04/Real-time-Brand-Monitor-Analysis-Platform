import {Kafka} from 'kafkajs';

const broker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafkaClient = new Kafka({
    clientId: 'realtime-topic-consumer',
    brokers: [broker]
});

export default kafkaClient;