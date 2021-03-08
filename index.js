let canvas
let canvasLayer1
let canvasLayer2
let ctx
let ctxLayer1
let ctxLayer2
let canvasImage

let pencilToolButton
let brushToolButton
let eraserToolButton
let layer1Button
let layer2Button
let invertButton

let brushXPoints = []
let brushYPoints = []
let brushDownPos = []
let overlappingPixels = []

let drag = false
let drawColour = 'black'
let oppDrawColour = 'white'
let drawWidth = 2
let currentTool = 'pencil'
let currentLayerLabel = 'layer_1'
let canvasWidth = 256
let canvasHeight = 192

// pencil tool types
let outline = false
let scatter = false
let skid = false
let spray = false

let brushType = "2space"
let eraserType = "1px"

// slide settings
let invert = false
let slideIndex = 0
let slideClipboard
let slides = []
let undoStack = []
let redoStack = []

// player settings
let playSpeed = 1
let play = false

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
	constructor(label, drawColour, visible, layerCanvas) {
		this.label = label
		this.drawColour = drawColour
		this.visible = visible
		this.layerCanvas = layerCanvas
	}
}

let shapeBounds = new ShapeBoundingBox(0, 0, 0, 0)
let mouseDown = new Point(0, 0)
let loc = new Point(-1, -1)
let previousPencilPoint = null
let layer1 = new Layer('layer_1', 'black', true)
let layer2 = new Layer('layer_2', 'red', true)
let currentLayer = layer1

document.addEventListener('DOMContentLoaded', setupCanvas)

function setupCanvas() {
	canvas = document.getElementById('canvas')
	ctxLayer1 = canvas.getContext('2d')
	ctxLayer1.strokeStyle = drawColour
	ctxLayer1.lineWidth = drawWidth
	canvas.addEventListener("mousedown", isMousePressed)
	canvas.addEventListener("mousemove", isMouseMoving)
	canvas.addEventListener("mouseup", isMouseReleased)
	ctx = ctxLayer1
	//ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	invertCanvas()
	
	//canvasLayer2 = document.getElementById('canvas_layer_2')
	//ctxLayer2 = canvasLayer2.getContext('2d')
	//ctxLayer2.strokeStyle = layer2.drawColour
	//ctxLayer2.lineWidth = drawWidth
	//canvasLayer2.addEventListener("mousedown", isMousePressed)
	//canvasLayer2.addEventListener("mousemove", isMouseMoving)
	//canvasLayer2.addEventListener("mouseup", isMouseReleased)
	
	// get GUI elements
	pencilToolButton = document.getElementById("tool-pencil")
	brushToolButton = document.getElementById("tool-brush")
	eraserToolButton = document.getElementById("tool-eraser")
	
	layer1Button = document.getElementById("layer-1")
	layer2Button = document.getElementById("layer-2")
	
	invertButton = document.getElementById("slide-paper")
	
	changeTool("pencil")
	changeLayer(layer1.label)
	
	undoStack.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight))
	
	// add temporary slides
	for(let i = 0; i < 5; i++)
		slides.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight))
}

function setCurrentContext() {
	/*
	if(currentLayer === layer1.label) {
		ctx = ctxLayer1
		//canvas = canvasLayer1
	}else {
		ctx = ctxLayer2
		//canvas = canvasLayer2
	}*/
}

function showToolTypeMenu(tool) {
	selector = document.getElementById(tool + "-selector-button")
	menu = document.getElementById(tool + "-selector-menu")
	
	selector.style.display = "none"
	menu.style.display = "grid"
}

function selectToolType(tool, type) {
	if(tool === "pencil") {
		outline = false
		scatter = false
		skid = false
		spray = false
		
		switch(type) {
			case "1px":
				drawWidth = 1
				break;
				
			case "2px":
				drawWidth = 2
				break;
				
			case "3px":
				drawWidth = 3
				break;
				
			case "outline":
				outline = true
				break;
				
			case "scatter":
				scatter = true
				break;
				
			case "skid":
				skid = true
				break;
				
			case "spray":
				spray = true
				break;
		}
	}else if(tool === "paint")
		brushType = type
	else if(tool === "eraser")
		eraserType = type
	
	selector = document.getElementById(tool + "-selector-button")
	menu = document.getElementById(tool + "-selector-menu")
	
	selector.style.display = "grid"
	menu.style.display = "none"
	
	selectorImg = document.getElementById("tool-" + tool + "-selector")
	selectorImg.src = "./res/buttons/tool-types/" + tool + "-" + type + ".png"
}

function loadSlide(index) {
	if(index < 0 || index >= slides.length)
		return
	slides[slideIndex] = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
	ctx.putImageData(slides[index], 0, 0)
	slideIndex = index
}

function loadLastSlide() {
	loadSlide(slides.length - 1)
}

function previousSlide() {
	loadSlide(slideIndex - 1)
}

function nextSlide() {
	loadSlide(slideIndex + 1)
}

function playSlides() {
	play = true
	slideIndex = 0
	playNextSlide()
}

function playNextSlide() {
	if(slideIndex >= slides.length - 1) {
		play = false
		return
	}
	setTimeout(function() {
		nextSlide()
		playNextSlide()
	}, playSpeed * 1000)
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
	
	setCurrentContext()
}

function swapLayers() {
	//tempColour = layer1.drawColour
	//layer1.drawColour = layer2.drawColour
	//layer2.drawColour = tempColour
	/*
	if(currentLayerLabel === layer1.label) {
		//canvasLayer1.style.display = "none"
		//canvasLayer2.style.display = "inline"
		ctx = ctxLayer2
		changeLayer(layer2.label)
	}else {
		//canvasLayer1.style.display = "inline"
		//canvasLayer2.style.display = "none"
		ctx = ctxLayer1
		changeLayer(layer1.label)
	}*/
}

// get mouse position relative to canvas
function getMousePos(x, y) {
	let canvasSize = canvas.getBoundingClientRect()
	
	pos = { x: (x - canvasSize.left) * (canvas.width / canvasSize.width),
	y: (y - canvasSize.top) * (canvas.height / canvasSize.height) }
	
	return pos
}

// invert the white or black paint on the canvas
function invertCanvas() {
	var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
	for(let i = 0; i < canvasData.data.length; i += 4) {
		canvasData.data[i] = 255 - canvasData.data[i]
		canvasData.data[i+1] = 255 - canvasData.data[i+1]
		canvasData.data[i+2] = 255 - canvasData.data[i+2]
		canvasData.data[i+3] = 255
	}
	ctx.putImageData(canvasData, 0, 0)
}

function togglePaper() {
	invert = !invert
	if(invert) {
		invertButton.src = "./res/buttons/slides/inverted-paper.png"
		drawColour = "white"
		oppDrawColour = "black"
		ctx.strokeStyle = oppDrawColour
		ctx.fillRect(0, 0, canvasWidth, canvasHeight)
		ctx.strokeStyle = drawColour
	}else {
		invertButton.src = "./res/buttons/slides/paper.png"
		drawColour = "black"
		oppDrawColour = "white"
		ctx.strokeStyle = drawColour
		//ctx.fillRect(0, 0, canvasWidth, canvasHeight)
		ctx.clearRect(0, 0, canvasWidth, canvasHeight)
	}
	//invertCanvas()
}

function refreshCanvas() {
	/*
	ctx.putImageData(ctxLayer1.getImageData(0, 0, canvas.width, canvas.height), 0, 0)
	ctx.putImageData(ctxLayer2.getImageData(0, 0, canvas.width, canvas.height), 0, 0)*/
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

function getRandom(min, max) {
	return Math.floor((max - min) * Math.random() + min)
}

function undo() {
	undoData = undoStack.pop()
	if(undoData == null)
		return
	ctx.putImageData(undoData, 0, 0)
	redoStack.push(undoData)
}

function redo() {
	redoData = redoStack.pop()
	if(redoData == null)
		return
	ctx.putImageData(redoData, 0, 0)
	undoStack.push(redoData)
}

function erase() {
	undoStack.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight))
	ctx.clearRect(0, 0, canvasWidth, canvasHeight)
}

function flipSlide() {
	var canvasImg = document.createElement("img")
	canvasImg.src = canvas.toDataURL()
	ctx.clearRect(0, 0, canvasWidth, canvasHeight)
	ctx.scale(-1, 1)
	ctx.transform(0, 0, 0, 0, 1, 0)
	ctx.drawImage(canvasImg, 0, 0)
	ctx.transform(1, 0, 0, 1, 0, 0)
}

function removeSlide() {
	slides.splice(slideIndex, 1)
	ctx.putImageData(slides[slideIndex], 0, 0)
}

function insertSlide(paste) {
	firstHalf = slides.slice(0, slideIndex)
	secondHalf = slides.slice(slideIndex, slides.length)
	firstHalf = firstHalf.concat(ctx.getImageData(0, 0, canvasWidth, canvasHeight))
	slides = firstHalf.concat(secondHalf)
	if(!paste)
		ctx.clearRect(0, 0, canvasWidth, canvasHeight)
	else
		ctx.putImageData(clipboardData, 0, 0)
}

function copySlide() {
	clipboardData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
}

function pasteSlide() {
	insertSlide(true)
}

function draw() {
	if(currentTool === "pencil") {
		/*
		if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight) {
			addBrushPoint(loc.x, loc.y)
		}
		redrawCanvasImage()
		drawBrush()*/
		ctx.fillStyle = drawColour
		console.log("x: " + loc.x + ", y: " + loc.y)
		/*
		if(isPixelOccupied(loc.x, loc.y)) {
			overlappingPixels.push(loc)
		}else {
			ctx.fillRect(loc.x, loc.y, 2, 2)
		}*/
		if(scatter) {
			if(getRandom(0, 4) == 1) {
				count = Math.abs(getRandom(0, 3) - 1)
				
				for(let i = 0; i < count; i++) {
					ctx.fillRect(loc.x + getRandom(-2, 2), loc.y + getRandom(-2, 2), 1, 1)
				}
			}
			
			return
		}
		
		if(skid) {
			if(getRandom(0, 0) == 0) {
				count = Math.abs(getRandom(0, 5) - 1)
				
				for(let i = 0; i < count; i++) {
					ctx.fillRect(loc.x + getRandom(-2, 1), loc.y + getRandom(-2, 1), 1, 1)
				}
			}
			
			return
		}
		
		if(spray) {
			if(getRandom(0, 0) == 0) {
				count = Math.abs(getRandom(0, 10) - 1)
				
				for(let i = 0; i < count; i++) {
					ctx.fillRect(loc.x + getRandom(-3, 3), loc.y + getRandom(-3, 3), 1, 1)
				}
			}
			
			return
		}
		
		if(previousPencilPoint == null) {
			previousPencilPoint = new Point(loc.x, loc.y)
		}else if(previousPencilPoint.x != loc.x || previousPencilPoint != loc.y) {			
			ctx.beginPath()
			ctx.lineWidth = drawWidth
			if(outline)
				ctx.lineWidth = 3
			ctx.moveTo(previousPencilPoint.x, previousPencilPoint.y)
			ctx.lineTo(loc.x, loc.y)
			ctx.closePath()
			ctx.stroke()
			
			if(outline) {
				previousColour = ctx.strokeStyle
				
				ctx.beginPath()
				ctx.lineWidth = 1
				ctx.strokeStyle = oppDrawColour
				ctx.moveTo(previousPencilPoint.x, previousPencilPoint.y)
				ctx.lineTo(loc.x, loc.y)
				ctx.closePath()
				ctx.stroke()
				
				ctx.strokeStyle = previousColour
			}
			
			previousPencilPoint = new Point(loc.x, loc.y)
		}
	}else if(currentTool === "eraser") {
		ctx.fillStyle = oppDrawColour
		
		switch(eraserType) {
			case "1px":
				ctx.fillRect(loc.x, loc.y, 1, 1)
				break;
				
			case "small":
				ctx.fillRect(loc.x - 1, loc.y - 1, 3, 3)
				break;
				
			case "medium":
				ctx.beginPath();
				ctx.arc(loc.x, loc.y, 2, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.endPath()
				break;
				
			case "large":
				ctx.beginPath();
				ctx.arc(loc.x, loc.y, 8, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.endPath()
				break;
				
			case "small-square":
				ctx.fillRect(loc.x - 3, loc.y - 3, 6, 6)
				break;
				
			case "big-square":
				ctx.fillRect(loc.x - 6, loc.y - 6, 12, 12)
				break;
				
			case "vertical":
				ctx.fillRect(loc.x, loc.y, 1, 10)
				break;
				
			case "horizontal":
				ctx.fillRect(loc.x, loc.y, 10, 1)
				break;
		}
	}else if(currentTool === "brush") {		
		ctx.fillStyle = currentLayer.drawColour
		
		switch(brushType) {
			case "2space":
				nearestThirdX = Math.floor(loc.x)
				if((nearestThirdX % 3) == 1)
					nearestThirdX--
				else if((nearestThirdX % 3) == 2)
					nearestThirdX++
				
				nearestThirdY = Math.floor(loc.y)
				if((nearestThirdY % 3) == 1)
					nearestThirdY--
				else if((nearestThirdY % 3) == 2)
					nearestThirdY++
				
				ctx.fillRect(nearestThirdX, nearestThirdY, 1, 1)
				break;
				
			case "1space":
				nearestSecondX = Math.floor(loc.x)
				if((nearestSecondX % 2) == 1)
					nearestSecondX--
				
				nearestSecondY = Math.floor(loc.y)
				if((nearestSecondY % 2) == 1)
					nearestSecondY--
				
				ctx.fillRect(nearestSecondX, nearestSecondY, 1, 1)
				break;
				
			case "vertical":
				nearestSecondX = Math.floor(loc.x)
				if((nearestSecondX % 2) == 1)
					nearestSecondX--
				
				ctx.fillRect(nearestSecondX, Math.floor(loc.y), 1, 4)
				ctx.fillRect(nearestSecondX + 2, Math.floor(loc.y), 1, 4)
				break;
				
			case "horizontal":
				nearestSecondY = Math.floor(loc.y)
				if((nearestSecondY % 2) == 1)
					nearestSecondY--
				
				ctx.fillRect(Math.floor(loc.x), nearestSecondY, 4, 1)
				ctx.fillRect(Math.floor(loc.x), nearestSecondY + 2, 4, 1)
				break;
				
			case "checker":
				trueX = Math.floor(loc.x)
				trueY = Math.floor(loc.y)
				
				while((trueX % 2) != 0)
					trueX++
				while((trueY % 2) != 0)
					trueY++
				
				ctx.fillRect(trueX - 1, trueY + 1, 1, 1)
				ctx.fillRect(trueX - 2, trueY, 1, 1)
				ctx.fillRect(trueX - 2, trueY + 2, 1, 1)
				ctx.fillRect(trueX, trueY, 1, 1)
				ctx.fillRect(trueX + 2, trueY, 1, 1)
				ctx.fillRect(trueX + 1, trueY + 1, 1, 1)
				ctx.fillRect(trueX, trueY + 2, 1, 1)
				ctx.fillRect(trueX + 2, trueY + 2, 1, 1)
				ctx.fillRect(trueX + 1, trueY + 3, 1, 1)
				ctx.fillRect(trueX, trueY + 4, 1, 1)
				ctx.fillRect(trueX + 2, trueY + 4, 1, 1)
				break;
				
			case "invgrid2":
				trueX = Math.floor(loc.x)
				trueY = Math.floor(loc.y)
				
				while((trueX % 3) != 0)
					trueX++
				while((trueY % 3) != 0)
					trueY++
				
				ctx.fillRect(trueX + 0, trueY, 1, 1)
				ctx.fillRect(trueX - 2, trueY, 1, 1)
				ctx.fillRect(trueX - 2, trueY - 1, 1, 1)
				ctx.fillRect(trueX - 1, trueY - 1, 1, 1)
				ctx.fillRect(trueX + 0, trueY - 1, 1, 1)
				ctx.fillRect(trueX - 2, trueY + 1, 1, 1)
				ctx.fillRect(trueX - 1, trueY + 1, 1, 1)
				ctx.fillRect(trueX + 0, trueY + 1, 1, 1)
				break;
				
			case "invgrid3":
				trueX = Math.floor(loc.x)
				trueY = Math.floor(loc.y)
				
				while((trueX % 2) != 0)
					trueX++
				while((trueY % 3) != 0)
					trueY++
				
				ctx.fillRect(trueX + 0, trueY, 1, 1)
				ctx.fillRect(trueX + 1, trueY, 1, 1)
				ctx.fillRect(trueX + 0, trueY + 1, 1, 1)
				ctx.fillRect(trueX + 0, trueY + 2, 1, 1)
				ctx.fillRect(trueX + 1, trueY + 2, 2, 1)
				break;
		}
	}
	
	//refreshCanvas()
}

function isMousePressed(evt) {
	canvas.style.cursor = "crosshair"
	loc = getMousePos(evt.clientX, evt.clientY)
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
	
	canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
	slideSelector = document.getElementById("slide-" + (slideIndex + 1))
	slideCtx = slideSelector.getContext('2d')
	slideCtx.putImageData(canvasData, 0, 0)
	
	undoStack.push(canvasData)
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
