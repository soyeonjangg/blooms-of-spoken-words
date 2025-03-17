# import sys
# from pywhispercpp.model import Model
import sys

from faster_whisper import WhisperModel


# Get the file path from the command-line arguments
if len(sys.argv) < 2:
    print("Usage: python process_audio.py <file_path>")
    sys.exit(1)
file_path = sys.argv[1]

# Transcribe the audio file
# model = Model(model="tiny")
print("IS IT HERE")
model_size = "large-v3"
# model = WhisperModel(model_size, device="cpu", compute_type="int8")
model = WhisperModel(
    model_size, device="cpu", cpu_threads=4, compute_type="int8", language="en"
)

segments, info = model.transcribe(file_path, beam_size=5)
segments = list(segments)
# segments = model.transcribe(file_path)

for segment in segments:
    print(segment.text)
print("File processed successfully!")

# Sentiment data to be sent to the server
# sentiment = "positive"  # This could be any sentiment like 'positive', 'negative', etc.

# # Now send the downloaded WAV file along with sentiment data to the server
# with open("downloaded_recording.wav", "rb") as audio_file:
#     files = {
#         "audio": ("recording.wav", audio_file, "audio/wav"),  # Send the WAV file
#     }
#     data = {"sentiment": sentiment}  # Include the sentiment data

#     # Send the POST request
#     upload_response = requests.post(upload_url, files=files, data=data)

# # Check the server's response
# if upload_response.status_code == 200:
#     print("Successfully uploaded the file with sentiment.")
#     print(
#         "Server Response:", upload_response.json()
#     )  # Assuming server returns JSON response
# else:
#     print(f"Error uploading the file: {upload_response.status_code}")
