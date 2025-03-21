function drawCracks() {
  for (let crack of cracks) {
    let endX = crack.startX + cos(crack.angle) * crack.length;
    let endY = crack.startY + sin(crack.angle) * crack.length;

    if (crack.repaired) {
      // Draw the crack as a golden line if repaired
      stroke(255, 215, 0); // Gold color
      strokeWeight(3); // Slightly thicker for repaired cracks
    } else {
      // Draw the crack as a normal white line
      stroke(255); // White color
      strokeWeight(2);
    }

    line(crack.startX, crack.startY, endX, endY);

    // Animate the crack growth if not repaired
    if (!crack.repaired && crack.length < crack.maxLength) {
      crack.length += 2; // Adjust the growth speed
    }
  }
}

function addCrack() {
  let startX = random(width);
  let startY = random(height);
  let angle = random(TWO_PI);
  let length = 0;
  let maxLength = random(50, 200);

  cracks.push({ startX, startY, angle, length, maxLength, repaired: false });
}
function repairCrack() {
  for (let crack of cracks) {
    if (!crack.repaired) {
      crack.repaired = true; // Mark the crack as repaired
      break; // Repair one crack at a time
    }
  }
}
