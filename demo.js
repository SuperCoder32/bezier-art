class Vector {
	constructor(x = 0, y = 0){
		this.x = x;
		this.y = y;
	}
	add(vec2){
		return new Vector(this.x + vec2.x, this.y + vec2.y);
	}
	substract(vec2){
		return new Vector(this.x - vec2.x, this.y - vec2.y);
	}
	multiply(t){
		return new Vector(this.x * t, this.y * t);
	}

	static lerp(a, b, f){
		return a.add((b.substract(a).multiply(f)));
	}
	static quadraticCurve(a,b,c,f){
		var p0 = Vector.lerp(a,b,f);
		var p1 = Vector.lerp(b,c,f);
		return Vector.lerp(p0,p1,f);
	}
	static cubicCurve(a,b,c,d,f){
		var p0 = Vector.quadraticCurve(a,b,c,f);
		var p1 = Vector.quadraticCurve(b,c,d,f);
		return Vector.lerp(p0,p1,f);
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
}

class MovingPoint {
	constructor(startVec, posFunc, speed, oscillate = false) {
		this.x = startVec.x;
		this.y = startVec.y;
		this.progress = 0;
		this.posFunc = posFunc;
		this.speed = speed;
		this.oscillate = oscillate;
	}
	updatePos() {
		var newCoords = this.posFunc(this.progress);
		this.x = newCoords.x;
		this.y = newCoords.y;
	}
	move() {
		this.progress += this.speed;
		if (this.progress > 1 || this.progress < 0) {
			if (this.oscillate) {
				this.progress = (this.progress > 1 ? 1 : 0);
				this.speed = - this.speed;
			} else {
				this.progress = 0;
			}
		}
		this.updatePos();
	}
}



//Global variables
var movingDotSpeed = 0.005;
var oscillate = true;
var staticPoints = [];
var linearPoints = [];
var quadraticPoints = [];
var cubicPoints = [];

function createLinearPosFunc(a, b) {
	return function (progress) {
		return Vector.lerp(a, b, progress);
	}
}
function createQuadraticPosFunc(a, b, c) {
	return function (progress) {
		return Vector.quadraticCurve(a, b, c, progress);
	}
}
function createCubicPosFunc(a, b, c, d) {
	return function (progress) {
		return Vector.cubicCurve(a, b, c, d, progress);
	}
}

function createMovingPoints() {
	var newMovingPoint, posFunc;
	linearPoints = [];
	quadraticPoints = [];
	cubicPoints = [];

	//linear moving points
	for (var i = 0; i < staticPoints.length - 1; i++) {
		posFunc = createLinearPosFunc(staticPoints[i], staticPoints[i + 1]);
		newMovingPoint = new MovingPoint(staticPoints[i], posFunc, movingDotSpeed, oscillate);
		linearPoints.push(newMovingPoint);
	}

	//quadratic moving points
	for (var i = 0; i < staticPoints.length - 2; i++) {
		posFunc = createQuadraticPosFunc(staticPoints[i], staticPoints[i + 1], staticPoints[i + 2]);
		newMovingPoint = new MovingPoint(staticPoints[i], posFunc, movingDotSpeed, oscillate);
		quadraticPoints.push(newMovingPoint);
	}

	//cubic moving points
	for (var i = 0; i < staticPoints.length - 3; i++) {
		posFunc = createCubicPosFunc(staticPoints[i], staticPoints[i + 1], staticPoints[i + 2], staticPoints[i + 3]);
		newMovingPoint = new MovingPoint(staticPoints[i], posFunc, movingDotSpeed, oscillate);
		cubicPoints.push(newMovingPoint);
	}
}

//still buggy
function addMovingPoint() {
	var lastFour = [];
	for (var i = 4; i >= 1; i--) {
		lastFour.push(staticPoints[staticPoints.length - i]);
	}

	var globalProgress = linearPoints[0].progress; //every point has the same progress at each point in time
	var newMovingPoint;
	//linear moving points
	posFunc = createLinearPosFunc(lastFour[2], lastFour[3]);
	newMovingPoint = new MovingPoint(posFunc(globalProgress), posFunc, movingDotSpeed, oscillate);
	newMovingPoint.progress = globalProgress;
	linearPoints.push(newMovingPoint);

	//quadratic moving points
	posFunc = createQuadraticPosFunc(lastFour[1], lastFour[2], lastFour[3]);
	newMovingPoint = new MovingPoint(posFunc(globalProgress), posFunc, movingDotSpeed, oscillate);
	newMovingPoint.progress = globalProgress;
	quadraticPoints.push(newMovingPoint);

	//cubic moving points
	posFunc = createCubicPosFunc(lastFour[0], lastFour[1], lastFour[2], lastFour[3]);
	newMovingPoint = new MovingPoint(posFunc(globalProgress), posFunc, movingDotSpeed, oscillate);
	newMovingPoint.progress = globalProgress;
	cubicPoints.push(newMovingPoint);
}




//main loop
function update() {
	for (var i = 0; i < linearPoints.length; i++) {
		linearPoints[i].move();
	}
	for (var i = 0; i < quadraticPoints.length; i++) {
		quadraticPoints[i].move();
	}
	for (var i = 0; i < cubicPoints.length; i++) {
		cubicPoints[i].move();
	}
}

var staticDotRadius = 20, movingDotRadius = 10;
var staticDotStyle = "green";
var linearDotStyle = "blue";
var quadraticDotStyle = "yellow";
var cubicDotStyle = "red";
var strokeStyle = "black";
var lineWidth = 5;

function drawPath(points) {
	context.beginPath();
	context.moveTo(points[0].x, points[0].y);
	for (var i = 1; i < points.length; i++) {
		context.lineTo(points[i].x, points[i].y);
	}
	context.stroke();
}

function drawPoint(point, radius, style) {
	context.fillStyle = style;
	context.beginPath();
	context.arc(point.x, point.y, radius, 0, 2 * Math.PI);
	context.fill();
}

function draw() {
	//segments
	context.strokeStyle = strokeStyle;
	context.lineWidth = lineWidth;
	if (staticPoints.length > 0) {
		drawPath(staticPoints);
	}
	if (linearPoints.length > 0) {
		drawPath(linearPoints);
	}
	if (quadraticPoints.length > 0) {
		drawPath(quadraticPoints);
	}

	//dots
	for (var i = 0; i < staticPoints.length; i++) {
		drawPoint(staticPoints[i], staticDotRadius, staticDotStyle);
	}
	for (var i = 0; i < linearPoints.length; i++) {
		drawPoint(linearPoints[i], movingDotRadius, linearDotStyle);
	}
	for (var i = 0; i < quadraticPoints.length; i++) {
		drawPoint(quadraticPoints[i], movingDotRadius, quadraticDotStyle);
	}
	for (var i = 0; i < cubicPoints.length; i++) {
		drawPoint(cubicPoints[i], movingDotRadius, cubicDotStyle);
	}
}




//User interaction logic
var boundPoint = null;
function mousedown() {
	//placing a point
	if (boundPoint) {
		boundPoint = null;
		return;
	}

	//moving a point
	var r = staticDotRadius;
	for (var i = 0; i < staticPoints.length; i++) {
		if (areColliding(staticPoints[i].x - r, staticPoints[i].y - r, r * 2, r * 2, mouseX, mouseY, 1, 1)) {
			boundPoint = staticPoints[i];
			return;
		}
	}

	//creating a point
	staticPoints.push(new Vector(mouseX, mouseY));
	boundPoint = staticPoints[staticPoints.length - 1];

	if (staticPoints.length >= 4) {
		createMovingPoints();
	} else if (staticPoints.length > 4) { //adding moving point is still buggy
		addMovingPoint();
	}
}

function mousemove() {
	if (boundPoint) {
		boundPoint.x = mouseX;
		boundPoint.y = mouseY;
	}
}

