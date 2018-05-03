var myCanvas;


//By default, none is visible.
var show_TX30 = false;
var show_PRCPTOT = false;
var show_PR95PERC = false;

//load datasets
function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
}

function setup() {
	//Create the canvas
	myCanvas = createCanvas(1320, 1080);
	myCanvas.parent('map');

	//initialize buttons
	initializeButton('#toggle-1', show_TX30);
	initializeButton('#toggle-2', show_PRCPTOT);
	initializeButton('#toggle-3', show_PR95PERC);


}

// this function allows you to bind a DIV item to the status of a variable
function initializeButton(_btn_selector, _target_variable) {
	var button = select(_btn_selector);
	button.selected = false;
	button.varName = _target_variable;
	button.elt.self = button;
	button.mouseReleased(changeBg);
}

function changeBg(event) {
	background(random(255));
	console.log(event);

	//var element = new p5.Element(event.target);
	var element = event.target.self;
	if (element.selected) {
		element.removeClass('selected');
	} else {
		element.addClass('selected');
	}
	element.selected = !element.selected;

	element.style('background-color', 'blue')
}