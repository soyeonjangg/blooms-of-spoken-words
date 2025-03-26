let debounceTimer = null; // Timer for debouncing

function gotSpeech() {
  if (speechRec.resultValue) {
    let recognizedText = speechRec.resultString; // Get the recognized text
    console.log("Recognized speech:", recognizedText);

    // Debounce the server request
    debounceSendToServer(recognizedText, 1000); // Wait 1 second before sending
  }
}

function debounceSendToServer(text, delay) {
  // Clear the previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set a new timer
  debounceTimer = setTimeout(() => {
    sendTextToServer(text); // Send the text to the server after the delay
  }, delay);
}

function sendTextToServer(text) {
  console.log("Sending recognized text to server:", text);

  fetch("http://localhost:3000/upload-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Specify JSON content type
    },
    body: JSON.stringify({ text: text }), // Send text as JSON
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
