# HDFS Setup Instructions

This file provides the steps to run and set up the Hadoop cluster for the project once the Docker Compose is up and running.

## Prerequisites

- Ensure you have referred to and set up [this repository](https://github.com/dhzdhd/hadoop-docker-compose).
- Clone the current repository and run the `docker-compose -d` command.

## Steps

### Step 1: Start the Hadoop Cluster

Open a new terminal and run the following command to start the Hadoop cluster:

```sh
./run.ps1  # For Windows
./run.sh   # For Unix-based systems
```

If you encounter any errors, refer to the [issue resolution section](https://github.com/dhzdhd/hadoop-docker-compose) of the repository.

### Step 2: Initialize Hadoop Cluster

Run the following command and wait for it to finish. This sets up the Hadoop cluster for you:

```sh
init
```

Once done, you can visit [https://localhost:9000/](https://localhost:9000/) for the Hadoop cluster UI.

### Step 3: Install Required Python Packages

Run the following command to install the required Python packages:

```sh
pip install requests
```

### Step 4: Set Up Directories in HDFS

Run the following commands to set up directories in HDFS:

```sh
hdfs dfs -mkdir -p /user/project/
hdfs dfs -mkdir -p /user/project/storage
hdfs dfs -mkdir -p /user/project/checkpoint
hdfs dfs -mkdir -p /user/project/hdfs_checkpoint
hdfs dfs -mkdir -p /user/project/kafka_checkpoint
hdfs dfs -chmod -R 777 /user/project
```

### Step 5: Copy Streaming Script

Copy the `proper_streaming.py` file from the `/analysis` directory into the `/workdir` directory of the Hadoop Docker Compose folder (obtained from cloning [this repository](https://github.com/dhzdhd/hadoop-docker-compose)).

Now HDFS is set up for running the project.
