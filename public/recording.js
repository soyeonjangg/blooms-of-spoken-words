let debounceTimer = null;

function gotSpeech() {
  if (speechRec.resultValue) {
    let recognizedText = speechRec.resultString;
    console.log("Recognized speech:", recognizedText);

    debounceSendToServer(recognizedText, 1000); // wait 1 second before sending
  }
}

function debounceSendToServer(text, delay) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    sendTextToServer(text); // send the text to the server after the delay
  }, delay);
}

function sendTextToServer(text) {
  console.log("Sending recognized text to server:", text);

  fetch("http://localhost:3000/upload-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // specify JSON content type
    },
    body: JSON.stringify({ text: text }), // send text as JSON
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Server Response from:", data);
    })
    .catch((error) => console.error("Error sending text to server:", error));
}
