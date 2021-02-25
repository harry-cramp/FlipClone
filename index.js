let canvas
let ctx
let canvasImage

let pencilToolButton
let brushToolButton
let eraserToolButton
let layer1Button
let layer2Button

let brushXPoints = []
let brushYPoints = []
let brushDownPos = []
let overlappingPixels = []

let drag = false
let drawColour = 'black'
let drawWidth = 2
let currentTool = 'pencil'
let currentLayerLabel = 'layer_1'
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

class Layer {
	constructor(label, drawColour, visible, imgData) {
		this.label = label
		this.drawColour = drawColour
		this.visible = visible
	}
}

let shapeBounds = new ShapeBoundingBox(0, 0, 0, 0)
let mouseDown = new Point(0, 0)
let loc = new Point(-1, -1)
let previousPencilPoint = null
let layer1 = new Layer('layer_1', 'black', true, null)
let layer2 = new Layer('layer_2', 'red', true, null)
let currentLayer = layer1

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
	
	layer1Button = document.getElementById("layer-1")
	layer2Button = document.getElementById("layer-2")
	
	changeTool("pencil")
	changeLayer("layer_1")
}

function changeTool(tool) {
	pencilToolButton.src = "./res/buttons/tools/pencil-tool-button.png"
	brushToolButton.src = "./res/buttons/tools/brush-tool-button.png"
	eraserToolButton.src = "./res/buttons/tools/eraser-tool-button.png"
	document.getElementById("tool-" + tool).src = "./res/buttons/tools/" + tool + "-tool-button-clicked.png"
	currentTool = tool
}

function changeLayer(flipLayer) {
	layer1Button.src = "./res/buttons/layers/layer_1_unclicked.png"
	layer2Button.src = "./res/buttons/layers/layer_2_unclicked.png"
	currentLayerLabel = flipLayer
	
	if(flipLayer === "layer_2") {
		currentLayer = layer2
		layer2Button.src = "./res/buttons/layers/layer_2_" + currentLayer.drawColour + "_clicked.png"
	}else {
		currentLayer = layer1
		layer1Button.src = "./res/buttons/layers/layer_1_" + currentLayer.drawColour + "_clicked.png"
	}
}

function swapLayers() {
	tempColour = layer1.drawColour
	layer1.drawColour = layer2.drawColour
	layer2.drawColour = tempColour
	
	if(currentLayerLabel === layer1.label) {
		changeLayer(layer2.label)
		ctx.fillStyle = layer2.drawColour
		for(let i in overlappingPixels) {
			point = overlappingPixels[i]
			console.log(point.x)
			ctx.fillRect(point.x, point.y, 2, 2)
		}
	}else {
		changeLayer(layer1.label)
		ctx.fillStyle = layer1.drawColour
		for(let i in overlappingPixels) {
			point = overlappingPixels[i]
			console.log(point.x)
			ctx.fillRect(point.x, point.y, 2, 2)
		}
	}
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

function refreshCanvas() {
	getCanvasImage()
	redrawCanvasImage()
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

function colourDataEqualsLabel(red, green, blue, colour) {
	switch(colour.toLowerCase()) {
		case "black":
			return red == 0 && green == 0 && blue == 0
		case "red":
			return red == 255 && green == 0 && blue == 0
		case "blue":
			return red == 0 && green == 0 && blue == 255
		default:
			return red == 255 && green == 255 && blue == 255
	}
}

function isPixelOccupied(x, y) {
	var data = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data
	var index = (Math.floor(y) * canvasWidth + Math.floor(x)) * 4
	console.log("Draw index: " + index)
	var oppositeLayerColour
	if(currentLayer === "layer_2")
		oppositeLayerColour = layer1.drawColour
	else
		oppositeLayerColour = layer2.drawColour
	/*
	for(var i = 0; i < data.length; i++) {
		if(data[i] != 0) {
			console.log("DATA i: " + i + ", data: " + data[i])
		}
	}
	console.log("data at " + index + ": " + data[index])
	console.log("data at " + (index + 1) + ": " + data[index + 1])
	console.log("data at " + (index + 2) + ": " + data[index + 2])*/
	
	return !colourDataEqualsLabel(data[index], data[index + 1], data[index + 2], "white") && colourDataEqualsLabel(data[index], data[index + 1], data[index + 2], oppositeLayerColour)
}

function draw() {
	if(currentTool === "pencil") {
		/*
		if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight) {
			addBrushPoint(loc.x, loc.y)
		}
		redrawCanvasImage()
		drawBrush()*/
		ctx.fillStyle = currentLayer.drawColour
		console.log("x: " + loc.x + ", y: " + loc.y)
		/*
		if(isPixelOccupied(loc.x, loc.y)) {
			overlappingPixels.push(loc)
		}else {
			ctx.fillRect(loc.x, loc.y, 2, 2)
		}*/
		if(previousPencilPoint == null) {
			previousPencilPoint = new Point(loc.x, loc.y)
		}else if(previousPencilPoint.x != loc.x || previousPencilPoint != loc.y) {			
			ctx.beginPath()
			ctx.lineWidth = 2
			ctx.moveTo(previousPencilPoint.x, previousPencilPoint.y)
			ctx.lineTo(loc.x, loc.y)
			ctx.closePath()
			ctx.stroke()
			
			previousPencilPoint = new Point(loc.x, loc.y)
		}
	}else if(currentTool === "eraser") {
		ctx.fillStyle = "white"
		ctx.fillRect(loc.x, loc.y, 1, 1)	
	}else if(currentTool === "brush") {		
		ctx.fillStyle = currentLayer.drawColour
		console.log("x: " + loc.x + ", y: " + loc.y)
		if(isPixelOccupied(loc.x, loc.y)) {
			overlappingPixels.push(loc)
		}else {
			if(((Math.floor(loc.x) - 1) % 3) == 0 && ((Math.floor(loc.y) - 1) % 3) == 0)
				ctx.fillRect(Math.floor(loc.x), Math.floor(loc.y), 1, 1)
		}
	}
	
	//refresh()
}

function isMousePressed(evt) {
	canvas.style.cursor = "crosshair"
	loc = getMousePos(evt.clientX, evt.clientY)
	getCanvasImage()
	mouseDown.x = loc.x
	mouseDown.y = loc.y
	drag = true
	
	draw()
}

function isMouseMoving(evt) {
	canvas.style.cursor = "crosshair"
	loc = getMousePos(evt.clientX, evt.clientY)
	
	if(drag) {
		draw()
	}
	
	// handle brush
}

function isMouseReleased(evt) {
	canvas.style.cursor = "default"
	loc = getMousePos(evt.clientX, evt.clientY)
		
	//redrawCanvasImage()
	//updateRubberband(loc)
	drag = false
	previousPencilPoint = null
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
	ctx.fillStyle = drawColour
	
	if(currentTool === "brush") {
		drawBrush();
	}
	
	//ctx.strokeRect(shapeBounds.left, shapeBounds.upper, shapeBounds.width, shapeBounds.height)
}
