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
  neutralityIntensity: 0,
  positivityIntensityMax: 10,
  negativityIntensityMax: 10,
  neutralityIntensityMax: 10,
};
let prevPositivityIntensity = 0;
let prevNegativityIntensity = 0;
let prevNeutralityIntensity = 0;
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
  white_rose;

soundFile = new p5.SoundFile();

function preload() {
  // negative
  buttercup = loadImage("flowers/negative/buttercup.png");
  marigold = loadImage("flowers/negative/marigold.png");
  org_lily = loadImage("flowers/negative/orange_lily.png");
  y_carnation = loadImage("flowers/negative/yellow carnation.png");

  // positive
  bluebell = loadImage("flowers/positive/bluebell.png");
  daffodil = loadImage("flowers/positive/daffodil.png");
  lavender = loadImage("flowers/positive/lavender.png");
  sunflower = loadImage("flowers/positive/sunflower.png");
  sweet_pea = loadImage("flowers/positive/sweet_pea.png");

  // neutral
  fern = loadImage("flowers/neutral/fern.png");
  ivy = loadImage("flowers/neutral/ivy.png");
  mistle_toe = loadImage("flowers/neutral/mistle_toe.png");
  olive_branch = loadImage("flowers/neutral/olive_branch.png");
  white_rose = loadImage("flowers/neutral/white_rose.png");
}

function setup() {
  clearLiveMode();

  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide(); // Hide default video element
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
  displayClock();
  // noFill();
  // stroke(255, 0, 0);
  // rect(width - 200, 0, 200, 120); // Adjust these values to match the clock area

  // for (let flower of flowers) {
  //   paintFlower(flower.img, flower.x, flower.y, flower.negativity);
  // }
  image(flowerLayer, 0, 0);

  for (let i = flowers.length - 1; i >= 0; i--) {
    let flower = flowers[i];

    // Apply fading logic only to negative flowers
    if (flower.negativity) {
      // Gradually increase fadeProgress and reduce opacity
      flower.fadeProgress += 0.002; // Adjust this value to control the speed of color change
      flower.opacity -= 1; // Gradually reduce opacity

      // Clamp fadeProgress and opacity to valid ranges
      flower.fadeProgress = constrain(flower.fadeProgress, 0, 1);
      flower.opacity = constrain(flower.opacity, 0, 255);

      // Remove the flower if fully faded
      if (flower.fadeProgress >= 1 && flower.opacity <= 0) {
        flowers.splice(i, 1);

        continue;
      }
    }
    // Draw the flower with its current fade progress and opacity
    paintFlower(
      flower.img,
      flower.x,
      flower.y,
      flower.fadeProgress,
      flower.opacity
    );
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

  let timeString = nf(hours, 2) + ":" + nf(minutes, 2) + ":" + nf(seconds, 2);

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

function paintRandomFlowerOnEdges() {
  flowers = [];

  let positiveFlowers = [bluebell, daffodil, lavender, sunflower, sweet_pea];
  let negativeFlowers = [buttercup, marigold, org_lily, y_carnation];
  let neutralFlowers = [fern, ivy, mistle_toe, olive_branch, white_rose];

  if (demoMode) {
    // Spawn flowers based on intensity values
    for (let i = 0; i < params.positivityIntensity; i++) {
      spawnFlowerOnEdge(positiveFlowers);
    }
    for (let i = 0; i < params.negativityIntensity; i++) {
      spawnFlowerOnEdge(negativeFlowers);
    }
    for (let i = 0; i < params.neutralityIntensity; i++) {
      spawnFlowerOnEdge(neutralFlowers);
    }
  } else {
    if (sentiment === "positive") {
      spawnFlowerOnEdge(positiveFlowers);
    } else if (sentiment === "negative") {
      spawnFlowerOnEdge(negativeFlowers);
    } else {
      spawnFlowerOnEdge(neutralFlowers);
    }
  }
}

function spawnFlowerOnEdge(flowerImages) {
  let x, y;

  let flowerSize = 100; // Approximate original size of the flower image
  let scaleFactor = 0.15; // Same scale factor used in paintFlower()
  let scaledFlowerRadius = (flowerSize * scaleFactor) / 2;
  let edge = floor(random(4));

  // Determine the position based on the selected edge
  switch (edge) {
    case 0: // Top edge
      x = random(scaledFlowerRadius, width - scaledFlowerRadius);
      y = scaledFlowerRadius + 30;
      break;
    case 1: // Bottom edge
      x = random(scaledFlowerRadius, width - scaledFlowerRadius);
      y = height - 45;
      break;
    case 2: // Left edge
      x = scaledFlowerRadius + 30;
      y = random(scaledFlowerRadius, height - scaledFlowerRadius);
      break;
    case 3: // Right edge
      x = width - scaledFlowerRadius - 25;
      y = random(scaledFlowerRadius, height - scaledFlowerRadius);
      break;
  }

  let img = random(flowerImages); // Select a random flower image

  if (demoMode) {
    negativity = params.negativityIntensity;
  } else {
    negativity = sentiment === "negative";
  }

  flowers.push({
    img,
    x,
    y,
    negativity, // true for negative flowers, false otherwise
    fadeProgress: 0, // Start with no fading
    opacity: 255, // Fully visible initially
  });
}

function paintFlower(img, x, y, fadeProgress, opacity) {
  flowerLayer.push();

  let scaleFactor = 0.25 * (1 - fadeProgress * 0.5); // Gradually shrink the flower
  let numSamples = 300; // Increase the number of pixels for a denser effect

  for (let i = 0; i < numSamples; i++) {
    let sourceX = floor(random(0, img.width));
    let sourceY = floor(random(0, img.height));
    let c = img.get(sourceX, sourceY); // Get the color of the pixel

    // Only draw points for non-transparent pixels
    if (alpha(c) > 0) {
      // Blend the color toward a darker brown with desaturation
      if (fadeProgress > 0) {
        let targetBrown = color(101, 67, 33); // Darker brown color
        let r = lerp(red(c), red(targetBrown), fadeProgress); // Blend red channel
        let g = lerp(green(c), green(targetBrown), fadeProgress); // Blend green channel
        let b = lerp(blue(c), blue(targetBrown), fadeProgress); // Blend blue channel

        // Add desaturation effect
        let avg = (r + g + b) / 3; // Calculate average for desaturation
        r = lerp(r, avg, fadeProgress * 0.5);
        g = lerp(g, avg, fadeProgress * 0.5);
        b = lerp(b, avg, fadeProgress * 0.5);

        // Add random noise to simulate wilting
        r += random(-10, 10) * fadeProgress;
        g += random(-10, 10) * fadeProgress;
        b += random(-10, 10) * fadeProgress;

        // Clamp color values to valid ranges
        r = constrain(r, 0, 255);
        g = constrain(g, 0, 255);
        b = constrain(b, 0, 255);

        c = color(r, g, b, opacity); // Apply the blended color with opacity
      }

      // Scale the position of the pixel
      let scaledX = x + (sourceX - img.width / 2) * scaleFactor + random(-1, 1); // Add slight randomness to position
      let scaledY =
        y + (sourceY - img.height / 2) * scaleFactor + random(-1, 1); // Add slight randomness to position

      // Avoid clock area
      if (
        scaledX >= width - 200 &&
        scaledX <= width &&
        scaledY >= 0 &&
        scaledY <= 120
      ) {
        continue;
      }

      // Draw the point
      flowerLayer.stroke(c);
      flowerLayer.strokeWeight(random(2, 6)); // Randomize point size for a more natural look
      flowerLayer.point(scaledX, scaledY);
    }
  }

  flowerLayer.pop();
}

function paramChanged() {
  flowerLayer.clear();
  paintRandomFlowerOnEdges();
}
