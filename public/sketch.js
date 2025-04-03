let silenceTimer;
let flowers = [];
let flowerLayer;
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
let deleteFlower;
let handpose;
let hand;
let prevPositivityIntensity = 0;
let prevNegativityIntensity = 0;
let gui;
let toggleButton;
let blocks = [];
let isDragging = false;

const socket = io();

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
  let targetWidth = 150;
  let targetHeight = 150;

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
}

function setup() {
  soundFile = new p5.SoundFile();

  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.size(windowWidth, windowHeight);

  video.hide();
  flowerLayer = createGraphics(windowWidth, windowHeight);

  speechRec = new p5.SpeechRec("en-US", gotSpeech);
  speechRec.continuous = true;
  speechRec.interimResults = false;

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
  push();
  translate(width / 2, height / 2);
  rotate(HALF_PI);
  image(video, -height / 2, -width / 2, height, width);
  pop();

  image(flowerLayer, 0, 0, width, height);
  for (let i = flowers.length - 1; i >= 0; i--) {
    let flower = flowers[i];
    paintFlower(flower);
  }

  for (let block of blocks) {
    fill(0, 0, 0);
    noStroke();
    rect(block.x, block.y, block.size, block.size);
  }

  if (selectedFlower) {
    selectedFlower.x = mouseX;
    selectedFlower.y = mouseY;

    flowerLayer.clear();
    image(
      selectedFlower.img,
      selectedFlower.x - selectedFlower.img.width / 2,
      selectedFlower.y - selectedFlower.img.height / 2
    );

    // isDragging = false;
  }
}

function mousePressed() {
  console.log("MOUSE: ", mouseX, mouseY);

  if (selectedFlower == null) {
    for (let flower of flowers) {
      let distance = dist(mouseX, mouseY, flower.x, flower.y);

      if (distance < 50) {
        selectedFlower = flower;
        console.log("FLOWER SELECTED");
        isDragging = true;
        break;
      }
    }
  }
}
function keyPressed() {
  // Check if the 'd' key is pressed
  if (key === "d" || key === "D") {
    if (selectedFlower) {
      // Find the index of the selected flower in the flowers array
      let index = flowers.indexOf(selectedFlower);

      // If the flower is found, remove it
      if (index !== -1) {
        console.log(
          "Deleting selected flower at:",
          selectedFlower.x,
          selectedFlower.y
        );
        flowers.splice(index, 1); // Remove the flower from the array
      }

      // Clear the selected flower
      selectedFlower = null;
      isDragging = false;
    }
  }
}
function mouseReleased() {
  if (selectedFlower && isDragging) {
    pixelateFlower(selectedFlower);
    selectedFlower = null;
  }

  isDragging = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function pixelateFlower(flower) {
  let pixelSize = 5;
  let img = flower.img;

  for (let x = 0; x < img.width; x += pixelSize) {
    for (let y = 0; y < img.height; y += pixelSize) {
      let c = img.get(x, y);

      if (alpha(c) > 0) {
        let canvasX = flower.x + x - img.width / 2;
        let canvasY = flower.y + y - img.height / 2;

        fill(c);
        noStroke();
        rect(canvasX, canvasY, pixelSize, pixelSize);
      }
    }
  }
}
