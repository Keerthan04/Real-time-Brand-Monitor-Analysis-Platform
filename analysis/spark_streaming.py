from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, udf, to_json, struct
from pyspark.sql.types import StructType, StructField, StringType, IntegerType
import requests, json

# Initialize Spark session
spark = SparkSession.builder.appName("RedditSentimentSpark").getOrCreate()

# Kafka input configuration
kafka_bootstrap = "kafka:29092"#since running inside the container i need it to be kafka:29092 but from outside it should be localhost:9092
output_topic = "realtime_data"

# Define the schema for the JSON message coming from Kafka
json_schema = StructType([
    StructField("id", StringType()),
    StructField("title", StringType()),
    StructField("score", IntegerType()),
    StructField("subreddit", StringType()),
    StructField("url", StringType()),
    StructField("content", StringType())
])

# Read stream from Kafka
raw_df = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", kafka_bootstrap) \
    .option("subscribe", "apple_topic,samsung_topic") \
    .load()

# Convert binary value to string and then parse JSON
df_json = raw_df.select(from_json(col("value").cast("string"), json_schema).alias("data")).select("data.*")

# Define a UDF that calls the Flask API
def call_flask_api(text):
    try:
        # Make a POST request to the Flask API with the text
        print("calling flask api")
        response = requests.post("http://sentiment-flask:5000/predict", json={"text": text}, timeout=20)
        print("response from flask api got" )
        if response.status_code == 200:
            # Return the API response as a JSON string
            return json.dumps(response.json())
        else:
            return "{}"
    except Exception as e:
        print("error in calling flask api")
        return "{}"

# Register the UDF with return type String (JSON string)
api_udf = udf(call_flask_api, StringType())

# Apply the UDF to add an "analysis" column
df_enriched = df_json.withColumn("analysis", api_udf(col("content")))

# Write the enriched data to HDFS in Parquet format
# hdfs_output_path = "hdfs://localhost:9870/user/project/storage"
# hdfs_output_path = "hdfs://master:9000/user/project/storage"
# hdfs_output_path = "hdfs://localhost:9000/user/project/storage"
# hdfs_output_path = "hdfs://172.21.0.2:9866/user/project/storage"
hdfs_output_path = "/user/project/storage"

print("writing to hdfs")
query_hdfs = df_enriched.writeStream \
    .format("parquet") \
    .option("checkpointLocation", "/user/project/checkpoint") \
    .option("path", hdfs_output_path) \
    .trigger(processingTime="10 seconds") \
    .start()
print("writing to hdfs done")

print("writing to kafka")

# Also write the enriched data to another Kafka topic for real-time consumption.
# We convert the entire record back into a JSON string.
df_kafka = df_enriched.select(to_json(struct("*")).alias("value"))
query_kafka = df_kafka.writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", kafka_bootstrap) \
    .option("topic", output_topic) \
    .option("checkpointLocation", "/user/project/kafka_checkpoint") \
    .start()
print("writing to kafka done")
# Await termination of both streams
query_hdfs.awaitTermination()
query_kafka.awaitTermination()
