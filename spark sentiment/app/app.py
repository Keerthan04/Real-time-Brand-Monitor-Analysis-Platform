from flask import Flask,request,jsonify
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import re
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('punkt_tab')
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
# import google.generativeai as genai
from google import genai
from dotenv import load_dotenv
import json
import os

load_dotenv()
#TODO -> changed the genai to the google(genai is the main client one and the generativeai is the cloud one)



app = Flask(__name__)

model = tf.keras.models.load_model('/flask_app/app/best_sentiment_model.h5')

with open('/flask_app/app/tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)

# Define parameters for tokenization and padding
num_words = 10000
max_length = 100

# Define the text cleaning function (same as during training)
def clean_text(text):
    if not text:
        return ""
    # Lowercase the text
    text = text.lower()
    # Remove punctuation and non-alphanumeric characters
    text = re.sub(r"[^a-z0-9\s]", "", text)
    # Tokenize the text
    tokens = nltk.word_tokenize(text)
    # Remove stop words
    stop_words = set(stopwords.words('english'))
    tokens = [word for word in tokens if word not in stop_words]
    # Lemmatize each token
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    # Join tokens back to form the cleaned text
    return " ".join(tokens)

def clean_markdown_json(text):
    # Remove leading/trailing whitespace
    text = text.strip()
    # If the text starts with triple backticks, remove the first line
    if text.startswith("```"):
        # Split into lines and remove the first and last lines if they contain ```
        lines = text.splitlines()
        # Remove the first line if it starts with ```
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        # Remove the last line if it ends with ```
        if lines and lines[-1].strip().endswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()

@app.route('/predict',methods = ['POST'])
def predict():
    """
    Endpoint to predict sentiment and extract key topics from given text.

    Parameters:

        text (str): The text to analyze.

    Returns:

        dict: A dictionary containing the predicted sentiment (int, -1 to 1),
        the sentiment class (str, 'Negative', 'Neutral', or 'Positive'),
        the raw prediction (list of float), and the extracted topics (list of dict).

    """
    data = request.get_json(force=True)
    text = data.get('text')
    cleaned_text = clean_text(text)

    sequences = tokenizer.texts_to_sequences([cleaned_text])
    padded_seq = pad_sequences(sequences, maxlen=max_length, padding='post',truncating='post')

    # Get sentiment prediction
    prediction = model.predict(padded_seq)
    predicted_class = int(prediction.argmax(axis=-1)[0])  # Convert to Python int

    # As we made -1,0,1 in training, we need to map it back.
    mapped_label = predicted_class - 1
    actual_label_dict = {-1: 'Negative', 0: 'Neutral', 1: 'Positive'}
    mapped_label_class = actual_label_dict[mapped_label]


    ## Initialize the Google AI client
    # genai.configure(api_key = os.getenv('GENAI_API_KEY'))
    ai_client = genai.Client(api_key=os.getenv('GENAI_API_KEY'))
    # prompt = f"""
    # Given the following text: "{text}"

    # Extract the key topics related to Apple brand reputation. Focus on areas such as product features (e.g., iPhone, MacBook, Apple Watch), design, performance, battery life, software quality, customer service, pricing, and overall user experience. For each topic, determine if the sentiment is positive, negative, or neutral (if possible), and indicate the strength or frequency of mentions if applicable.

    # Return the output as a valid JSON array, following this schema:
    # [
    # {{
    #     "topic": "string",
    #     "sentiment": "positive/negative/neutral",
    #     "mention_count": integer
    # }},
    # ...
    # ]

    # If the text does not contain clear topics, return an empty JSON array.
    # """
    # prompt = f"""
    # Given the following text: "{text}"

    # If the brand mentioned is Apple, extract the key topics related to Apple brand reputation. Focus on areas such as product features (e.g., iPhone, MacBook, Apple Watch), design, performance, battery life, software quality, customer service, pricing, and overall user experience. For each topic, determine if the sentiment is positive, negative, or neutral (if possible), and indicate the strength or frequency of mentions if applicable.

    # If the brand mentioned is Samsung, extract the key topics related to Samsung brand reputation, following the same areas of focus as for Apple (e.g., Galaxy phones, Samsung laptops, design, performance, battery life, software quality, customer service, pricing, and overall user experience). For each topic, determine if the sentiment is positive, negative, or neutral (if possible), and indicate the strength or frequency of mentions if applicable.

    # If the text mentions neither Apple nor Samsung, return an empty JSON array.

    # Return the output as a valid JSON array, following this schema:
    # [
    # {{
    #     "topic": "string",
    #     "sentiment": "positive/negative/neutral",
    #     "mention_count": integer
    # }},
    # ...
    # ]

    # If no clear topics can be extracted for the brand, return an empty JSON array.
    # """
    prompt = f"""
    Given the following text: "{text}"

    First determine if the brand mentioned is Apple, Samsung, both, or neither.

    Extract sentiment about the mentioned brand(s) and categorize it into ONLY these predefined topics:

    For Apple:
    - Product Features (iPhone, iPad, MacBook, etc.)
    - Design & Build Quality
    - Performance & Speed
    - Software & Ecosystem
    - Value & Price

    For Samsung:
    - Product Features (Galaxy phones, TVs, etc.)
    - Design & Build Quality
    - Performance & Speed
    - Software & Experience
    - Value & Price

    For each topic that applies, determine if the sentiment is positive, negative, or neutral, and assign a mention count of 1 for each instance.

    If the text mentions neither Apple nor Samsung, return an empty JSON array.

    Return the output as a valid JSON array, following this schema:
    [
    {{
        "topic": "One of the predefined topics above only",
        "sentiment": "positive/negative/neutral",
        "mention_count": 1
    }}
    ]

    Only include topics that are actually mentioned in the text. If a predefined topic isn't discussed, don't include it in the output.
    """

    # ai_model = genai.GenerativeModel('gemini-2.0-flash')
    # response = ai_model.generate_content(prompt)
    response = ai_client.models.generate_content(
        model = "gemini-2.0-flash",
        contents=prompt
    )
    cleaned_topics = clean_markdown_json(response.text)
    try:
        topics = json.loads(cleaned_topics)
    except Exception as e:
        topics = cleaned_topics  # Fallback if JSON parsing fails
    # print('sentiment:',mapped_label)
    # print('sentiment_class:',mapped_label_class)
    # print('raw_prediction:',prediction.tolist())
    # print('topics:',topics)
    return jsonify({
        'sentiment':mapped_label,
        'sentiment_class':mapped_label_class,
        'raw_prediction':prediction.tolist(),
        'topics':topics
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000,debug=True)