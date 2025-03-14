import os
from dotenv import load_dotenv
from kafka_producer import producer
#documentation link->https://praw.readthedocs.io/en/stable/code_overview/models/submission.html#submission

# Load variables from the .env file
load_dotenv()

import praw

# Initialize the Reddit client with your credentials
reddit = praw.Reddit(
    client_id=os.getenv('CLIENT_ID'),  # Your client ID from Reddit
    client_secret=os.getenv('CLIENT_SECRET'),  # Your client secret from Reddit
    user_agent='BrandMonitorDemo/1.0 by Easy_Lime3978'  # A descriptive user agent string
)

# Combine subreddits using the plus sign to stream from both r/apple and r/Samsung.
subreddits = reddit.subreddit("apple+Samsung")

print("Listening for new submissions in r/apple and r/Samsung...")

# Stream new submissions from the specified subreddits.
for submission in subreddits.stream.submissions():
    data = {
        'id': submission.id,
        'title': submission.title,
        'score': submission.score,
        'subreddit': str(submission.subreddit),
        'url': submission.url,
        'content': submission.selftext if submission.is_self else submission.title
    }
    
    # Determine the Kafka topic based on the subreddit name.
    # For example, posts from r/apple go to the "apple_topic", and r/samsung posts go to "samsung_topic".
    topic = None
    subreddit_name = submission.subreddit.display_name.lower()
    if subreddit_name == 'apple':
        topic = 'apple_topic'
    elif subreddit_name == 'samsung':
        topic = 'samsung_topic'
    
    if topic:
        # Send the data payload to the determined Kafka topic.
        producer.send(topic, data)
        print(f"Sent submission {submission.id} to topic: {topic}")
    
    # For demo purposes, process only the first submission.
    break
producer.flush()
