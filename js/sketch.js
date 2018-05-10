var myCanvas;


//By default, none is visible.
const status = {
	show_TX30: false,
	show_PR95PERC: false,
	show_PRCPTOT: false,
	years: '2011-2040'
};

// graphs variables

const graphVars = {
	black: '#000000',
	gray: '#333333',
	red: '#ff0086',
	blue: '#00fff8',
	yellow: '#f9ff00',
	lightGray: '#d8d8d8'
}

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
let fullData, province, confini, prov_data;
//images
let italy_bg;

//size
let w, h;

//drawing variables

let canvas;
let RCP85_layer, RCP45_layer,
	prov_layer, italy_layer,
	imagesLayers

//lens variables
let lens_size = 200;

//timeline buttons
let timeline_btns = [];

//load datasets
function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
	province = loadJSON('assets/contorniProvince.json');
	italy_bg = loadImage('assets/italy_bg.png');
	confini = loadJSON('assets/contorni_italia.json');
	imagesLayers = {}
	//load all the images
	let ya = ["2011-2040", "2041-2070", "2071-2100"].forEach(function(y){
		["TX30", "PR95PERC", "PRCPTOT"].forEach(function(s){
			["RCP45", "RCP85"].forEach(function(p){
				var name = y+"-"+s+"-"+p;
				imagesLayers[name] = loadImage('assets/layers/' + name + '.png');
			})
		})
	})
	//load and parse data for single provinces
	d3.tsv("assets/climate-change-provincie.tsv").then(function(data) {

		prov_data = {};
		// loading the data
		data.forEach(function(d) {
			if (d.provincia in prov_data === false) {
				prov_data[d.provincia] = {};
			}
			if (d.variabile in prov_data[d.provincia] === false) {
				prov_data[d.provincia][d.variabile] = [];
			}
			prov_data[d.provincia][d.variabile].push(d);
		})
	})
}

function setup() {
	//Create the canvas
	var parentDiv = select('#map');
	console.log(parentDiv);

	w = 960;
	h = 960;

	RCP85_layer = createGraphics(w,h);
	RCP45_layer = createGraphics(w,h);

	RCP85_layer.parent('map')
	RCP85_layer.id('RCP85_layer')

	RCP45_layer.parent('map')
	RCP45_layer.id('RCP45_layer')

	canvas = createCanvas(w, h);
	pixelDensity(1);

	canvas.parent('map');

	//initialize buttons
	initializeButton('#toggle-1', 'show_TX30');
	initializeButton('#toggle-2', 'show_PR95PERC');
	initializeButton('#toggle-3', 'show_PRCPTOT');

	//initialize map
	// l1 = new GeoLayer(fullData.values, 74, myMap, w, h);
	// l1_45 = new GeoLayer(fullData.values, 74, myMap, w, h);
	// l2 = new GeoLayer(fullData.values, 88, myMap, w, h);
	// l2_45 = new GeoLayer(fullData.values, 88, myMap, w, h);
	// l3 = new GeoLayer(fullData.values, -410, myMap, w, h);
	// l3_45 = new GeoLayer(fullData.values, -410, myMap, w, h);
	prov_layer = new ShapeFileLayer(province, myMap, w, h);
	italy_layer = new ShapeFileLayer(confini, myMap, w, h);

	initMap(status.years);

}

//initialize d3 buttons
d3.selectAll('.timeline_button')
	.on('click', function() {
		d3.event.preventDefault();
		var activeClass = "selected";

		d3.selectAll(".timeline_button")
			.classed(activeClass, false);
		d3.select(this).classed(activeClass, true)
		if (this.id == 'timeline_2011_2040') {
			status.years = '2011-2040';
			initMap(status.years);
		}
		if (this.id == 'timeline_2041_2070') {
			status.years = '2041-2070';
			initMap(status.years);
		}
		if (this.id == 'timeline_2071_2100') {
			status.years = '2071-2100';
			initMap(status.years);
		}
	});


//this function allows you to bind a DIV item to the status of a variable
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
	console.log('initialize', _years);
	clear();

	prov_layer.draw();
	italy_layer.draw();

	updateLayers(0, 0, false);
}

var selectedProvince = '';

// variables for all the graphs

var margin = { top: 25, right: 120, bottom: 25, left: 80 };
var sw = +d3.select('#graph_01').style("width").slice(0, -2) - margin.left - margin.right;
var sh = +d3.select('#graph_01').style("height").slice(0, -2) - margin.top - margin.bottom;

var x = d3.scaleOrdinal()
	.domain(["2011-2040", "2041-2070", "2071-2100"])
	.range([0, sw / 2, sw]);

var y = d3.scaleLinear()
	.rangeRound([sh, 0])
	.domain([0, 90]);

var area = d3.area()
	.x(function(d) { return x(d.anno); })
	.y1(function(d) { return y(+d.valore); })
	.y0(y(0));

//variables for first graph
var svg1 = d3.select('#graph_01')

var g1 = svg1.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let axisBottom1 = g1.append("g")
	.attr("transform", "translate(0," + y(0) + ")");
axisBottom1.call(d3.axisBottom(x).tickSize(-sh).tickPadding(8));
axisBottom1.select(".domain").remove();
axisBottom1.selectAll(".tick line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2").attr("transform", "translate(0, 6)");

let axisRight1 = g1.append("g")
	.attr("transform", "translate(" + sw + ", 0)");
axisRight1.call(d3.axisRight(y).ticks(5).tickSize(-sw - 12).tickPadding(14).tickFormat(function(d) {
	return d > 0 ? "+ " + d + " giorni" : d + " giorni";
}));
axisRight1.select(".domain").remove();
axisRight1.selectAll(".tick text").attr("dy", "0em").style("fill", graphVars.gray);
axisRight1.selectAll(".tick:not(:first-of-type) line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2");
axisRight1.selectAll(".tick line").attr("transform", "translate(6, 0)");

var paths_g1 = g1.append('g');


//variables for second graph
var svg2 = d3.select('#graph_02')

var g2 = svg2.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var paths_g2 = g2.append('g')

g2.append("g")
	.attr("transform", "translate(0," + y(0) + ")")
	.call(d3.axisBottom(x));

g2.append("g")
	.call(d3.axisLeft(y))

//variables for third graph
var y3 = d3.scaleLinear()
	.rangeRound([sh, 0])
	.domain([-410, 0]);

var area3 = d3.area()
	.x(function(d) { return x(d.anno); })
	.y1(function(d) { return y3(+d.valore); })
	.y0(y3(0));

var svg3 = d3.select('#graph_03')

var g3 = svg3.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var paths_g3 = g3.append('g')

g3.append("g")
	.attr("transform", "translate(0," + y3(0) + ")")
	.call(d3.axisTop(x));

g3.append("g")
	.call(d3.axisLeft(y3))


function updateLayers(_x, _y, _showPanel) {
	clear();
	

	RCP85_layer.clear();
	RCP45_layer.clear();

	blendMode(MULTIPLY);

	if(status.show_TX30) {
		console.log(imagesLayers[status.years+"-TX30-RCP85"])
		image(imagesLayers[status.years+"-TX30-RCP85"],0,0,w,h);
		RCP45_layer.image(imagesLayers[status.years+"-TX30-RCP45"],0,0,w,h);
	}
	if(status.show_PR95PERC) {
		image(imagesLayers[status.years+"-PR95PERC-RCP85"],0,0,w,h);
		RCP45_layer.image(imagesLayers[status.years+"-PR95PERC-RCP45"],0,0,w,h);
	}
	if(status.show_PRCPTOT) {
		image(imagesLayers[status.years+"-PRCPTOT-RCP85"],0,0,w,h);
		RCP45_layer.image(imagesLayers[status.years+"-PRCPTOT-RCP45"],0,0,w,h);
	}
	console.log(RCP45_layer)
	//image(italy_layer.image, 0, 0, w, h);
	//image(RCP85_layer,0,0,w,h)


	if (_showPanel && !(!status.show_TX30 && !status.show_PR95PERC && !status.show_PRCPTOT)) {
		var newprov = prov_layer.mask(_x, _y, lens_size);

		stroke('black');
		noFill();
		ellipse(_x, _y, lens_size);

		if (newprov != null && newprov.properties.DEN_CMPRO != selectedProvince) {

			selectedProvince = newprov.properties.DEN_CMPRO;

			d3.selectAll('.graph-rect').remove();

			//title
			d3.select('#nomeprovincia').html('Provincia di ' + selectedProvince);

			//first graph
			var TX30_data = d3.nest()
				.key(function(e) { return e.proiezione })
				.sortKeys(d3.descending)
				.entries(prov_data[selectedProvince]['TX30']);

			var paths1 = paths_g1.selectAll("path")
				.data(TX30_data);

			paths1.enter()
				.append("path")
				.attr("fill", function(d) { return d.key == 'RCP85' ? graphVars.red : graphVars.lightGray; })
				.style("opacity", function(d) { return d.key == 'RCP85' ? 1 : .8 })
				.merge(paths1)
				.transition()
				.attr("d", function(d) { return area(d.values) });

			axisBottom1.selectAll('.tick text').style('fill', function(d) {
				return d == status.years ? graphVars.black : graphVars.gray;
			}).style('font-weight', function(d) {
				return d == status.years ? "bold" : "normal";
			})

			g1.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 4)
				.attr("ry", 4)
				.attr("x", x(status.years) - 30)
				.attr("y", y(90))
				.attr("width", 60)
				.attr("height", y(0) + 20)

			//first text
			var value1_RCP85 = Math.round(+TX30_data[0].values.filter(function(d) { return d.anno == status.years })[0].valore);
			var value1_RCP45 = Math.round(+TX30_data[1].values.filter(function(d) { return d.anno == status.years })[0].valore);
			d3.select("#desc_01").html('Nel trentennio ' + status.years + ', ci saranno circa <span class="scrittaMagenta">' + Math.abs(value1_RCP85) + ' giorni di caldo intenso in ' + (value1_RCP85 > 0 ? 'più' : 'meno') + '</span> rispetto ad oggi. Con l’adozione di politiche climatiche, i giorni in ' + (value1_RCP45 > 0 ? 'più' : 'meno') + ' rispetto ad oggi saranno circa ' + Math.abs(value1_RCP45) + '.').style('opacity', 1);

			//second graph
			var PR95PERC_data = d3.nest()
				.key(function(e) { return e.proiezione })
				.sortKeys(d3.descending)
				.entries(prov_data[selectedProvince]['PR95PERC']);

			var paths2 = paths_g2.selectAll("path")
				.data(PR95PERC_data);

			paths2.enter()
				.append("path")
				.attr("fill", function(d) { return d.key == 'RCP85' ? graphVars.blue : graphVars.lightGray; })
				.style("opacity", function(d) { return d.key == 'RCP85' ? 1 : .8 })
				.merge(paths2)
				.transition()
				.attr("d", function(d) { return area(d.values) });

			g2.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 4)
				.attr("ry", 4)
				.attr("x", x(status.years) - 30)
				.attr("y", y(90))
				.attr("width", 60)
				.attr("height", y(0) + 20)

			//second text
			var value2_RCP85 = Math.round(+PR95PERC_data[0].values.filter(function(d) { return d.anno == status.years })[0].valore);
			var value2_RCP45 = Math.round(+PR95PERC_data[1].values.filter(function(d) { return d.anno == status.years })[0].valore);
			d3.select("#desc_02").html('Nel trentennio ' + status.years + ', nei giorni di pioggia intensa cadranno circa <span class="scrittaCyan">' + Math.abs(value2_RCP85) + ' mm di pioggia in ' + (value2_RCP85 > 0 ? 'più' : 'meno') + '</span> rispetto ad oggi. Con l’adozione di politiche climatiche, i mm in ' + (value2_RCP45 > 0 ? 'più' : 'meno') + ' rispetto ad oggi saranno circa ' + Math.abs(value2_RCP45) + '.').style('opacity', 1);

			//third graph
			var PRCPTOT_data = d3.nest()
				.key(function(e) { return e.proiezione })
				.sortKeys(d3.descending)
				.entries(prov_data[selectedProvince]['PRCPTOT']);

			var paths3 = paths_g3.selectAll("path")
				.data(PRCPTOT_data);

			paths3.enter()
				.append("path")
				.attr("fill", function(d) { return d.key == 'RCP85' ? graphVars.yellow : graphVars.lightGray; })
				.style("opacity", function(d) { return d.key == 'RCP85' ? 1 : .8 })
				.merge(paths3)
				.transition()
				.attr("d", function(d) { return area3(d.values) });

			g3.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 4)
				.attr("ry", 4)
				.attr("x", x(status.years) - 30)
				.attr("y", y3(0) - 20)
				.attr("width", 60)
				.attr("height", y3(-410) + 20)

			//third text
			var value3_RCP85 = Math.round(+PRCPTOT_data[0].values.filter(function(d) { return d.anno == status.years })[0].valore);
			var value3_RCP45 = Math.round(+PRCPTOT_data[1].values.filter(function(d) { return d.anno == status.years })[0].valore);
			d3.select("#desc_03").html('Nel trentennio ' + status.years + ', nei mesi estivi scenderanno circa <span class="scrittaYellow">' + Math.abs(value3_RCP85) + ' mm di acqua in ' + (value3_RCP85 > 0 ? 'più' : 'meno') + '</span> rispetto ad oggi. Con l’adozione di misure di mitigazione dei cambiamenti climatici, la variazione sarà di circa ' + Math.abs(value3_RCP45) + ' mm in ' + (value3_RCP45 > 0 ? 'più' : 'meno') + '.').style('opacity', 1);

			d3.select('#spiega').style("opacity", 1e-6);
			d3.select('#areachart').style("opacity", 1);
		}
	} else {

		d3.select('#spiega').style("opacity", 1);
		d3.select('#areachart').style("opacity", 1e-6);
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
		this.image = createImage(this.width, this.height);
		layer.clear();
		//layer.background('white');
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

		return selected;
	}
	//first, create polygons
	this.createPolygons();
	//
}

function touchStarted() {
	if (touches.length > 0) {
		updateLayers(touches[0].x, touches[0].y, true);
	}
}

function touchMoved() {
	if (touches.length > 0) {
		updateLayers(touches[0].x, touches[0].y, true);
	}
}

function touchEnded() {
	updateLayers(0, 0, false);
	selectedProvince = '';
}