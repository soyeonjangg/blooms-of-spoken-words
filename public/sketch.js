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
let sentiment = "neutral";

let plantCol = [0, 255, 0, 150];
let params = {
  positivityIntensity: 0,
  negativityIntensity: 0,
  neutralityIntensity: 0,
  branchLength: 0.9,
};
let gui;
let toggleButton;
const socket = io();
let demoMode = true;

soundFile = new p5.SoundFile();

function setup() {
  clearLiveMode();

  createCanvas(windowWidth, windowHeight);
  // video = createCapture(VIDEO);
  // video.size(windowWidth, windowHeight);
  // video.hide(); // Hide default video element

  gui = createGui("Plant Controls");
  gui.show(); // since by default it's demo mode
  gui.addObject(params);

  if (!localStorage.getItem("liveMode")) {
    toggleButton = createButton("Turn Off Demo");
    toggleButton.class("toggle-button");

    console.log(demoMode);
    let guiX = 10;
    let guiY = 50;
    let guiHeight = 200;

    toggleButton.position(guiX, guiY - 40);
    // toggleButton.position(windowWidth - 130, 10); // Adjust the x and y values as needed
    toggleButton.mousePressed(() => {
      demoMode = !demoMode;
      if (demoMode) {
        gui.show();
        localStorage.setItem("liveMode", false);
        console.log("Demo mode enabled");
      } else {
        gui.hide();
        localStorage.setItem("liveMode", true);
        console.log("Demo mode disabled");
        toggleButton.hide();
      }
    });
  }
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

      if (sentiment === "positive") {
        len *= 1.1; // Increase branch length
        plantColor = [0, 255, 0, 150]; // Green color for healthy growth
        generate(); // Add new growth
      } else if (sentiment === "negative") {
        plantColor = [255, 0, 0, 150]; // Red color for withered state
      } else if (sentiment === "neutral") {
        plantColor = [200, 200, 0, 150]; // Yellow color for neutral state
      }
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
  // image(video, 0, 0, width, height);
  background(220); // only need it when video is disabled
  displayClock();

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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function clearLiveMode() {
  localStorage.removeItem("liveMode");
  console.log("liveMode cleared from localStorage");
}

function displayClock() {
  let now = new Date();

  // Get the current time
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // Get the current date
  let year = now.getFullYear();
  let month = nf(now.getMonth() + 1, 2);
  let day = nf(now.getDate(), 2);

  // Get the current day of the week
  let daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let dayOfWeek = daysOfWeek[now.getDay()];

  // Format the time as HH:MM:SS
  let timeString = nf(hours, 2) + ":" + nf(minutes, 2) + ":" + nf(seconds, 2);

  // Format the date as YYYY-MM-DD
  let dateString = year + "-" + month + "-" + day;
  noStroke();
  textSize(45);
  fill(0);
  textAlign(RIGHT, TOP);
  text(timeString, width - 10, 10);
  textSize(25);
  text(dayOfWeek, width - 10, 60);

  textSize(20);
  text(dateString, width - 10, 95);
}
