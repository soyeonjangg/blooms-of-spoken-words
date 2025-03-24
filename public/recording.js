function startRecording() {
  if (mic.enabled && !recording) {
    console.log("Recording started...");
    recording = true;
    recorder.record(soundFile);
    isOnCooldown = true;

    soundFile.onended(stopRecording);
  } else {
    console.error("Microphone not enabled yet!");
  }
}

async function stopRecording() {
  console.log("should stop?");

  if (recorder && soundFile) {
    recording = false;
    recorder.stop();
    console.log("Stopped recording");

    try {
      await waitForSoundFileToLoad(soundFile);
      console.log("Sound file ready");
      sendAudioToServer(soundFile.getBlob());

      isOnCooldown = true;
      console.log("Cooldown started");
      silenceTimer = null;
      setTimeout(() => {
        isOnCooldown = false;
        console.log("Cooldown period ended");
      }, cooldownTime);
    } catch (err) {
      console.error("Error getting blob:", err);
    }
  } else {
    console.error("Recorder or SoundFile not initialized");
  }
}

async function waitForSoundFileToLoad(soundFile, maxWaitTime = 50000) {
  const interval = 100;
  let waited = 0;
  console.log("Waiting for sound file to load...");
  while (!soundFile.isLoaded()) {
    console.log("waiting?");
    if (waited >= maxWaitTime) {
      throw new Error("Sound file did not load in time");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
    waited += interval;
    console.log(waited);
  }
}

function sendAudioToServer(blob) {
  let formData = new FormData();
  formData.append("audio", blob, "audio.wav");

  fetch("http://localhost:3000/transcribe", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Transcription:", data.text);
      displayTranscription(data.text);
    })
    .catch((error) => console.error("Error:", error));
}

function displayTranscription(text) {
  let output = document.createElement("p");
  output.textContent = text;
  document.body.appendChild(output);
}
