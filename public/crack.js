class Crack {
  constructor(x, y, length, angle, depth) {
    this.x = x;
    this.y = y;
    this.length = 0; // Start with 0 length and grow
    this.maxLength = length;
    this.angle = angle;
    this.depth = depth;
  }

  grow(amount) {
    this.length = min(this.length + amount, this.maxLength);
  }

  show() {
    let endX = this.x + cos(this.angle) * this.length;
    let endY = this.y + sin(this.angle) * this.length;

    strokeWeight(map(negativityIntensity, 0, 100, 1, 4));
    stroke(0);
    line(this.x, this.y, endX, endY);
  }
}

// Function to grow existing cracks and add new ones if needed
function growCracks(amount) {
  // Grow all existing cracks
  for (let c of cracks) {
    c.grow(amount);
  }

  // If negativity increased significantly, add a new crack
  if (random() < map(amount, 0, 100, 0, 1)) {
    let newCrack = new Crack(
      random(width),
      random(height),
      random(50, 200),
      random(0, TWO_PI),
      0
    );
    cracks.push(newCrack);
  }
}
