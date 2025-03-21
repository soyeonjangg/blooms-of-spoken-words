// https://youtu.be/Y3UfVRQ3S_8?si=BhY5OZYGQHZvMeUV

let axiom = "-X";
let sentence = axiom;
let len;
let angle;
let rules = [
  { a: "X", b: "F+[[X]-X]-F[-FX]+X" },
  { a: "F", b: "FF" },
];
let silenceTimer;
let flowers = [];
let flowerLayer;
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
let negativity;
let plantCol = [0, 255, 0, 150];
let params = {
  positivityIntensity: 0,
  negativityIntensity: 0,
  positivityIntensityMax: 10,
  negativityIntensityMax: 10,
};
let prevPositivityIntensity = 0;
let prevNegativityIntensity = 0;
let gui;
let toggleButton;
const socket = io();
let demoMode = true;
let buttercup,
  marigold,
  org_lily,
  y_carnation,
  bluebell,
  daffodil,
  lavender,
  sunflower,
  sweet_pea,
  fern,
  ivy,
  mistle_toe,
  olive_branch,
  white_rose,
  acacia,
  honeysuckle,
  pink_rose;
const getStatus = { loading: false, error: false };

let positiveFlowers, negativeFlowers;
soundFile = new p5.SoundFile();
function preload() {
  // Define the desired size for all images
  let targetWidth = 200; // Set the desired width
  let targetHeight = 200; // Set the desired height

  // negative flowers
  buttercup = loadImage("flowers/negative/buttercup.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  columbine = loadImage("flowers/negative/columbine.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  lavender = loadImage("flowers/negative/lavender.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  marigold = loadImage("flowers/negative/marigold.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  nettle = loadImage("flowers/negative/nettle.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  thistle = loadImage("flowers/negative/thistle.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  thorn_apple = loadImage("flowers/negative/thorn_apple.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );

  // positive flowers
  acacia = loadImage("flowers/positive/acacia.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  bluebell = loadImage("flowers/positive/bluebell.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  honeysuckle = loadImage("flowers/positive/honeysuckle.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  ivy = loadImage("flowers/positive/ivy.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  lily_of_the_valley = loadImage(
    "flowers/positive/lily_of_the_valley.png",
    (img) => img.resize(targetWidth, targetHeight)
  );
  myrtle = loadImage("flowers/positive/myrtle.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  pink_rose = loadImage("flowers/positive/pink_rose.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  rose_mary = loadImage("flowers/positive/rose_mary.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  snowdrop = loadImage("flowers/positive/snowdrop.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  strawberry_blossom = loadImage(
    "flowers/positive/strawberry_blossom.png",
    (img) => img.resize(targetWidth, targetHeight)
  );
  sweet_william = loadImage("flowers/positive/sweet_william.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );

  // Group flowers into arrays
  positiveFlowers = [
    acacia,
    bluebell,
    honeysuckle,
    ivy,
    lily_of_the_valley,
    myrtle,
    pink_rose,
    rose_mary,
    snowdrop,
    strawberry_blossom,
    sweet_william,
  ];
  negativeFlowers = [
    buttercup,
    columbine,
    lavender,
    marigold,
    nettle,
    thistle,
    thorn_apple,
  ];
}
let cracks = []; // Array to store cracks

function setup() {
  clearLiveMode();

  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();
  flowerLayer = createGraphics(windowWidth, windowHeight);
  createSettingsGui(params, { callback: paramChanged, load: false });

  _paramGui.show(); // since by default it's demo mode

  if (!localStorage.getItem("liveMode")) {
    toggleButton = createButton("Turn Off Demo");
    toggleButton.class("toggle-button");

    console.log(demoMode);
    let guiX = 10;
    let guiY = 50;
    let guiHeight = 200;

    toggleButton.position(guiX, guiY - 40);
    toggleButton.mousePressed(() => {
      demoMode = !demoMode;
      if (demoMode) {
        _paramGui.show();
        localStorage.setItem("liveMode", false);
        console.log("Demo mode enabled");
      } else {
        _paramGui.hide();
        localStorage.setItem("liveMode", true);
        console.log("Demo mode disabled");
        toggleButton.hide();
        flowerLayer.clear();
        flowers = [];
      }
    });
  }

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

      paintRandomFlowerOnEdges();

      if (data.sentiment === "negative") {
        addCrack();
      } else if (data.sentiment === "positive") {
        repairCrack();
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
  image(video, 0, 0, width, height);
  // background(220); // only need it when video is disabled
  // noFill();
  // stroke(255, 0, 0);
  // rect(width - 200, 0, 200, 120); // Adjust these values to match the clock area

  image(flowerLayer, 0, 0);

  for (let i = flowers.length - 1; i >= 0; i--) {
    let flower = flowers[i];

    // Draw the flower with its current fade progress and opacity
    paintFlower(flower, flower.img, flower.x, flower.y);

    // if (flower.negativity) {
    //   // Decrease lifespan if it is greater than 0
    //   if (flower.lifespan > 0) {
    //     flower.lifespan--;
    //     continue; // Skip erasing logic until lifespan reaches 0
    //   }
    //   console.log(flower.lifespan);
    //   // Start erasing the flower after its lifespan ends
    //   for (let j = 0; j < flower.xs.length; j++) {
    //     if (Math.random() < 0.1) {
    //       // Control the erasing speed (adjust 0.1)
    //       flowerLayer.erase();
    //       flowerLayer.stroke(255);
    //       flowerLayer.strokeWeight(5);
    //       flowerLayer.point(flower.xs[j], flower.ys[j]);
    //       flowerLayer.noErase();
    //     }
    //   }

    //   // Gradually reduce the flower's overall opacity
    //   flower.opacity = max(flower.opacity - 1, 0); // Adjust the reduction speed (adjust 1)

    //   // Remove the flower from the array if fully erased
    //   if (flower.opacity <= 0) {
    //     flowers.splice(i, 1);
    //   }
    // }
  }

  // Check if GUI values have change
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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function clearLiveMode() {
  localStorage.removeItem("liveMode");
  console.log("liveMode cleared from localStorage");
}

function paramChanged() {
  flowerLayer.clear();
  paintRandomFlowerOnEdges();
}
