function grassMaker(len, theta) {
  console.log("Drawing grass with length:", len);

  push();
  translate(width / 2, height); // Start at the bottom center of the canvas
  rotate(theta);
  let sw = map(len, sminLen, smaxLen, 1, 5);
  strokeWeight(sw);
  stroke(0, random(50, 100), 0, 255); // Random green color
  line(0, 0, 0, -len); // Draw the grass blade
  translate(0, -len); // Move to the tip of the blade
  if (len > sminLen) {
    grassMaker(len * 0.7, theta * 1.1); // Recursive call for smaller blades
  }
  pop();
}
