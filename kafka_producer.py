from kafka import KafkaProducer
import json
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',#set up and running in the docker container
    client_id = 'reddit-stream',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')#The value_serializer converts Python dicts to JSON bytes.
    )
# The producer is now ready to send messages to the Kafka broker.
