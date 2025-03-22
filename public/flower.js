function paintRandomFlowerOnEdges() {
  flowers = [];

  if (demoMode) {
    // Spawn flowers based on intensity values
    for (let i = 0; i < params.positivityIntensity; i++) {
      spawnFlowerOnEdge(positiveFlowers);
    }
    // for (let i = 0; i < params.negativityIntensity; i++) {
    //   spawnFlowerOnEdge(negativeFlowers);
    // }
  } else {
    if (sentiment === "positive") {
      spawnFlowerOnEdge(positiveFlowers);
    }
    // } else if (sentiment === "negative") {
    //   spawnFlowerOnEdge(negativeFlowers);
    // }
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

      // Store the point's x, y, and color in the flower object
      flower.xs.push(scaledX);
      flower.ys.push(scaledY);
      flower.colors.push(c);

      // Draw the point
      flowerLayer.stroke(c);
      flowerLayer.strokeWeight(random(1, 4));
      flowerLayer.point(scaledX, scaledY);
    }
  }

  flowerLayer.pop();
}
