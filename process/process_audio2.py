import sys
from faster_whisper import WhisperModel
from scipy.special import softmax
import numpy as np

print("HELLOP")
# Load model directly
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

if len(sys.argv) < 2:
    print("Usage: python process_audio.py <file_path>")
    sys.exit(1)
file_path = sys.argv[1]

model_size = "large-v3"
model = WhisperModel(model_size, device="cpu", compute_type="int8")

segments, info = model.transcribe(file_path, beam_size=5, language="en")
# segments = list(segments)
print(segments)
# for segment in segments:
#     print(segment.text)

tokenizer = DistilBertTokenizer.from_pretrained(
    "distilbert-base-uncased-finetuned-sst-2-english"
)
senti_model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased-finetuned-sst-2-english"
)

inputs = tokenizer("Hello, my dog is cute", return_tensors="pt")
with torch.no_grad():
    logits = senti_model(**inputs).logits

predicted_class_id = logits.argmax().item()
senti_model.config.id2label[predicted_class_id]


# encoded_input = tokenizer(segments, return_tensors="pt")
# output = senti_model(**encoded_input)
# scores = output[0][0].detach().numpy()
# scores = softmax(scores)

# ranking = np.argsort(scores)
# ranking = ranking[::-1]

# for i in range(scores.shape[0]):
#     l = config.id2label[ranking[i]]
#     s = scores[ranking[i]]
#     print(f"{i+1}) {l} {np.round(float(s), 4)}")
