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
var recording = false;
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
var background = 'gray';
var staticDotStyle = 'green';
var linearDotStyle = 'blue';
var quadraticDotStyle = 'yellow';
var cubicDotStyle = 'red';
var strokeStyle = 'black';
var lineWidth = 2;

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


//gif compilation logic
var gif, gifs = 0; 
var msgEl = document.createElement('p');
msgEl.textContent = 'Compiling GIF';
var msgBoard = document.querySelector('#msgboard');

function preview(blob) {
    msgEl.remove();
    var objurl = URL.createObjectURL(blob); 

    var link = document.createElement('a');
    link.setAttribute('href', objurl);
    link.setAttribute('target', '_blank');
    link.textContent = `See GIF ${gifs+1}`;

    msgBoard.appendChild(link);
    var br = document.createElement('br');
    msgBoard.appendChild(br);

    gifs++;
    prevMoment = null;
}

var prevMoment;
function recordFrame() {
    var currMoment = Date.now();
    if (!prevMoment) {
        prevMoment = currMoment;
    }
    var delay = currMoment - prevMoment;
    delay *= 4;
    gif.addFrame(canvas, {delay: delay});
    prevMoment = currMoment;
}

//draw function
var segments = [];
var drawingSegments = true, drawingDots = 1;

function draw() {
	context.fillStyle = background;
	context.fillRect(0, 0, canvas.width, canvas.height)

	//segments
	if (drawingSegments) {
		context.lineWidth = lineWidth;
		context.strokeStyle = 'black';
		if (staticPoints.length > 0) {
			drawPath(staticPoints);
		}
		context.strokeStyle = 'black';
		if (linearPoints.length > 0) {
			drawPath(linearPoints);
		}
		context.strokeStyle = 'black';
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

	if (recording) {
        recordFrame();
	}
}




//User interaction logic
var boundPoint = null;
function mousedown() {
	if (!(mouseX > 0 && mouseX < canvas.width && mouseY > 0 && mouseY < canvas.height)) {
		return;
	}

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
	} else if (staticPoints.length > 4) { 
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




//Infinite Shapes Logic
function infiniteShape(n, radius, depth, ratio) {
	let vertices = regularPolygon(n, radius);

	for (var i = 0; i < depth; i++) {
		vertices.push(lerp(
			vertices[vertices.length - n],
			vertices[vertices.length - n + 1],
			ratio
		));
	}

	return vertices;
}

function toRadians(degrees) {
	return degrees * Math.PI / 180;
}

function regularPolygon(n, radius) {
	let totalDegrees = (n - 3) * 180 + 180;
	let singleAngle = toRadians(360 / n);

	let origin = new Vector(canvas.width / 2, canvas.height / 2);

	let result = [];
	result.push(new Vector(origin.x + radius, origin.y + 0));
	for (var i = 1; i <= n; i++) {
		let offsetX = Math.cos(singleAngle * i) * radius;
		let offsetY = - Math.sin(singleAngle * i) * radius;
		result.push(new Vector(origin.x + offsetX, origin.y + offsetY));
	}
	
	return result;
}

function createInfiniteShape(n, radius, depth, ratio) {
	staticPoints = infiniteShape(n, radius, depth, ratio);
	createMovingPoints();
}




//User interaction 
var VC = document.getElementById('verticesCount');
var RAD = document.getElementById('radius');
var D = document.getElementById('depth');
var RAT = document.getElementById('ratio');

var IS_verticesCount = parseInt(VC.value);
var IS_radiusLength = parseFloat(RAD.value);
var IS_depth = parseInt(D.value);
var IS_ratio = parseFloat(RAT.value);

VC.addEventListener('change', function () {IS_verticesCount = parseInt(VC.value)});
RAD.addEventListener('change', function () {IS_radiusLength = parseFloat(RAD.value)});
D.addEventListener('change', function () {IS_depth = parseInt(D.value)});
RAT.addEventListener('change', function () {IS_ratio = parseFloat(RAT.value)});

var startButton = document.getElementById('creation');
startButton.addEventListener('click', function () {
	createInfiniteShape(IS_verticesCount, IS_radiusLength, IS_depth, IS_ratio);
});

var recButton = document.getElementById('rec');
var stopButton = document.getElementById('stop');

recButton.addEventListener('click', function (ev) {
    stopButton.style.display = 'block';
	ev.target.style.display = 'none';
    gif = new GIF({
        workers: 2,
        quality: 10
    });
    gif.on('finished', preview);
	recording = true;	
});


stopButton.addEventListener('click', function (ev) {
	recButton.style.display = 'block';
	ev.target.style.display = 'none';
    msgBoard.appendChild(msgEl);
	recording = false;
	gif.render();
});

var storage = window.localStorage;

function saveData(save) {
	storage.setItem(save, JSON.stringify(staticPoints));
}

function loadData(save) {
	var dots = JSON.parse(storage.getItem(save));
	staticPoints = [];
	for (var i = 0; i < dots.length; i++) {
		var p = dots[i];
		var x = p.x;
		var y = p.y;
		staticPoints.push( new Vector(x, y) );
	}
	createMovingPoints();
}

function deleteSave(save) {
    storage.removeItem(save);
    loadSavesList();
}

var savesList = document.querySelector('#savesboard > ol');

function appendSave(save) {
    var item = document.createElement('li');
    var loadButton = document.createElement('button');
    var delButton = document.createElement('button');
    loadButton.setAttribute('onclick', `loadData('${save}')`);
    delButton.setAttribute('onclick', `deleteSave('${save}')`);
    loadButton.textContent = save;
    delButton.textContent = 'Delete';

    item.appendChild(loadButton);
    item.appendChild(delButton);
    savesList.appendChild(item);
}

function loadSavesList() {
    savesList.innerHTML = '';
    for (var i = 0; i < storage.length; i++) {
        var save = storage.key(i);
        appendSave(save);
    }
}

document.querySelector('#save').addEventListener('click', function () {
    var save = document.querySelector('#savename').value;
    saveData(save);
    appendSave(save);
});

loadSavesList();
