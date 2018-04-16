'use strict'

function lerp(a, b, f){
	return a.add((b.substract(a).multiply(f)));
}

function quadraticCurve(a,b,c,f){
	var p0 = lerp(a,b,f);
	var p1 = lerp(b,c,f);
	return lerp(p0,p1,f);
}

function cubicCurve(a,b,c,d,f){
	var p0 = quadraticCurve(a,b,c,f);
	var p1 = quadraticCurve(b,c,d,f);
	return lerp(p0,p1,f);
}

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
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	getCopy() {
		return new Vector(this.x, this.y);
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
var started = false;
var movingDotSpeed = 0.005;
var oscillate = true;
var staticPoints = [];
var linearPoints = [];
var quadraticPoints = [];
var cubicPoints = [];

function createLinearPosFunc(a, b) {
	return function (progress) {
		return lerp(a, b, progress);
	}
}
function createQuadraticPosFunc(a, b, c) {
	return function (progress) {
		return quadraticCurve(a, b, c, progress);
	}
}
function createCubicPosFunc(a, b, c, d) {
	return function (progress) {
		return cubicCurve(a, b, c, d, progress);
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
var background = "gray";
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

var segments = [];
var drawingSegments = true, drawingDots = 1;
function draw() {
	context.fillStyle = background;
	context.fillRect(0, 0, canvas.width, canvas.height)

	//segments
	if (drawingSegments) {
		context.lineWidth = lineWidth;
		context.strokeStyle = staticDotStyle;
		if (staticPoints.length > 0) {
			drawPath(staticPoints);
		}
		context.strokeStyle = linearDotStyle;
		if (linearPoints.length > 0) {
			drawPath(linearPoints);
		}
		context.strokeStyle = quadraticDotStyle;
		if (quadraticPoints.length > 0) {
			drawPath(quadraticPoints);
		}
	}

	//dots
	if (drawingDots) {
		if (drawingDots != -1) {
			for (var i = 0; i < staticPoints.length; i++) {
				drawPoint(staticPoints[i], staticDotRadius, staticDotStyle);
			}
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

	if (started) {
		capturer.capture(canvas);
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
		if (recording && !started) {
			started = true;
			capturer.start();
		}
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

function keydown(keycode) {
	if (keycode == 32) {
		drawingSegments = !drawingSegments;
	}
	if (keycode == 13) {
		if (drawingDots == 1) {
			drawingDots = -1;
		} else {
			drawingDots++;
		}
	}
}

