let axiom = "-X";
let sentence = axiom;
let len;
let angle;
let rules = [
  { a: "X", b: "F+[[X]-X]-F[-FX]+X" },
  { a: "F", b: "FF" },
];
let silenceTimer;

// Speech recognition
let mic, recorder, soundFile, video, amplitude;
let recording = false;
let threshold = 0.05;
let stopTimer, stopTimerStart;
let delayTime = 30000;

let cooldownTimer;
let cooldownTime = 300000; // 5 minutes in milliseconds
let isOnCooldown = false;

soundFile = new p5.SoundFile();
const socket = io();

function setup() {
  createCanvas(windowWidth, windowHeight);

  // video = createCapture(VIDEO);
  // video.hide(); // Hide default video element

  angle = radians(25);
  len = height / 3;

  mic = new p5.AudioIn();

  recorder = new p5.SoundRecorder();
  recorder.setInput(mic);

  amplitude = new p5.Amplitude();
  amplitude.setInput(mic);

  console.log("recorder init,", recorder);
  if (!mic.enabled) {
    mic.start(() => {
      console.log("Mic started");
    });
  }

  socket.on("sentiment", (data) => {
    if (data.sentiment) {
      sentiment = `Sentiment: ${data.sentiment}`;
      console.log("Updated sentiment:", sentiment);
    }
  });

  socket.on("connect", () => {
    console.log("Connected to Socket.IO server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server");
  });
}

function draw() {
  turtle();

  if (mic) {
    let vol = amplitude.getLevel();

    if (vol >= threshold) {
      if (!recording && !isOnCooldown) {
        // Start recording if not already recording and not on cooldown
        startRecording();
        console.log("Recording started because volume >= threshold:", vol);
      }

      if (recording) {
        // Reset the silence timer if people are still talking
        clearTimeout(silenceTimer);
        silenceTimer = null;
        console.log(
          "Resetting silence timer because people are still talking:",
          vol
        );
      }
    } else if (vol < threshold && recording && !silenceTimer) {
      // Start the silence timer if volume is below the threshold
      console.log("Starting silence timer because volume < threshold:", vol);
      silenceTimer = setTimeout(stopRecording, 20000); // Stop recording after 20 seconds of silence
    }
  }
}

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
  len *= 0.9;

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
