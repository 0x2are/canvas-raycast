//initialise the grid array
function initGrid() {
  for (let y = 0; y < gridSize; ++y) {
    grid[y] = [];

    for (let x = 0; x < gridSize; ++x) {
      grid[y][x] = 0;
    }
  }
}


//return the value of a given cell
function gridVal(cx, cy) {
  let ans = undefined;
  const gy = grid[cy];

  if (gy != undefined) {
    const g = gy[cx];

    if (g != undefined) {
      ans = g;
    }
  }

  return ans;
}


//is the given cell full
function gridFull(cx, cy) {
  const val = gridVal(cx, cy)
  return val != undefined && val != 0;
}


//returns true if the cell that the
//given world position is in is full
function worldGridFull(px, py) {
  const cx = floor(px / cellSize);
  const cy = floor(py / cellSize);
  const oob = px < 0 || px >= width || py < 0 || py >= height;

  return oob ? true : gridFull(cx, cy);
}


//helper for drawing a line between two vectors
function vline(a,b) {
  line(a.x,a.y,b.x,b.y);
}


//helper for drawing a circle at a vector
function vcirc(v,r) {
  ellipse(v.x,v.y,r*2,r*2);
}


//return v rotated clockwise by a
function rotVec(v, a) {
  const sina = sin(-a);
  const cosa = cos(-a);
  const nv = v.copy();

  nv.x = v.x * cosa + v.y * sina;
  nv.y = v.y * cosa - v.x * sina;

  return nv;
}


//draw the grid's lines and cells
function drawMiniMap(xOff, yOff, w, h) {
  const pCellWidth = w / gridSize;
  const pCellHeight = h / gridSize;
  const pGridWidth = pCellWidth * gridSize;
  const pGridheight = pCellHeight * gridSize;

  stroke(hue, sat, 50);
  strokeWeight(0.5);
  //horizontal lines
  for (let y = 0; y <= gridSize; ++y) {
    const yVal = yOff + y * pCellHeight;
    line(xOff, yVal, xOff + pGridWidth, yVal);
  }

  //vertical lines
  for (let x = 0; x <= gridSize; ++x) {
    const xVal = xOff + x * pCellWidth;
    line(xVal, yOff, xVal, yOff + pGridheight);
  }

  //draw walls
  for (let y = 0; y < gridSize; ++y) {
    const row = grid[y];
    for (let x = 0; x < gridSize; ++x) {
      const val = row[x];

      if (val != 0) {
        fill(hue, sat, 50);
      }
      else {
        fill(hue,sat,5,0.5);
      }
      rect(xOff + x * pCellWidth, yOff + y * pCellHeight, pCellWidth, pCellHeight);
    }
  }

  const pXPos = xOff + pos.x / width * pGridWidth;
  const pYPos = yOff + pos.y / height * pGridheight;

  //draw player direction indicator
  stroke(255);
  const dir = p5.Vector.fromAngle(playerAng);
  dir.mult(pCellWidth);
  dir.add(createVector(pXPos,pYPos));
  line(pXPos, pYPos, dir.x, dir.y);

    //draw player
  fill(hue, sat, 50);
  ellipse(pXPos, pYPos, pCellWidth/2, pCellHeight/2);
}


//check if the given pixel coordinates are on
//a wall of the grid. The edges of the map are
//also considered to be walls
function wallAt(x, y) {
  const cy = Math.floor(y / cellSize);
  const cx = Math.floor(x / cellSize);
  const vLine = cx * cellSize - x == 0;
  const hLine = cy * cellSize - y == 0;
  let ans = x <= 0 || y <= 0 || x >= width ||
            y >= height || gridFull(cx, cy);

  if (!ans && vLine) {
    ans = gridFull(cx - 1, cy);
  }

  if (!ans && hLine) {
    ans = gridFull(cx, cy - 1);
  }

  if (!ans && hLine && vLine) {
    ans = gridFull(cx - 1, cy - 1);
  }

  return ans;
}


//calculate the amount to shift a given variable by
//to place it on a grid line. Positive is the direction
//to move in
function shift(dependant, positive) {
  //move amount to the gridline in the negative dir
  let nextCellNum = floor(dependant / cellSize);

  if (positive) {
    ++nextCellNum;
  }

  //calculate the difference between the next gridline
  //and the original coordinate
  return (nextCellNum * cellSize) - dependant;
}


//cast a ray from start in the given dir
//returns the first intercept point.
function rayCast(start,dir) {
  const [dx,dy] = [dir.x, dir.y];
  const fireVRay = dx != 0;
  const fireHRay = dy != 0;
  let [vx, vy] = [start.x, start.y];
  let [hx, hy] = [vx, vy];

  if (fireVRay) {
    const m = dy/dx;
    const positive = dx > 0;
    const shiftAmt = shift(vx, positive);

    vx += shiftAmt;
    vy += m * shiftAmt;

    //iterate ray steps
    const xStep = positive ? cellSize : -cellSize;
    const yStep = m * xStep;

    while (!wallAt(vx, vy)) {
      vx += xStep;
      vy += yStep;
    }
  }

  if (fireHRay) {
    const m = dx/dy;
    const positive = dy > 0;
    const shiftAmt = shift(hy, positive);

    hx += m * shiftAmt;
    hy += shiftAmt;

    //iterate ray steps
    const yStep = positive ? cellSize : -cellSize;
    const xStep = m * yStep;

    while (!wallAt(hx, hy)) {
      hx += xStep;
      hy += yStep;
    }
  }

  const vInt = createVector(vx, vy);
  const hInt = createVector(hx, hy);
  let ans = hInt;

  if (fireHRay && fireVRay) {
    //set ans to closest of v or h to the start
    const vMag = p5.Vector.sub(vInt,start).magSq();
    const hMag = p5.Vector.sub(hInt,start).magSq();

    ans = hMag < vMag ? hInt : vInt;
  }
  else if (fireVRay) {
    ans = vInt;
  }

  return ans;
}

const style = getComputedStyle(document.documentElement);
const hue = style.getPropertyValue("--accent-hue");
const sat = parseInt(style.getPropertyValue("--accent-sat"));


function drawFirstPerson(ints) {
  const halfWidth = width/2;
  noStroke();

  text(playerAng, 20, 700)
  fill(20);
  rect(0, height/2, width, height/2);

  const col = [152, 77, 238];

  for (let i = 0; i < hRes; ++i) {
    const ang = ints[i].ang - playerAng;
    const distToWall = ints[i].mag * cos(ang);
    const projHeight = (wallHeight / distToWall) * distToCam;
    const b = maxDist / distToWall;
    const ceilingBottom = halfWidth - projHeight/2;
    const x = i*pixelWidth;

    //wall
    fill(hue, sat, min(50,50 * b));
    rect(x, ceilingBottom, pixelWidth, projHeight);
  }
}


const gridSize = 16;
const hRes = 80;
const sensitivity = 0.004;
const moveSpeed = 1.5;
const grid = [];
let playerAng = 0;
let cellSize;
let pos,dir,cam;
let distToCam;
let pixelWidth;
let canvas;

const wallHeight = 128;
const maxDist = 50;

let drawMode = true;


function setup() {
  const p5Canvas = createCanvas(640,640);
  p5Canvas.parent('p5-holder');
  canvas = p5Canvas.canvas; //the html canvas object

  cellSize = width / gridSize;
  pixelWidth = width / hRes;

  pos = createVector(width/2, height/2);
  colorMode(HSL)

  //vectors for angle of 0
  dir = createVector(200,0);
  cam = createVector(0,100);
  distToCam = dir.mag();

  initGrid();
  document.addEventListener('mousemove', (e) => {
    if (!drawMode) {
      playerAng += e.movementX * sensitivity;
    }
  });
}


function draw() {
  background(0);

  if (drawMode) {
    drawMiniMap(0,0,width,height);
  }
  else {
    const dirRot = rotVec(dir, playerAng);
    const camRot = rotVec(cam, playerAng);

    const ints = [];
    //cast all rays and store the magnitudes
    for (let i = 0; i < hRes; ++i) {
      const frac = (i/(hRes-1) - 0.5) * 2
      const camFrac = p5.Vector.mult(camRot, frac);
      const rayDir = p5.Vector.add(dirRot, camFrac);

      const int = p5.Vector.sub(rayCast(pos, rayDir), pos);
      const mag = int.mag();
      const ang = int.heading();
      ints.push({mag, ang});
    }
    drawFirstPerson(ints);

    fill(255);
    drawMiniMap(0,height-152,150,150);
    control();
  }
}


function control() {
  if (isKeyPressed) {
    const mov = createVector(cos(playerAng), sin(playerAng));

    if (keyIsDown(SHIFT)) {
      mov.mult(moveSpeed * 2);
    }
    else {
      mov.mult(moveSpeed);
    }
    const xMov = mov.x;
    const yMov = mov.y;
    let nextX = pos.x;
    let nextY = pos.y;

    if (keyIsDown(87)) { //w
      nextX += xMov;
      nextY += yMov;
    }
    if (keyIsDown(83)) { //s
      nextX -= xMov;
      nextY -= yMov;
    }

    if (keyIsDown(65)) { //a
      nextX += yMov;
      nextY -= xMov;
    }
    if (keyIsDown(68)) { //d
      nextX -= yMov;
      nextY += xMov;
    }

    const canMoveX = !worldGridFull(nextX, pos.y);
    const canMoveY = !worldGridFull(pos.x, nextY);

    if (canMoveX) {
      pos.x = nextX;
    }

    if (canMoveY) {
      pos.y = nextY;
    }
  }

}


function keyPressed() {
  if (keyCode === CONTROL) {
    drawMode = !drawMode;

    if (drawMode) {
      document.exitPointerLock();
    }
    else {
      canvas.requestPointerLock();
    }
  }
  else if (keyCode == ('F').charCodeAt(0) && !drawMode) {
    canvas.requestPointerLock();
  }
}


function mousePressed() {
  if (drawMode) {
    const cellX = floor(mouseX / cellSize);
    const cellY = floor(mouseY / cellSize);
    const val = gridVal(cellX, cellY);

    if (val != undefined) {
      grid[cellY][cellX] = ! grid[cellY][cellX];
    }
  }
}
