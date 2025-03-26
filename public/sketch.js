let predictions = [];
let silenceTimer;
let flowers = [];
let flowerLayer, crackLayer;
let isProcessing = false; // Track whether the system is waiting for sentiment

let mic, recorder, soundFile, video, amplitude;
let recording = false;
let threshold = 0.015; //find an appropriate threshold
let stopTimer, stopTimerStart;
let delayTime = 30000;
let selectedFlower;

let sentiment = "neutral";
let neutrality;
let plantCol = [0, 255, 0, 150];
let params = {
  numNegativeSentiments: 0,
  numNegativeSentimentsMax: 50,
  numPositiveSentiments: 0,
  numPositiveSentimentsMax: 50,
  positivityIntensity: 0,
  negativityIntensity: 0,
  positivityIntensityMax: 10,
  negativityIntensityMax: 10,
};

// let lastDemoIntensity = 0;
let handpose;
let hand;
let prevPositivityIntensity = 0;
let prevNegativityIntensity = 0;
let gui;
let toggleButton;
let blocks = [];
const socket = io();

// let demoMode = true;
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

let positiveFlowers, negativeFlowers, neutralFlowers;
function preload() {
  let targetWidth = 150; // Set the desired width
  let targetHeight = 150; // Set the desired height

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

  pink_rose = loadImage("flowers/positive/pink_rose.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  rose_mary = loadImage("flowers/positive/rose_mary.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );

  strawberry_blossom = loadImage(
    "flowers/positive/strawberry_blossom.png",
    (img) => img.resize(targetWidth, targetHeight)
  );
  sweet_william = loadImage("flowers/positive/sweet_william.png", (img) =>
    img.resize(targetWidth, targetHeight)
  );
  crackedGlass = loadImage("crack.png");

  // Group flowers into arrays
  positiveFlowers = [
    acacia,
    bluebell,
    honeysuckle,
    ivy,
    lily_of_the_valley,
    pink_rose,
    rose_mary,
    strawberry_blossom,
    sweet_william,
  ];
  negativeFlowers = [
    buttercup,
    columbine,
    lavender,
    marigold,
    thistle,
    thorn_apple,
  ];
  neutralFlowers = negativeFlowers.concat(positiveFlowers);

  handpose = ml5.handPose(
    {
      flipped: true,
      maxHands: 1,
      modelType: "full",
    },
    () => {
      console.log("🚀 model loaded");
    }
  );
}

function setup() {
  clearLiveMode();
  soundFile = new p5.SoundFile();

  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });

  video.size(windowWidth, windowHeight);

  video.hide();
  flowerLayer = createGraphics(windowWidth, windowHeight);

  handpose.detectStart(video, (results) => {
    predictions = results; // Store predictions globally
  });

  speechRec = new p5.SpeechRec("en-US", gotSpeech); // Set language and callback
  speechRec.continuous = true; // Keep listening until stopped
  speechRec.interimResults = false; // Show partial results while speaking

  speechRec.start();

  socket.on("sentiment", (data) => {
    console.log(`Sentiment: ${data.sentiment}, Intensity: ${data.numFlower}`);
    if (data) {
      sentiment = data.sentiment;
      numFlower = data.numFlower;

      paintRandomFlowerOnEdges();

      if (sentiment === "negative") {
        let numPixels = floor(numFlower * 1.5);

        for (let i = 0; i < numPixels; i++) {
          let x = random(width);
          let y = random(height);
          let pixelSize = random(13, 35);
          blocks.push({ x, y, size: pixelSize });
        }
      } else if (sentiment === "positive") {
        numPixels = floor(numFlower / 2); // for 2 positivity intensity, can remove 1

        for (let i = 0; i < numPixels; i++) {
          if (blocks.length > 0) {
            let randomIndex = floor(random(blocks.length));
            blocks.splice(randomIndex, 1);
          }
        }
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
    paintFlower(flower);

    if (flower.neutrality) {
      flower.lifespan -= 1;
    }
    flower.size *= 0.99;

    if (flower.lifespan <= 0) {
      let i = flowers.indexOf(flower);
      flowers.splice(i, 1);
    }
  }

  for (let block of blocks) {
    fill(0, 0, 0);
    noStroke();
    rect(block.x, block.y, block.size, block.size);
    // imageMode(CENTER);
    // flowerLayer.image(crackedGlass, block.x, block.y, block.size, block.size);
  }

  hand = predictions[0];

  if (predictions.length > 0) {
    let hand = predictions[0]; // first hand detection

    let indexFinger = hand.keypoints[8]; // index finger tip
    let indexFinger2 = hand.keypoints[7];
    let indexFinger3 = hand.keypoints[6];
    let middleFinger = hand.keypoints[12];
    let middleFinger1 = hand.keypoints[11];
    let indexX = indexFinger.x;
    let indexY = indexFinger.y;

    fill(255, 0, 0);
    noStroke();
    circle(indexX, indexY, 20);

    for (let flower of flowers) {
      let distance = dist(indexX, indexY, flower.x, flower.y);
      console.log("distance", distance);
      if (distance < 50) {
        selectedFlower = flower;
        break;
      } else {
        selectedFlower = null;
      }
    }

    if (selectedFlower) {
      selectedFlower.x = indexX;
      selectedFlower.y = indexY;

      flowerLayer.clear();
      image(
        selectedFlower.img,
        selectedFlower.x - selectedFlower.img.width / 2,
        selectedFlower.y - selectedFlower.img.height / 2
      );
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

let numNegativity = 0;
let numPositivity = 0;

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
