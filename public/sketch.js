let predictions = [];
let silenceTimer;
let flowers = [];
let flowerLayer, crackLayer;

let mic, recorder, soundFile, video, amplitude;
let recording = false;
let threshold = 0.05;
let stopTimer, stopTimerStart;
let delayTime = 30000;
let selectedFlower;

let cooldownTimer;
let cooldownTime = 300000;
let isOnCooldown = false;
let sentiment = "neutral";
let negativity;
let plantCol = [0, 255, 0, 150];

let params = {
  positivityIntensity: 0,
  negativityIntensity: 0,
  positivityIntensityMax: 15,
  negativityIntensityMax: 15,
};
let lastDemoIntensity = 0;
let handpose;
let hand;
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

  handpose = ml5.handPose(
    // model options
    {
      flipped: true, // mirror the predictions to match video
      maxHands: 1,
      modelType: "full",
    },
    // callback when loaded
    () => {
      console.log("🚀 model loaded");
    }
  );
}

function setup() {
  clearLiveMode();

  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });

  video.size(windowWidth, windowHeight);

  video.hide();
  flowerLayer = createGraphics(windowWidth, windowHeight);

  createSettingsGui(params, { callback: paramChanged, load: false });

  _paramGui.show();

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

  handpose.detectStart(video, (results) => {
    predictions = results; // Store predictions globally
  });
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
        addCrack(1);
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

  image(flowerLayer, 0, 0);

  for (let i = flowers.length - 1; i >= 0; i--) {
    let flower = flowers[i];
    paintFlower(flower, flower.img, flower.x, flower.y);
  }

  hand = predictions[0];

  if (predictions.length > 0) {
    let hand = predictions[0]; // first hand detection
    let indexFinger = hand.keypoints[8]; // index finger tip
    let thumb = hand.keypoints[4];
    let middleFinger = hand.keypoints[12];

    let indexX = indexFinger.x;
    let indexY = indexFinger.y;

    fill(255, 0, 0);
    noStroke();
    circle(indexX, indexY, 20);

    for (let flower of flowers) {
      let distance = dist(indexX, indexY, flower.x, flower.y);
      console.log("distance", distance);
      if (
        distance < 50 // Adjust this threshold based on flower size
      ) {
        selectedFlower = flower; // Select the flower
        break;
      } else {
        selectedFlower = null;
      }
    }

    if (selectedFlower) {
      selectedFlower.x = indexX; // Update flower's x position
      selectedFlower.y = indexY; // Update flower's y position

      flowerLayer.clear();
      image(
        selectedFlower.img,
        selectedFlower.x - selectedFlower.img.width / 2,
        selectedFlower.y - selectedFlower.img.height / 2
      );
    }
  }

  if (mic) {
    let vol = amplitude.getLevel();

    if (vol >= threshold) {
      if (!recording && !isOnCooldown) {
        startRecording();
        console.log("Recording started because volume >= threshold:", vol);
      }

      if (recording) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
        console.log(
          "Resetting silence timer because people are still talking:",
          vol
        );
      }
    } else if (vol < threshold && recording && !silenceTimer) {
      console.log("Starting silence timer because volume < threshold:", vol);
      silenceTimer = setTimeout(stopRecording, 20000);
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

function paramChanged() {
  flowerLayer.clear();
  paintRandomFlowerOnEdges();
}

const colours = [
  "Red",
  "OrangeRed",
  "Gold",
  "Lime",
  "Turquoise",
  "DodgerBlue",
  "Blue",
  "DarkMagenta",
];

function drawKeypoints(hand, i) {
  const c = color(colours[i % colours.length]);
  fill(c);
  noStroke();
  if (hand) {
    circle(hand.keypoints[i].x, hand.keypoints[i].y, 20);
  }
}
