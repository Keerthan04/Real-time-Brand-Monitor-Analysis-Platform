#!/usr/bin/env python
import json
import requests
from kafka import KafkaConsumer, KafkaProducer
from hdfs import InsecureClient
import logging

# ---------------------------
# Configuration and Logging
# ---------------------------
# Set up basic logging to output info and error messages.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kafka broker details and topic names.
KAFKA_BROKER = 'localhost:9092'

OUTPUT_TOPIC = 'realtime_data'       # Topic to publish enriched records to.

# Flask API endpoint for sentiment and topic analysis.
# This Flask app should accept a POST request with a JSON payload containing a 'text' field.
FLASK_ANALYSIS_URL = 'http://localhost:5000/predict'

# HDFS configuration: the URL for the HDFS NameNode web interface.
# Adjust the URL and port if necessary, and set the path where you want to store your data.
HDFS_URL = 'http://namenode:50070'
HDFS_OUTPUT_PATH = '/path/to/enriched_data/enriched_records.json'

# ---------------------------
# Initialize Kafka Consumer & Producer
# ---------------------------
# Create a Kafka consumer to read messages from the input topic.
consumer = KafkaConsumer(
    'apple_topic', 'samsung_topic',       # List your topics here
    bootstrap_servers=KAFKA_BROKER,   # Kafka broker address
    auto_offset_reset='earliest',         # Start reading from the beginning
    enable_auto_commit=True,              # Automatically commit offsets
    group_id='reddit_consumer_group',     # Consumer group ID(so only one group with one consumer so that it can read all the messages)
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))  # Deserialize JSON messages
)

# Create a Kafka producer to send enriched messages to the output topic.
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda m: json.dumps(m).encode('utf-8')  # Serialize Python dict to JSON bytes.
)

# ---------------------------
# Initialize HDFS Client
# ---------------------------
# Create an HDFS client using the InsecureClient (suitable for development or non-secure clusters).
# Adjust the user parameter if needed (here, we assume the HDFS user is 'hdfs').
hdfs_client = InsecureClient(HDFS_URL, user='hdfs')

# ---------------------------
# Function: Process Each Record
# ---------------------------
def process_record(record):
    """
    Process a single record from Kafka:
    1. Extracts the 'content' field.
    2. Calls the Flask API to perform sentiment analysis and topic extraction.
    3. Merges the analysis result into the original record.
    4. Returns the enriched record.
    """
    try:
        # Extract the text content that needs analysis.
        content = record.get('content', '')
        if not content:
            logger.warning("No content found in record with id: %s", record.get('id'))
            return None

        # Prepare the payload for the Flask API.
        payload = {'text': content}
        # Send a POST request to the Flask API endpoint.
        response = requests.post(FLASK_ANALYSIS_URL, json=payload)
        
        # Check if the request was successful.
        if response.status_code != 200:
            logger.error("Flask analysis failed for record id: %s", record.get('id'))
            return None
        
        # Parse the JSON response from the Flask API.
        analysis_result = response.json()
        # Merge the returned analysis data (e.g., sentiment and topics) into the original record.
        record.update(analysis_result)
        return record
    except Exception as e:
        logger.exception("Exception processing record id: %s", record.get('id'))
        return None

# ---------------------------
# Function: Store Record in HDFS
# ---------------------------
def store_in_hdfs(record):
    """
    Store the enriched record into HDFS.
    For simplicity, we append each record as a new line (JSON format) in a single file.
    In a production scenario, you may want to batch writes or use a more sophisticated format.
    """
    try:
        # Convert the record to a JSON string.
        record_json = json.dumps(record)
        # Open the HDFS file in append mode and write the record followed by a newline.
        with hdfs_client.write(HDFS_OUTPUT_PATH, encoding='utf-8', append=True) as writer:
            writer.write(record_json + "\n")
        logger.info("Stored record id: %s in HDFS", record.get('id'))
    except Exception as e:
        logger.exception("Failed to store record id: %s in HDFS", record.get('id'))

# ---------------------------
# Function: Send Record to Kafka Output Topic
# ---------------------------
def send_to_kafka(record):
    """
    Send the enriched record to the designated Kafka output topic.
    """
    try:
        producer.send(OUTPUT_TOPIC, record)
        # Flush ensures the record is actually transmitted.
        producer.flush()
        logger.info("Sent record id: %s to Kafka topic: %s", record.get('id'), OUTPUT_TOPIC)
    except Exception as e:
        logger.exception("Failed to send record id: %s to Kafka", record.get('id'))

# ---------------------------
# Main Processing Loop
# ---------------------------
def main():
    """
    The main loop for consuming, processing, storing, and forwarding records.
    Continuously consumes messages from the Kafka input topic.
    """
    logger.info("Starting Kafka consumer loop.")
    for message in consumer:
        # The value of each message is already deserialized to a Python dict.
        record = message.value
        logger.info("Received record id: %s", record.get('id'))

        # Process the record: perform sentiment and topic extraction.
        enriched_record = process_record(record)
        if enriched_record:
            # Store the enriched record in HDFS.
            store_in_hdfs(enriched_record)
            # Publish the enriched record to the Kafka output topic.
            send_to_kafka(enriched_record)

# ---------------------------
# Entry Point
# ---------------------------
if __name__ == "__main__":
    main()
