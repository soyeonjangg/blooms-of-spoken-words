# OLLAMA_HOST=127.0.0.1:1122 ollama serve
# currently have samantha mistral model installed: https://ollama.com/library/samantha-mistral

import sys
from faster_whisper import WhisperModel
import numpy as np
import requests

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
# prompt = f"Classify the sentiment of this conversation as either 'positive', 'neutral', or 'negative'. Respond with only one of these words and nothing else with no explanation: '{conversation_text}'"

prompt = f"Classify the sentiment of the conversation. Determine if it is positive, neutral, or negative, and return the answer as  the corresponding sentiment label 'positive' or 'neutral' or 'negative' with no explanation. Here is the conversation: {conversation_text}"

try:
    response = requests.post(
        ollama_api_url,
        json={"model": "llama3.1", "prompt": prompt, "stream": False},
    )
    if response.status_code == 200:
        sentiment_analysis = response.json().get("response", "Error in response")
        sentiment_analysis = sentiment_analysis.lower()

        print("Sentiment Analysis:", sentiment_analysis)

        # Send the sentiment back to the server
        server_url = (
            "http://localhost:3000/sentiment"  # Replace with your server's endpoint
        )
        server_response = requests.post(
            server_url,
            json={"sentiment": sentiment_analysis},
            headers={"Content-Type": "application/json"},  # Ensure correct content type
        )
        if server_response.status_code == 200:
            print("Sentiment successfully sent to the server.")
        else:
            print("Error sending sentiment to the server:", server_response.text)
    else:
        print("Error communicating with Ollama API:", response.text)

except requests.exceptions.RequestException as e:
    print("Error connecting to Ollama API:", e)
