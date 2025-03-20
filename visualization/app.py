from flask import Flask, render_template
from flask_socketio import SocketIO
from kafka import KafkaConsumer
import json
import threading
from collections import defaultdict

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Initialize dictionaries to track sentiment counts for each brand and topic
apple_sentiment_counts = defaultdict(int)
samsung_sentiment_counts = defaultdict(int)
apple_topic_sentiments = defaultdict(lambda: defaultdict(int))
samsung_topic_sentiments = defaultdict(lambda: defaultdict(int))

# Function to process Kafka messages and update sentiment counts
def kafka_consumer_thread():
    consumer = KafkaConsumer(
        'realtime_data',
        bootstrap_servers=['localhost:9092'],  # Kafka's internal hostname
        auto_offset_reset='latest',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    # Continuously poll for new messages
    for msg in consumer:
        data = msg.value
        print(f"Received data: {data}")

        brand = data.get('brand', '')
        sentiment = data.get('sentiment_class', '')
        topics = data.get('topics', [])

        # Update sentiment counts for Apple or Samsung
        if brand.lower() == "apple":
            apple_sentiment_counts[sentiment] += 1
            for topic in topics:
                apple_topic_sentiments[topic['topic']][topic['sentiment']] += 1
        elif brand.lower() == "samsung":
            samsung_sentiment_counts[sentiment] += 1
            for topic in topics:
                samsung_topic_sentiments[topic['topic']][topic['sentiment']] += 1

        # Emit the updated data to all connected SocketIO clients
        socketio.emit('update_sentiment_data', {
            'apple_sentiment_counts': dict(apple_sentiment_counts),
            'samsung_sentiment_counts': dict(samsung_sentiment_counts),
            'apple_topic_sentiments': dict(apple_topic_sentiments),
            'samsung_topic_sentiments': dict(samsung_topic_sentiments)
        })

# Start Kafka consumer in a background thread
def start_kafka_consumer():
    thread = threading.Thread(target=kafka_consumer_thread)
    thread.daemon = True
    thread.start()

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    # Start Kafka consumer before running the Flask app
    start_kafka_consumer()

    # Run the Flask app with SocketIO support
    socketio.run(app, host='0.0.0.0', port=5001)
