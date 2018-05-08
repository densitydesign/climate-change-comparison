var myCanvas;


//By default, none is visible.
const status = {
	show_TX30: false,
	show_PRCPTOT: false,
	show_PR95PERC: false,
	years: '2011-2040'
};

// API Key for MapboxGL.
const key = 'pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg';


// Options for map
const options = {
	lat: 42,
	lng: 12,
	zoom: 5.5,
	style: 'light-v9',
	pitch: 0,
	width: 960,
	height: 960
};

const mappa = new Mappa('Mapbox', key);
const myMap = mappa.staticMap(options);
let mapImg;

// datasets
let fullData, province;
//images
let italy_bg;

//size
let w, h;

//drawing variables

let canvas;
let l1, l2, l3,
	l1_45, l2_45, l3_45,
	prov_layer

//lens variables
let lens_size = 300;

//timeline buttons
let timeline_btns = [];

//load datasets
function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
	province = loadJSON('assets/contorniProvince.json');
	italy_bg = loadImage('assets/italy_bg.png')
}

function setup() {
	//Create the canvas
	var parentDiv = select('#map');
	console.log(parentDiv);

	w = 960;
	h = 960;

	canvas = createCanvas(w, h);
	pixelDensity(1);

	canvas.parent('map');

	//initialize buttons
	initializeButton('#toggle-1', 'show_TX30');
	initializeButton('#toggle-2', 'show_PR95PERC');
	initializeButton('#toggle-3', 'show_PRCPTOT');

	//initialize map
	l1 = new GeoLayer(fullData.values, 74, myMap, w, h);
	l1_45 = new GeoLayer(fullData.values, 74, myMap, w, h);
	l2 = new GeoLayer(fullData.values, -410, myMap, w, h);
	l2_45 = new GeoLayer(fullData.values, -410, myMap, w, h);
	l3 = new GeoLayer(fullData.values, 88, myMap, w, h);
	l3_45 = new GeoLayer(fullData.values, 88, myMap, w, h);
	prov_layer = new ShapeFileLayer(province, myMap, w, h);

	initMap(status.years);
	
}

//initialize d3 buttons
d3.selectAll('.timeline_button')
	.on('click', function(){
		var activeClass = "selected";
		
		d3.selectAll(".timeline_button")
			.classed(activeClass, false);
		d3.select(this).classed(activeClass, true)
		if(this.id == 'timeline_2011_2040') {
			status.years = '2011-2040';
			initMap(status.years);
		}
		if(this.id == 'timeline_2041_2070') {
			status.years = '2041-2070';
			initMap(status.years);
		}
		if(this.id == 'timeline_2071_2100') {
			status.years = '2071-2100';
			initMap(status.years);
		}
	});



// this function allows you to bind a DIV item to the status of a variable
function initializeButton(_btn_selector, _target_variable) {
	var button = select(_btn_selector);
	button.selected = false;
	button.switch = function(event) {
		if (event.type == "touchend") {
			if (button.selected) {
				button.removeClass('selected');
			} else {
				button.addClass('selected');
			}

			button.selected = !button.selected

			status[_target_variable] = button.selected;

			console.log(status);
		}
	};
	button.elt.self = button;
	button.touchEnded(button.switch);
}

function initMap(_years) {
	//render all the layers
	console.log('initialize',_years);
	clear();

	l1.color = '#ff0086';
	l1.init(_years, 'TX30', 'RCP85');
	l1.draw();

	l1_45.color = '#ff0086';
	l1_45.init(_years, 'TX30', 'RCP45');
	l1_45.draw();

	l2.color = '#00fff8';
	l2.init(_years, 'PRCPTOT', 'RCP85');
	l2.draw();

	l2_45.color = '#00fff8';
	l2_45.init(_years, 'PRCPTOT', 'RCP45');
	l2_45.draw();

	l3.color = '#f9ff00';
	l3.init(_years, 'PR95PERC', 'RCP85');
	l3.draw();


	l3_45.color = '#f9ff00';
	l3_45.init(_years, 'PR95PERC', 'RCP45');
	l3_45.draw();

	prov_layer.draw();

	updateLayers(0, 0);
}

function updateLayers(_x, _y) {

	clear();
	//image(italy_bg,0,0,w,h);
	blendMode(MULTIPLY);
	if(status.show_TX30) {
		l1_45.invertMask(_x, _y, lens_size);
		l1.mask(_x, _y, lens_size);
	}
	if(status.show_PRCPTOT){
		l2_45.invertMask(_x, _y, lens_size);
		l2.mask(_x, _y, lens_size);
		
	}
	if(status.show_PR95PERC){
		l3.mask(_x, _y, lens_size)
		l3_45.invertMask(_x, _y, lens_size);
	}
	prov_layer.mask(_x, _y, lens_size);
}

function GeoLayer(_data, _maxval, _map, _width, _height) {
	//
	this.color = '#ff0000';
	this.maxVal = _maxval;
	this.width = _width;
	this.height = _height;

	var points = [];
	var layer = createGraphics(this.width, this.height);
	this.rendered = createImage(this.width, this.height);

	// prepare data
	this.init = function(_year, _variable, _scenario) {
		//flush points
		points = [];
		// test un po' stupidino
		var p1 = myMap.latLngToPixel(_data[0].lat, _data[0].lon);
		var p2 = myMap.latLngToPixel(_data[1].lat, _data[1].lon);
		var distance = (p1.x - p2.x) / 5.55; //formula magica, ottini distanza tra punti

		var maxVal = Math.sqrt(Math.abs(this.maxVal));

		_data.forEach(function(item) {

			const latitude = item.lat;
			const longitude = item.lon;

			// Transform lat/lng to pixel position
			const pos = _map.latLngToPixel(latitude, longitude);

			// Get the variables
			let size = Math.sqrt(Math.abs(item[_year][_variable][_scenario]));

			size = map(size, 0, maxVal, 0, distance);

			//save the point
			var p = {
				'x': pos.x,
				'y': pos.y,
				'size': size
			};
			points.push(p);
		})
	}
	this.draw = function() {
		layer.clear();
		//layer.background('white');
		layer.noStroke();
		layer.fill(this.color);
		points.forEach(function(p) {
			layer.ellipse(p.x, p.y, p.size, p.size);
		});

		this.rendered = createImage(this.width, this.height);

		this.rendered.copy(layer, 0, 0, layer.width, layer.height, 0, 0, layer.width, layer.height);

		return this.rendered;
	}

	this.mask = function(_mx, _my, _msize) {
		layer.clear();
		var outimg = createImage(this.width, this.height);
		layer.image(this.rendered, 0, 0);
		layer.ellipseMode(CENTER);
		layer.noStroke();
		layer.fill(255);
		layer.ellipse(_mx, _my, _msize);
		outimg.copy(layer, 0, 0, layer.width, layer.height, 0, 0, layer.width, layer.height);

		image(outimg, 0, 0);

		return outimg;
	}
	this.invertMask = function(_mx, _my, _msize) {
		var outimg = createImage(_msize, _msize);
		outimg.copy(this.rendered, _mx - _msize / 2, _my - _msize / 2, _msize, _msize, 0, 0, _msize, _msize)

		var tempMask = createGraphics(_msize, _msize);
		tempMask.ellipseMode(CENTER);
		tempMask.ellipse(_msize / 2, _msize / 2, _msize);
		outimg.mask(tempMask);
		tempMask.remove();

		image(outimg, _mx - _msize / 2, _my - _msize / 2);

		return outimg;
	}
}

function ShapeFileLayer(_geoJson, _map, _width, _height) {
	this.data = _geoJson;
	this.map = _map;
	this.width = _width;
	this.height = _height;

	var shapes = [];
	var layer = createGraphics(this.width, this.height);
	this.image = createImage(this.width, this.height);

	// Create thee polygons
	this.createPolygons = function() {
		var results = [];

		var features = _geoJson.features;

		features.forEach(function(feature) {

			//get coordinates
			var coords = feature.geometry.coordinates;
			//Create an new object
			var item = {}
			item.properties = feature.properties;
			item.polygons = [];

			for (var i = 0; i < coords.length; i++) {

				var poly = [];
				// Iterate among points
				// For some reasons, in multi-polygons points are nested in the first item of the array.
				// I imagine it is something related to polygons inner/outer contours.

				var points = feature.geometry.type == 'MultiPolygon' ? coords[i][0] : coords[i];

				for (var j = 0; j < points.length; j++) {

					const latitude = points[j][1]
					const longitude = points[j][0]

					// Transform lat/lng to pixel position
					const pos = _map.latLngToPixel(latitude, longitude);
					poly.push(createVector(pos.x, pos.y));
				}
				//append to polygons
				item.polygons.push(poly);
			}
			//append to results
			results.push(item);
		})
		// return thee results
		shapes = results;
	}

	this.draw = function() {
		layer.clear();
		layer.background('white');
		layer.noFill();
		layer.strokeWeight(0.2);
		layer.stroke('black');
		layer.strokeCap(ROUND);

		shapes.forEach(function(shape) {
			shape.polygons.forEach(function(poly) {
				layer.beginShape();
				//now draw the shape
				poly.forEach(function(p) {
					layer.vertex(p.x, p.y);
				})
				layer.endShape();
			})
		});

		this.image.copy(layer, 0, 0, layer.width, layer.height, 0, 0, layer.width, layer.height);

		return this.image;
	}
	this.hitTest = function(_x, _y) {

		for (var shape of shapes) {
			for (var poly of shape.polygons) {
				var hitTest = collidePointPoly(_x, _y, poly);
				//if positive, draw it
				if (hitTest == true) {
					return shape;
				}
			}
		}

		return null;
	}

	//hit test
	this.mask = function(_mx, _my, _msize) {
		layer.clear();
		layer.image(this.image, 0, 0);
		//perform hittest
		var selected = this.hitTest(_mx, _my);
		if (selected != null) {
			//draw the selected one
			layer.noFill();
			layer.strokeWeight(2);
			layer.stroke(0);

			selected.polygons.forEach(function(poly) {
				layer.beginShape();
				//now draw the shape
				poly.forEach(function(p) {
					layer.vertex(Math.round(p.x), Math.round(p.y));
				})
				layer.endShape();
			})
		}
		//return as image
		var outimg = createImage(_msize, _msize);
		outimg.copy(layer, _mx - _msize / 2, _my - _msize / 2, _msize, _msize, 0, 0, _msize, _msize);

		var tempMask = createGraphics(_msize, _msize);
		tempMask.ellipseMode(CENTER);
		tempMask.ellipse(_msize / 2, _msize / 2, _msize);
		outimg.mask(tempMask);
		tempMask.remove();

		image(outimg, _mx - _msize / 2, _my - _msize / 2);

		return outimg;
	}
	//first, create polygons
	this.createPolygons();
	// 
}

function mouseMoved() {
	updateLayers(mouseX, mouseY);
}

function touchMoved() {
	updateLayers(touches[0].x, touches[0].y);
}

function touchEnded() {
	updateLayers(0, 0);
}