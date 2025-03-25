function paintRandomFlowerOnEdges() {
  flowers = [];

  if (demoMode) {
    console.log(
      `Demo Mode: Painting ${prevPositivityIntensity} positive flowers and ${params.negativityIntensity} flowers.`
    );

    for (let i = 0; i < prevPositivityIntensity; i++) {
      spawnFlowerOnEdge(positiveFlowers);
    }

    for (let j = 0; j < prevNegativityIntensity; j++) {
      spawnFlowerOnEdge(negativeFlowers);
    }
  } else {
    console.log(`Received ${sentiment} sentiment. Painting..`);
    if (sentiment === "positive") {
      spawnFlowerOnEdge(positiveFlowers);
    } else if (sentiment === "negative") {
      spawnFlowerOnEdge(negativeFlowers);
    } else if (sentiment === "neutral") {
      spawnFlowerOnEdge(neutralFlowers);
    }
  }
}

function spawnFlowerOnEdge(flowerImages) {
  let flowerSize = 100;
  let scaleFactor = 1;
  let scaledFlowerRadius = (flowerSize * scaleFactor) / 2;
  let maxRetries = 10;

  let x, y;
  let validPosition = false;
  let retryCount = 0;

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

  if (demoMode) {
    negativity = flowerImages === negativeFlowers;
  } else {
    negativity = sentiment === "negative";
  }
  flowers.push({
    img,
    x,
    y,
    lifespan: 400,
    negativity,
    xs: [],
    ys: [],
    colors: [],
    opacity: 255,
  });
}

function paintFlower(flower, img, x, y) {
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
    tint(255, alpha);
    image(
      flower.img,
      flower.x - flower.img.width / 2,
      flower.y - flower.img.height / 2
    );
  }
  if (millis() - flower.spawnTime > delay) {
    noTint();
    for (let i = 0; i < numSamples; i++) {
      let sourceX = floor(random(0, img.width));
      let sourceY = floor(random(0, img.height));
      let c = img.get(sourceX, sourceY);

      if (alpha(c) > 0) {
        let scaledX =
          x + (sourceX - img.width / 2) * scaleFactor + random(-1, 1);
        let scaledY =
          y + (sourceY - img.height / 2) * scaleFactor + random(-1, 1);

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
