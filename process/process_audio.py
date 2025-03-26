# OLLAMA_HOST=127.0.0.1:1122 ollama serve
# currently have samantha mistral model installed: https://ollama.com/library/samantha-mistral

import sys
import numpy as np
import requests
import json


# Send text to Ollama for sentiment analysis
ollama_api_url = "http://localhost:1122/api/generate"

server_url = "http://localhost:3000/upload-text"


def fetch_transcribed_text():
    try:
        response = requests.get(server_url)
        if response.status_code == 200:
            transcribed_text = response.text.strip()  # Get the text content
            print("Fetched transcribed text:", transcribed_text)
            return transcribed_text
        else:
            print(
                "Error fetching transcribed text:", response.status_code, response.text
            )
            return None
    except requests.exceptions.RequestException as e:
        print("Error connecting to the server:", e)
        return None


conversation_text = fetch_transcribed_text()


def generate_prompt(conversation_text):
    return f"""
    Classify the sentiment of the conversation. Determine if it is positive, neutral, or negative, and return the answer as the corresponding sentiment label: 'positive', 'neutral', or 'negative' with no explanation. 
    Additionally, based on the intensity of the sentiment, return the appropriate number of flowers (an integer from 0 to 10), where 0 represents no strong sentiment and 10 represents extreme positivity or negativity. 
    Format your response as: 
    "Sentiment: [positive/neutral/negative], Flowers: [integer]"

    Here is the conversation: {conversation_text}
    """


# Fetch the transcribed text from the server
conversation_text = fetch_transcribed_text()

if conversation_text:
    # Generate the prompt for the LLM
    prompt = generate_prompt(conversation_text)

    try:
        # Send the prompt to the LLM
        response = requests.post(
            ollama_api_url,
            json={"model": "gemma:2b", "prompt": prompt, "stream": False},
        )
        if response.status_code == 200:
            sentiment_analysis = response.json().get("response", "Error in response")
            sentiment_analysis = sentiment_analysis.lower()
            print("Before processing: ", sentiment_analysis)
            if "sentiment:" in sentiment_analysis and "flowers:" in sentiment_analysis:
                parts = sentiment_analysis.split(",")
                sentiment = parts[0].split(":")[1].strip()
                num_flower = int(parts[1].split(":")[1].strip())

                result = {"sentiment": sentiment, "numFlower": num_flower}
                result = json.dumps(result)
                print("Sentiment Analysis Result:", result)

                # Send the result to the server
                result_server_url = "http://localhost:3000/sentiment"
                server_response = requests.post(
                    result_server_url,
                    json={"sentiment": result},
                    headers={"Content-Type": "application/json"},
                )
                if server_response.status_code == 200:
                    print("Sentiment successfully sent to the server.")
                else:
                    print(
                        "Error sending sentiment to the server:", server_response.text
                    )
            else:
                print("Unexpected response format:", sentiment_analysis)
        else:
            print("Error communicating with Ollama API:", response.text)

    except requests.exceptions.RequestException as e:
        print("Error connecting to Ollama API:", e)
else:
    print("No transcribed text available to process.")
