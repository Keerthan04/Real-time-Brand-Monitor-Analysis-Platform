from kafka import KafkaConsumer
import json

# Create a Kafka consumer that subscribes to both topics.
consumer = KafkaConsumer(
    'apple_topic', 'samsung_topic',       # List your topics here
    bootstrap_servers='localhost:9092',   # Kafka broker address
    auto_offset_reset='earliest',         # Start reading from the beginning
    enable_auto_commit=True,              # Automatically commit offsets
    group_id='reddit_consumer_group',     # Consumer group ID(so only one group with one consumer so that it can read all the messages)
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))  # Deserialize JSON messages
)

print("Consumer is listening for messages...")

# Loop to continuously consume messages.
for message in consumer:
    print(f"Received message from topic '{message.topic}': {message.value}")

#testing purposes