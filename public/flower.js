const MAX_FLOWERS = 50;

function paintRandomFlowerOnEdges() {
  // flowers = [];

  console.log(`Received ${sentiment} sentiment. Painting..`);
  if (sentiment === "positive") {
    spawnFlowerOnEdge(positiveFlowers);
  } else if (sentiment === "negative") {
    spawnFlowerOnEdge(negativeFlowers);
  } else if (sentiment === "neutral") {
    spawnFlowerOnEdge(neutralFlowers);
  }
}

function spawnFlowerOnEdge(flowerImages) {
  let initialSize = 150; // Initial size of the flower
  let scaleFactor = 1.5; // Increase the scale factor to accommodate rotation
  let scaledFlowerRadius = (initialSize * scaleFactor) / 2;
  let maxRetries = 10;

  let x, y;
  let validPosition = false;
  let retryCount = 0;

  console.log(mouseX, mouseY);
  while (!validPosition && retryCount < maxRetries) {
    let edge = floor(random(4));

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

    validPosition = true;

    for (let flower of flowers) {
      let d = dist(x, y, flower.x, flower.y);
      if (d < 200) {
        validPosition = false;
        break;
      }
    }

    retryCount++;
  }

  if (!validPosition) {
    console.log("Could not find a valid position for the new flower.");
    return;
  }

  let img = random(flowerImages);
  neutrality = sentiment === "neutral";

  let flowerGraphics = createGraphics(
    initialSize * scaleFactor,
    initialSize * scaleFactor
  );
  flowerGraphics.imageMode(CENTER);
  flowerGraphics.image(
    img,
    flowerGraphics.width / 2,
    flowerGraphics.height / 2,
    initialSize,
    initialSize
  );

  let rotation = random(HALF_PI); // Random angle between 0 and half PI
  flowers.push({
    img,
    x,
    y,
    lifespan: 400,
    neutrality,
    xs: [],
    ys: [],
    colors: [],
    opacity: 255,
    graphics: flowerGraphics,
    rotation,
    size: initialSize,
  });

  if (flowers.length > MAX_FLOWERS) {
    flowers.shift();
  }
}

function paintFlower(flower) {
  flowerLayer.push();

  let scaleFactor = 1;
  let numSamples = 400;

  let delay = 6000;
  if (!flower.spawnTime) {
    flower.spawnTime = millis();
  }

  let elapsedTime = millis() - flower.spawnTime;

  if (elapsedTime <= delay) {
    let alpha = map(elapsedTime, 0, delay, 255, 0);
    tint(255, flower.opacity); // Use the flower's opacity

    // Apply rotation and render the flower
    flowerLayer.translate(flower.x, flower.y);
    flowerLayer.rotate(flower.rotation);
    image(
      flower.graphics,
      -flower.graphics.width / 2,
      -flower.graphics.height / 2,
      flower.size,
      flower.size
    );
    flowerLayer.resetMatrix();
  }

  if (elapsedTime > delay) {
    noTint();

    for (let i = 0; i < numSamples; i++) {
      let sourceX = floor(random(0, flower.graphics.width));
      let sourceY = floor(random(0, flower.graphics.height));
      let c = flower.graphics.get(sourceX, sourceY);

      if (alpha(c) > 0) {
        let offsetX = sourceX - flower.graphics.width / 2;
        let offsetY = sourceY - flower.graphics.height / 2;

        // Apply rotation to the sampled coordinates
        let rotatedX =
          offsetX * cos(flower.rotation) - offsetY * sin(flower.rotation);
        let rotatedY =
          offsetX * sin(flower.rotation) + offsetY * cos(flower.rotation);

        let scaledX = flower.x + rotatedX * scaleFactor + random(-1, 1);
        let scaledY = flower.y + rotatedY * scaleFactor + random(-1, 1);

        flower.xs.push(scaledX);
        flower.ys.push(scaledY);
        flower.colors.push(c);

        flowerLayer.stroke(c);
        flowerLayer.strokeWeight(random(1, 4));
        flowerLayer.point(scaledX, scaledY);
      }
    }
  }

  flowerLayer.pop();
}
