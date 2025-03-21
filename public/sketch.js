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

  image(flowerLayer, 0, 0);

  for (let i = flowers.length - 1; i >= 0; i--) {
    let flower = flowers[i];

    // Draw the flower with its current fade progress and opacity
    paintFlower(flower, flower.img, flower.x, flower.y);

    if (flower.negativity) {
      // Decrease lifespan if it is greater than 0
      if (flower.lifespan > 0) {
        flower.lifespan--;
        continue; // Skip erasing logic until lifespan reaches 0
      }
      console.log(flower.lifespan);
      // Start erasing the flower after its lifespan ends
      for (let j = 0; j < flower.xs.length; j++) {
        if (Math.random() < 0.1) {
          // Control the erasing speed (adjust 0.1)
          flowerLayer.erase();
          flowerLayer.stroke(255);
          flowerLayer.strokeWeight(5);
          flowerLayer.point(flower.xs[j], flower.ys[j]);
          flowerLayer.noErase();
        }
      }

      // Gradually reduce the flower's overall opacity
      flower.opacity = max(flower.opacity - 1, 0); // Adjust the reduction speed (adjust 1)

      // Remove the flower from the array if fully erased
      if (flower.opacity <= 0) {
        flowers.splice(i, 1);
      }
    }
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

  if (demoMode) {
    // Spawn flowers based on intensity values
    for (let i = 0; i < params.positivityIntensity; i++) {
      spawnFlowerOnEdge(positiveFlowers);
    }
    for (let i = 0; i < params.negativityIntensity; i++) {
      spawnFlowerOnEdge(negativeFlowers);
    }
  } else {
    if (sentiment === "positive") {
      spawnFlowerOnEdge(positiveFlowers);
    } else if (sentiment === "negative") {
      spawnFlowerOnEdge(negativeFlowers);
    }
  }
}

function spawnFlowerOnEdge(flowerImages) {
  let flowerSize = 100; // Approximate original size of the flower image
  let scaleFactor = 1; // Same scale factor used in paintFlower()
  let scaledFlowerRadius = (flowerSize * scaleFactor) / 2;
  let maxRetries = 10; // Prevent infinite loops

  let x, y;
  let validPosition = false;
  let retryCount = 0;

  while (!validPosition && retryCount < maxRetries) {
    let edge = floor(random(4)); // Randomly select one of the four edges

    // Determine the position based on the selected edge
    switch (edge) {
      case 0: // Top edge
        x = random(scaledFlowerRadius, width - scaledFlowerRadius);
        y = scaledFlowerRadius;
        break;
      case 1: // Bottom edge
        x = random(scaledFlowerRadius, width - scaledFlowerRadius);
        y = height - scaledFlowerRadius;
        break;
      case 2: // Left edge
        x = scaledFlowerRadius;
        y = random(scaledFlowerRadius, height - scaledFlowerRadius);
        break;
      case 3: // Right edge
        x = width - scaledFlowerRadius;
        y = random(scaledFlowerRadius, height - scaledFlowerRadius);
        break;
    }

    // Check if the position is too close to an existing flower
    validPosition = true;

    for (let flower of flowers) {
      let d = dist(x, y, flower.x, flower.y);
      if (d < flowerSize * scaleFactor * 5) {
        validPosition = false;
        break;
      }
    }

    retryCount++;
  }

  if (!validPosition) {
    console.log("Could not find a valid position for the new flower.");
    return; // Exit if a valid spot isn't found
  }

  let img = random(flowerImages);

  // Ensure negativity is a boolean
  if (demoMode) {
    negativity = flowerImages === negativeFlowers;
  } else {
    negativity = sentiment === "negative";
  }

  // Add the flower to the array with an initial opacity of 255
  flowers.push({
    img,
    x,
    y,
    lifespan: 400,
    negativity,
    xs: [],
    ys: [],
    colors: [],
    opacity: 255, // Initialize opacity
  });
}

function paintFlower(flower, img, x, y) {
  flowerLayer.push();

  // If the flower is not fading out, paint it as usual
  let scaleFactor = 1; // Keep the scale factor constant for now
  let numSamples = 400; // Number of points to sample

  for (let i = 0; i < numSamples; i++) {
    let sourceX = floor(random(0, img.width));
    let sourceY = floor(random(0, img.height));
    let c = img.get(sourceX, sourceY); // Get the color of the pixel

    // Only draw points for non-transparent pixels
    if (alpha(c) > 0) {
      // Scale the position of the pixel
      let scaledX = x + (sourceX - img.width / 2) * scaleFactor + random(-1, 1); // Add slight randomness to position
      let scaledY =
        y + (sourceY - img.height / 2) * scaleFactor + random(-1, 1); // Add slight randomness to position

      if (
        scaledX >= width - 200 &&
        scaledX <= width &&
        scaledY >= 0 &&
        scaledY <= 120
      ) {
        continue;
      }

      // Store the point's x, y, and color in the flower object
      flower.xs.push(scaledX);
      flower.ys.push(scaledY);
      flower.colors.push(c);

      // Draw the point
      flowerLayer.stroke(c);
      flowerLayer.strokeWeight(random(1, 4)); // Randomize point size for a more natural look
      flowerLayer.point(scaledX, scaledY);
    }
  }

  flowerLayer.pop();
}

function paramChanged() {
  flowerLayer.clear();
  paintRandomFlowerOnEdges();
}
