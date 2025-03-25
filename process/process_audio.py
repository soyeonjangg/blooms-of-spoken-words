# OLLAMA_HOST=127.0.0.1:1122 ollama serve
# currently have samantha mistral model installed: https://ollama.com/library/samantha-mistral

import sys
from faster_whisper import WhisperModel
import numpy as np
import requests
import json

if len(sys.argv) < 2:
    print("Usage: python process_audio.py <file_path>")
    sys.exit(1)
file_path = sys.argv[1]

model_size = "large-v3"
model = WhisperModel(model_size, device="cpu", compute_type="int8")

segments, info = model.transcribe(file_path, beam_size=5, language="en")
conversation_text = " ".join([segment.text for segment in list(segments)])
print("Transcription:", conversation_text)


# Send text to Ollama for sentiment analysis
ollama_api_url = "http://localhost:1122/api/generate"


def generate_prompt(conversation_text):
    return f"""
    Classify the sentiment of the conversation. Determine if it is positive, neutral, or negative, and return the answer as the corresponding sentiment label: 'positive', 'neutral', or 'negative' with no explanation. 
    Additionally, based on the intensity of the sentiment, return the appropriate number of flowers (an integer from 0 to 10), where 0 represents no strong sentiment and 10 represents extreme positivity or negativity. 
    Format your response as: 
    "Sentiment: [positive/neutral/negative], Flowers: [integer]"

    Here is the conversation: {conversation_text}
    """


prompt = generate_prompt(conversation_text)

try:
    response = requests.post(
        ollama_api_url,
        json={"model": "llama3.1", "prompt": prompt, "stream": False},
    )
    if response.status_code == 200:
        sentiment_analysis = response.json().get("response", "Error in response")
        sentiment_analysis = sentiment_analysis.lower()

        if "sentiment:" in sentiment_analysis and "flowers:" in sentiment_analysis:
            parts = sentiment_analysis.split(",")
            sentiment = parts[0].split(":")[1].strip()
            num_flower = int(parts[1].split(":")[1].strip())

            # result = [sentiment, num_flower]
            # result = json.dumps(result)
            result = {"sentiment": sentiment, "numFlower": num_flower}
            result = json.dumps(result)
            print("Sentiment Analysis Result:", result)

            server_url = (
                "http://localhost:3000/sentiment"  # Replace with your server's endpoint
            )
            server_response = requests.post(
                server_url,
                json={"sentiment": result},
                headers={"Content-Type": "application/json"},
            )
            if server_response.status_code == 200:
                print("Sentiment successfully sent to the server.")
            else:
                print("Error sending sentiment to the server:", server_response.text)
        else:
            print("Unexpected response format: ", sentiment_analysis)
    else:
        print("Error communicating with Ollama API:", response.text)

except requests.exceptions.RequestException as e:
    print("Error connecting to Ollama API:", e)
