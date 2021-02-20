let canvas
let ctx
let canvasImage

let pencilToolButton
let brushToolButton
let eraserToolButton

let brushXPoints = []
let brushYPoints = []
let brushDownPos = []

let drag = false
let drawColour = 'black'
let drawWidth = 2
let currentTool = 'pencil'
let canvasWidth = 256
let canvasHeight = 192

class ShapeBoundingBox {
	constructor(left, upper, width, height) {
		this.left = left
		this.upper = upper
		this.width = width
		this.height = height
	}
}

class Point {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}

let shapeBounds = new ShapeBoundingBox(0, 0, 0, 0)
let mouseDown = new Point(0, 0)
let loc = new Point(0, 0)

document.addEventListener('DOMContentLoaded', setupCanvas)

function setupCanvas() {
	canvas = document.getElementById('canvas')
	ctx = canvas.getContext('2d')
	ctx.strokeStyle = drawColour
	ctx.lineWidth = drawWidth
	canvas.addEventListener("mousedown", isMousePressed)
	canvas.addEventListener("mousemove", isMouseMoving)
	canvas.addEventListener("mouseup", isMouseReleased)
	
	// get GUI elements
	pencilToolButton = document.getElementById("tool-pencil")
	brushToolButton = document.getElementById("tool-brush")
	eraserToolButton = document.getElementById("tool-eraser")
}

function changeTool(tool) {
	pencilToolButton.src = "./res/buttons/pencil-tool-button.png"
	brushToolButton.src = "./res/buttons/brush-tool-button.png"
	eraserToolButton.src = "./res/buttons/eraser-tool-button.png"
	document.getElementById("tool-" + tool).src = "./res/buttons/" + tool + "-tool-button-clicked.png"
	currentTool = tool
}

// get mouse position relative to canvas
function getMousePos(x, y) {
	let canvasSize = canvas.getBoundingClientRect()
	
	pos = { x: (x - canvasSize.left) * (canvas.width / canvasSize.width),
	y: (y - canvasSize.top) * (canvas.height / canvasSize.height) }
	
	return pos
}

function getCanvasImage() {
	canvasImage = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

// refresh canvas 
function redrawCanvasImage() {
	ctx.putImageData(canvasImage, 0, 0)
}

function addBrushPoint(x, y, mouseDown) {
	brushXPoints.push(x)
	brushYPoints.push(y)
	brushDownPos.push(mouseDown)
}

function drawBrush() {
	for(let i = 1; i < brushXPoints.length; i++) {
		ctx.beginPath()
		if(brushDownPos[i]) {
			ctx.moveTo(brushXPoints[i - 1], brushYPoints[i - 1])
		}else {
			ctx.moveTo(brushXPoints[i] - 1, brushYPoints[i])
		}
		ctx.lineTo(brushXPoints[i], brushYPoints[i])
		ctx.closePath()
		ctx.stroke()
	}
}

function isMousePressed(evt) {
	canvas.style.cursor = "crosshair"
	loc = getMousePos(evt.clientX, evt.clientY)
	getCanvasImage()
	mouseDown.x = loc.x
	mouseDown.y = loc.y
	drag = true
	
	if(currentTool === "pencil") {
		ctx.fillStyle = "rgba(0, 0, 0, 1)"
		ctx.fillRect(loc.x, loc.y, 2, 2)
	}else if(currentTool === "brush") {
		ctx.fillStyle = "rgba(0, 0, 0, 1)"
		if(((loc.x - 1) % 3) == 0 && ((loc.y - 1) % 3) == 0) 
			ctx.fillRect(loc.x, loc.y, 1, 1)
	}else if(currentTool === "eraser") {
		ctx.fillStyle = "rgba(255, 255, 255, 1)"
		ctx.fillRect(loc.x, loc.y, 1, 1)
	}
}

function isMouseMoving(evt) {
	canvas.style.cursor = "crosshair"
	loc = getMousePos(evt.clientX, evt.clientY)
	
	if(drag) {
		if(currentTool === "pencil") {
			/*
			if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight) {
				addBrushPoint(loc.x, loc.y)
			}
			redrawCanvasImage()
			drawBrush()*/
			ctx.fillStyle = "rgba(0, 0, 0, 1)"
			ctx.fillRect(loc.x, loc.y, 2, 2)	
		}else if(currentTool === "eraser") {
			ctx.fillStyle = "rgba(255, 255, 255, 1)"
			ctx.fillRect(loc.x, loc.y, 1, 1)	
		}else if(currentTool === "brush") {			
			ctx.fillStyle = "rgba(0, 0, 0, 1)"
			if(((loc.x - 1) % 3) == 0 && ((loc.y - 1) % 3) == 0) 
				ctx.fillRect(loc.x, loc.y, 1, 1)
		}else {
			redrawCanvasImage()
			updateRubberband(loc)
		}
	}
	
	// handle brush
}

function isMouseReleased(evt) {
	canvas.style.cursor = "default"
	loc = getMousePos(evt.clientX, evt.clientY)
		
	//redrawCanvasImage()
	//updateRubberband(loc)
	drag = false
}

function updateRubberbandSize(loc) {
	shapeBounds.width = Math.abs(loc.x - mouseDown.x)
	shapeBounds.height = Math.abs(loc.y - mouseDown.y)
	
	if(loc.x > mouseDown.x) {
		shapeBounds.left = mouseDown.x
	}else {
		shapeBounds.left = loc.x
	}
	
	if(loc.y > mouseDown.y) {
		shapeBounds.upper = mouseDown.y
	}else {
		shapeBounds.upper = loc.y
	}
}

function getAngle(mouseX, mouseY) {
	let adj = mouseDown.x - mouseX
	let opp = mouseDown.y - mouseY
	return radiansToDegrees(Math.atan2(opp, adj))
}

function radiansToDegrees(rad) {
	return (rad * (180 / Math.PI)).toFixed(2)
}

function degreesToRadians(degrees) {
	return (degrees / 180) * Math.PI
}

function updateRubberband(loc) {
	updateRubberbandSize(loc)
	drawRubberbandShape(loc)
}

function drawRubberbandShape(loc) {
	ctx.strokeStyle = drawColour
	// remove if fill fucks up
	ctx.fillStyle = drawColour
	
	if(currentTool === "brush") {
		drawBrush();
	}
	
	//ctx.strokeRect(shapeBounds.left, shapeBounds.upper, shapeBounds.width, shapeBounds.height)
}
