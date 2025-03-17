let axiom = "-X";
let sentence = axiom;
let len;
let angle;
let rules = [
  { a: "X", b: "F+[[X]-X]-F[-FX]+X" },
  { a: "F", b: "FF" },
];
let silenceTimer; // Timer to handle pauses

// Speech recognition
let mic, recorder, soundFile, video, amplitude;
let recording = false;
let threshold = 0.05;
let stopTimer, stopTimerStart; // Timer reference
let delayTime = 30000;

let cooldownTimer; // Cooldown timer reference
let cooldownTime = 300000; // 5 minutes in milliseconds
let isOnCooldown = false; // Instead of using null

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.hide(); // Hide default video element

  angle = radians(25);
  len = height / 3;

  // Setup mic
  mic = new p5.AudioIn();

  recorder = new p5.SoundRecorder();
  recorder.setInput(mic);

  amplitude = new p5.Amplitude();
  amplitude.setInput(mic);

  console.log("recorder init,", recorder);

  mic.start(() => {
    console.log("Mic started");
  });
}
soundFile = new p5.SoundFile();

function draw() {
  turtle(); // Draw the plant

  if (mic) {
    let vol = amplitude.getLevel();
    // console.log("Volume:", vol);
    if (vol >= threshold && !recording && !isOnCooldown) {
      startRecording();
      clearTimeout(silenceTimer); // Reset the silence timer
      console.log("vol >= threshold", vol);
    } else if (vol < threshold && recording && !silenceTimer) {
      // Start a silence timer, stop only if silence lasts 2 seconds
      // console.log("vol < threshold", vol);
      console.log("timer started", vol);
      silenceTimer = setTimeout(stopRecording, 10000);
    }
  }
}

function startRecording() {
  if (mic.enabled && !recording) {
    console.log("Recording started...");
    recording = true;
    recorder.record(soundFile);
    isOnCooldown = true;
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
      // Wait for soundFile to be ready
      await waitForSoundFileToLoad(soundFile);
      console.log("Sound file ready");
      sendAudioToServer(soundFile.getBlob());

      // Activate cooldown
      isOnCooldown = true;
      console.log("Cooldown started");
      silenceTimer = null;
      setTimeout(() => {
        isOnCooldown = false; // Reset cooldown after 5 minutes
        console.log("Cooldown period ended");
      }, cooldownTime);
    } catch (err) {
      console.error("Error getting blob:", err);
    }
  } else {
    console.error("Recorder or SoundFile not initialized");
  }
}

// Helper function to wait for soundFile to load
async function waitForSoundFileToLoad(soundFile, maxWaitTime = 50000) {
  const interval = 100; // Check every 100ms
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

function generate() {
  let nextSentence = "";
  len *= 0.5;

  for (let i = 0; i < sentence.length; i++) {
    let current = sentence.charAt(i);
    let found = false;

    for (let j = 0; j < rules.length; j++) {
      if (current == rules[j].a) {
        nextSentence += rules[j].b;
        found = true;
        break;
      }
    }
    if (!found) {
      nextSentence += current;
    }
  }

  sentence = nextSentence;
}

function turtle() {
  resetMatrix();
  translate(width / 2, height);
  stroke(0, 255, 0, 150);

  for (let i = 0; i < sentence.length; i++) {
    let current = sentence.charAt(i);

    if (current == "F") {
      line(0, 0, 0, -len);
      translate(0, -len);
    } else if (current == "+") {
      rotate(angle);
    } else if (current == "-") {
      rotate(-angle);
    } else if (current == "[") {
      push();
    } else if (current == "]") {
      pop();
    }
  }
}
