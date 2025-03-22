# Real-time Brand Monitor Analysis Platform

## Overview

This project implements a comprehensive real-time data analytics pipeline for social media sentiment analysis for the brand Apple. The system captures Reddit posts, processes them through Kafka, performs sentiment analysis with Spark, stores results in HDFS, and visualizes insights through an interactive dashboard.

The platform enables brand strategists to monitor public sentiment, track topic trends, and make data-driven marketing decisions based on real-time social media feedback.

## Project Working

The Real-time Brand Monitor Analysis Platform works through a sophisticated pipeline that processes social media data from collection to visualization:

1. **Data Collection**

   - The `reddit_stream.py` script connects to the Reddit API.
   - It continuously fetches posts related to Apple from specified subreddits.
   - The script applies filtering to capture only relevant content.
   - Each post's metadata (title, id, score, subreddit) is extracted.

2. **Data Streaming**

   - Collected Reddit posts are published to a Kafka topic using `kafka_producer.py`.
   - Kafka serves as the real-time message queue allowing decoupling of data collection from processing.
   - The system maintains message ordering and provides fault tolerance.

3. **Stream Processing**

   - `rate-limiting_streaming.py` or `proper_streaming.py` consumes messages from Kafka.
   - Spark Structured Streaming transforms the JSON messages into structured data.
   - The pipeline applies:
     - Sentiment analysis to determine if posts are positive, negative, or neutral.
     - Topic extraction to identify key discussion themes.
     - Brand mention detection.
     - Metadata enrichment.

4. **Data Storage**

   - Processed results are stored in HDFS at `/user/project/storage`.
   - The data is organized in Parquet format for efficient retrieval.
   - Checkpoint information is maintained at `/user/project/kafka_checkpoint` to ensure exactly-once processing.

5. **Data Retrieval & Visualization**
   - The Express backend fetches processed data from HDFS.
   - It exposes APIs for the frontend to consume.
   - Real-time updates are pushed to the dashboard using WebSockets.
   - The React frontend presents the data through interactive charts showing:
     - Overall sentiment distribution.
     - Sentiment trends over time.
     - Popular discussion topics.
     - Post volume metrics.

This pipeline runs continuously, providing brand managers with up-to-date insights about Apple's social media presence on Reddit, enabling them to respond quickly to emerging trends or issues.

## Architecture

### Architecture Diagram

![BDA Architecture](/assets/bda%20architecture%20sample.png)

The architecture consists of several key components:

- **Data Source**: Reddit API for streaming posts
- **Message Broker**: Kafka for handling real-time data streams
- **Processing Engine**: Spark for sentiment analysis and data transformations
- **Storage**: HDFS for persistent data storage
- **Visualization**: React frontend with Express backend for real-time dashboards

## Real-time Dashboard

The dashboard provides interactive visualizations of sentiment analysis results:

- Dashboard View 1
  ![Dashboard View 1](/assets/1.png)
- Dashboard View 2
  ![Dashboard View 2](/assets/2.png)
- Dashboard View 3
  ![Dashboard View 3](/assets/3.png)
- Dashboard View 4
  ![Dashboard View 4](/assets/4.png)

## Installation & Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.x
- Node.js and npm
- Git

### Step 1: Clone the Repository

```bash
git clone <https://github.com/Keerthan04/brand_monitor_bda_lab>
```

### Step 2: Set Up Hadoop Docker Environment

This project uses the hadoop-docker-compose setup for HDFS:
Refer this link

- <https://github.com/dhzdhd/hadoop-docker-compose>
  and setup the hadoop cluster using docker compose in the hadoop-docker-compose folder (separate from this project folder)

```bash
docker-compose up -d
```

This provides the mounted `/workdir` volume to access project files from within containers.

### Step 3: Start Docker Containers

Note: The first startup may take some time as images are downloaded and containers are initialized. Subsequent starts will be faster.

Once running, open Docker Desktop to verify all containers are running properly. Wait approximately 10 seconds for the `sentiment-flask` service to initialize (you can monitor this in the container logs).

### Step 4: Set Up HDFS

Follow the instructions in `HDFS-setup.md` to configure HDFS for the project.

### Step 5: Configure Environment Variables

Create a `.env` file in the root of the project and add your Reddit API credentials and other required configuration values based on the `.env.sample` file.

### Step 6: Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Running the Project

### Step 1: Start Reddit Stream

In a new terminal, run:

```bash
python reddit_stream.py
```

This will begin streaming Reddit posts to the Kafka broker.

### Step 2: Run Spark Streaming Analysis

In the terminal running the Hadoop container, execute:

```bash
spark-submit \
  --master local[*] \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1 \
  --conf "spark.executor.memory=2g" \
  --conf "spark.driver.memory=2g" \
  --conf "spark.hadoop.fs.defaultFS=hdfs://master:9000" \
  --conf "spark.hadoop.dfs.client.use.datanode.hostname=true" \
  /workdir/proper_streaming.py
```

Note: The first run may take longer as packages are downloaded.

### Step 3: Start the Visualization Backend

In a new terminal:

```bash
cd visualization/express-backend
npm install
npm run dev
```

This starts the Express backend that connects to Kafka and provides data to the frontend via WebSockets.

### Step 4: Start the Visualization Frontend

In another terminal:

```bash
cd visualization/react-frontend
npm install
npm run dev
```

Once running, access the dashboard at: [http://localhost:5173](http://localhost:5173)

## Stopping the Project

To stop the services:

- Use keyboard interrupts (Ctrl+C) to stop each running process
  - Stop the Spark Streaming process
  - Stop the express backend and react frontend
  - Stop the `reddit_stream.py` process

To preserve the data collected for future analysis:

- After stopping the streaming process
  - Run `hdfs dfs -get /user/project/storage /workdir/project_storage`
  - Run `exit` to stop and remove the Docker containers

## Restarting with Preserved Data

When restarting the project after the initial setup:

- Start the Docker containers
- Recreate the HDFS directory structure
- Restore previous data (optional)
  - If previous data is needed then run `hdfs dfs -put /workdir/project_storage /user/project/storage`

## Questions and Support

For questions or support, please contact: <ckeerthankumar4@gmail.com>
