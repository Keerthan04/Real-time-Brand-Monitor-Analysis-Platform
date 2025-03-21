from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, udf, to_json, struct, current_timestamp, when
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, FloatType, TimestampType
import requests
import json
import time
from datetime import datetime

# Initialize Spark session with proper configurations
spark = SparkSession.builder \
    .appName("RedditSentimentAnalysis") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.3.0") \
    .config("spark.sql.streaming.checkpointLocation", "/user/project/checkpoint") \
    .config("spark.sql.parquet.compression.codec", "snappy") \
    .getOrCreate()

# Kafka configuration
kafka_bootstrap = "kafka:29092"  # Inside container address
output_topic = "realtime_data"

# Define the schema for the JSON message coming from Kafka (adjusted for your data)
json_schema = StructType([
    StructField("id", StringType()),
    StructField("title", StringType()),
    StructField("score", IntegerType()),
    StructField("subreddit", StringType()),
    StructField("url", StringType()),
    StructField("content", StringType()),
    StructField("created_utc", TimestampType()),
    StructField("author", StringType())
])

# Read stream from Kafka
raw_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", kafka_bootstrap) \
    .option("subscribe", "apple_topic,samsung_topic") \
    .option("failOnDataLoss", "false") \
    .option("startingOffsets", "latest") \
    .load()

# Parse the Kafka message
parsed_df = raw_df \
    .selectExpr("CAST(value AS STRING)", "topic") \
    .select(from_json(col("value"), json_schema).alias("data"), col("topic")) \
    .select("data.*", "topic")

# Define a UDF that calls the Flask API for sentiment analysis
def get_sentiment_analysis(text):
    try:
        if not text or text.strip() == "":
            return json.dumps({
                "sentiment": "neutral",
                "sentiment_score": 0.0,
                "topics": []
            })
            
        # Make a POST request to the Flask API
        response = requests.post(
            "http://sentiment-flask:5000/predict", 
            json={"text": text}, 
            timeout=20
        )
        
        if response.status_code == 200:
            return json.dumps(response.json())
        else:
            print(f"API Error: Status {response.status_code}")
            return json.dumps({
                "sentiment": "neutral",
                "sentiment_score": 0.0,
                "topics": []
            })
    except Exception as e:
        print(f"Error calling sentiment API: {str(e)}")
        return json.dumps({
            "sentiment": "neutral",
            "sentiment_score": 0.0,
            "topics": []
        })

# Register the UDF
sentiment_udf = udf(get_sentiment_analysis, StringType())

# Apply the UDF to add an "analysis" column
df_with_sentiment = parsed_df.withColumn("analysis_json", sentiment_udf(col("content")))

# Extract fields from the JSON analysis result
analysis_schema = StructType([
    StructField("sentiment", StringType()),
    StructField("sentiment_score", FloatType()),
    StructField("topics", StringType())
])

# Parse the analysis JSON and extract fields
df_enriched = df_with_sentiment \
    .withColumn("analysis", from_json(col("analysis_json"), analysis_schema)) \
    .select(
        "*",
        col("analysis.sentiment").alias("sentiment"),
        col("analysis.sentiment_score").alias("sentiment_score"),
        col("analysis.topics").alias("topics")
    ) \
    .drop("analysis", "analysis_json")

# Add brand column based on the topic
df_branded = df_enriched.withColumn(
    "brand", 
    when(col("topic") == "apple_topic", "Apple")
    .when(col("topic") == "samsung_topic", "Samsung")
    .otherwise("Unknown")
)

# Add processing timestamp
df_final = df_branded.withColumn("processed_timestamp", current_timestamp())

# Function to write to HDFS
def write_batch_to_hdfs(df, epoch_id):
    # Get current timestamp for unique batch identification
    batch_timestamp = int(time.time())
    
    # Create partition path using current date
    current_date = datetime.now()
    partition_path = f"year={current_date.year}/month={current_date.month:02d}/day={current_date.day:02d}"
    
    try:
        # Count records for logging
        count = df.count()
        
        if count > 0:
            # Write to HDFS with partitioning
            hdfs_path = f"/user/project/storage/{partition_path}/batch_{batch_timestamp}"
            
            df.write \
                .partitionBy("brand") \
                .mode("append") \
                .parquet(hdfs_path)
                
            print(f"Batch {epoch_id}: Successfully wrote {count} records to HDFS path: {hdfs_path}")
            
            # Optional: Create external Hive table pointing to this data
            # spark.sql(f"""
            #    CREATE EXTERNAL TABLE IF NOT EXISTS reddit_sentiment_data (
            #        id STRING, title STRING, score INT, subreddit STRING, url STRING,
            #        content STRING, sentiment STRING, sentiment_score FLOAT, topics STRING,
            #        processed_timestamp TIMESTAMP
            #    )
            #    PARTITIONED BY (brand STRING, year INT, month INT, day INT)
            #    STORED AS PARQUET
            #    LOCATION '/user/project/storage'
            # """)
            # spark.sql("MSCK REPAIR TABLE reddit_sentiment_data")
        else:
            print(f"Batch {epoch_id}: No records to write")
    except Exception as e:
        print(f"Error writing batch {epoch_id} to HDFS: {str(e)}")

# Prepare data for Kafka (convert enriched data to JSON)
kafka_df = df_final.select(
    to_json(struct(
        col("id"),
        col("title"),
        col("score"),
        col("subreddit"),
        col("url"),
        col("content").alias("text"),
        col("sentiment"),
        col("sentiment_score"),
        col("topics"),
        col("brand"),
        col("processed_timestamp")
    )).alias("value")
)

# Write to HDFS using foreachBatch
hdfs_query = df_final.writeStream \
    .foreachBatch(write_batch_to_hdfs) \
    .option("checkpointLocation", "/user/project/hdfs_checkpoint") \
    .trigger(processingTime="30 seconds") \
    .start()

# Write to Kafka for real-time visualization
kafka_query = kafka_df.writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", kafka_bootstrap) \
    .option("topic", output_topic) \
    .option("checkpointLocation", "/user/project/kafka_checkpoint") \
    .trigger(processingTime="10 seconds") \
    .start()

# Log that both streams are started
print("Started HDFS and Kafka streaming queries")
print(f"Data will be written to HDFS at /user/project/storage")
print(f"Real-time data will be published to Kafka topic: {output_topic}")

# Await termination of both streams
spark.streams.awaitAnyTermination()