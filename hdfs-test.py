#file used for testing the spark writing to HDFS and works
from pyspark.sql import SparkSession
from pyspark.sql.functions import lit
import time

# Initialize Spark session
spark = SparkSession.builder \
    .appName("HDFSWriteTest") \
    .getOrCreate()

# Create a simple test DataFrame
test_data = [("test1", 100), ("test2", 200), ("test3", 300)]
schema = ["name", "value"]
test_df = spark.createDataFrame(test_data, schema)

# Add a timestamp column
timestamp = int(time.time())
test_df = test_df.withColumn("timestamp", lit(timestamp))

# Print the DataFrame
print("Created test DataFrame:")
test_df.show()

# Define HDFS path
hdfs_path = "/user/project/storage"

# Write to HDFS
print(f"Writing to HDFS path: {hdfs_path}")
try:
    test_df.write.mode("overwrite").parquet(hdfs_path)
    print(f"Successfully wrote data to {hdfs_path}")
except Exception as e:
    print(f"Error writing to HDFS: {str(e)}")

# Try to read back the data to verify
try:
    read_df = spark.read.parquet(hdfs_path)
    print("Successfully read back data from HDFS:")
    read_df.show()
    print(f"Read count: {read_df.count()}")
except Exception as e:
    print(f"Error reading from HDFS: {str(e)}")

# Stop the Spark session
spark.stop()