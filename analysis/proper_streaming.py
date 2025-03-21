from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, udf, to_json, struct, current_timestamp, when,year, month, dayofmonth
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, FloatType, TimestampType
import requests
import json
import time
from datetime import datetime
import random

# Initialize Spark session with explicit version of Kafka connector matching your Spark version
spark = SparkSession.builder \
    .appName("RedditSentimentAnalysis") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1") \
    .getOrCreate()

# Kafka configuration
kafka_bootstrap = "kafka:29092"  # Inside container address
output_topic1 = "realtime_data_apple"
output_topic2 = "realtime_data_samsung"

# Define the schema for the JSON message coming from Kafka
json_schema = StructType([
    StructField("id", StringType()),
    StructField("title", StringType()),
    StructField("score", IntegerType()),
    StructField("subreddit", StringType()),
    StructField("url", StringType()),
    StructField("content", StringType()),
    # StructField("created_utc", TimestampType()),
    # StructField("author", StringType())
])

# Track last API call timestamp for rate limiting
last_api_call_time = 0
min_delay_between_calls = 1.0  # Minimum 1 second between API calls

# Read stream from Kafka
raw_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", kafka_bootstrap) \
    .option("subscribe", "apple_topic,samsung_topic") \
    .option("failOnDataLoss", "false") \
    .option("startingOffsets", "latest") \
    .option("maxOffsetsPerTrigger", 5)  \
    .load()

# Parse the Kafka message
parsed_df = raw_df \
    .selectExpr("CAST(value AS STRING)", "topic") \
    .select(from_json(col("value").cast("string"), json_schema).alias("data"), col("topic")) \
    .select("data.*", "topic")

# Define a UDF that calls the Flask API for sentiment analysis with rate limiting
def get_sentiment_analysis(text):
    global last_api_call_time
    
    try:
        if not text or text.strip() == "":
            return json.dumps({
                "sentiment_class": "Neutral",
                "sentiment": 0,
                "topics": []
            })
        
        # Rate limiting logic
        current_time = time.time()
        time_since_last_call = current_time - last_api_call_time
        
        if time_since_last_call < min_delay_between_calls:
            # Add jitter to prevent all workers from calling simultaneously
            sleep_time = min_delay_between_calls - time_since_last_call + random.uniform(0.1, 0.5)
            print(f"Rate limiting: Sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        # Update the last API call time
        last_api_call_time = time.time()
        
        # Make a POST request to the Flask API
        print(f"Calling sentiment API for text: {text[:50]}...")
        response = requests.post(
            "http://sentiment-flask:5000/predict", 
            json={"text": text}, 
            timeout=30  # Increased timeout for LLM processing
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Got API response: {result['sentiment_class']}, score: {result['sentiment']}")
            return json.dumps(result)
        else:
            print(f"API Error: Status {response.status_code}")
            return json.dumps({
                "sentiment_class": "Neutral",
                "sentiment": 0,
                "topics": []
            })
    except Exception as e:
        print(f"Error calling sentiment API: {str(e)}")
        return json.dumps({
            "sentiment_class": "Neutral",
            "sentiment": 0,
            "topics": []
        })

# Register the UDF
sentiment_udf = udf(get_sentiment_analysis, StringType())

# Process data in micro-batches to better control the flow
def process_batch(batch_df, batch_id):
    # Process the batch if it's not empty
    if not batch_df.isEmpty():
        count = batch_df.count()
        print(f"Processing batch {batch_id} with {count} records")
        
        # Apply sentiment analysis to each record in the batch
        with_sentiment = batch_df.withColumn("analysis_json", sentiment_udf(col("content")))
        
        # Extract fields from the JSON analysis result
        analysis_schema = StructType([
            StructField("sentiment_class", StringType()),
            StructField("sentiment", FloatType()),
            StructField("topics", StringType())
        ])
        
        # Parse the analysis JSON and extract fields
        enriched = with_sentiment \
            .withColumn("analysis", from_json(col("analysis_json"), analysis_schema)) \
            .select(
                "*",
                col("analysis.sentiment_class").alias("sentiment_class"),
                col("analysis.sentiment").alias("sentiment"),
                col("analysis.topics").alias("topics")
            ) \
            .drop("analysis", "analysis_json")
        
        # Add brand column based on the topic
        branded = enriched.withColumn(
            "brand", 
            when(col("topic") == "apple_topic", "Apple")
            .when(col("topic") == "samsung_topic", "Samsung")
            .otherwise("Unknown")
        )
        
        # Add processing timestamp
        final = branded.withColumn("processed_timestamp", current_timestamp()) \
               .withColumn("year", year(col("processed_timestamp"))) \
               .withColumn("month", month(col("processed_timestamp"))) \
               .withColumn("day", dayofmonth(col("processed_timestamp")))

        # Write to HDFS with partitioning
        final.write \
            .partitionBy("brand", "year", "month", "day") \
            .mode("append") \
            .parquet(f"/user/project/storage")
        
        # Prepare data for Kafka by converting the row to JSON
        # Split the data based on brand
        apple_data = final.filter(col("brand") == "Apple").selectExpr(
            "to_json(named_struct('id', id, 'title', title, 'score', score, 'subreddit', subreddit, " +
            "'sentiment_class', sentiment_class, 'sentiment', sentiment, 'topics', topics, 'brand', brand)) AS value"
        )

        samsung_data = final.filter(col("brand") == "Samsung").selectExpr(
            "to_json(named_struct('id', id, 'title', title, 'score', score, 'subreddit', subreddit, " +
            "'sentiment_class', sentiment_class, 'sentiment', sentiment, 'topics', topics, 'brand', brand)) AS value"
        )

        # Write Apple data to Kafka
        apple_data.write \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_bootstrap) \
            .option("topic", output_topic1) \
            .mode("append") \
            .save()

        # Write Samsung data to Kafka
        samsung_data.write \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_bootstrap) \
            .option("topic", output_topic2) \
            .mode("append") \
            .save()

        print("Batch processed and sent separately to Kafka topics for Apple and Samsung.")
        
        print(f"Batch {batch_id}: Processed {count} records and sent to HDFS and Kafka")
    else:
        print(f"Batch {batch_id}: Empty batch, no processing needed")

# Use foreachBatch to process data in controlled micro-batches
processing_query = parsed_df.writeStream \
    .foreachBatch(process_batch) \
    .option("checkpointLocation", "/user/project/processing_checkpoint") \
    .trigger(processingTime="30 seconds") \
    .start()

# Log that streaming query has started
print("Started streaming query with rate-limited API calls")
print("Maximum 5 messages per batch, minimum 1 second between API calls")
print("Processing batches every 30 seconds")
print(f"Data will be written to HDFS at /user/project/storage")
# print(f"Real-time data will be published to Kafka topic: {output_topic}")

# Await termination
processing_query.awaitTermination()