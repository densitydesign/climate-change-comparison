var myCanvas;

//size
let w = 960;
let h = 995;

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
	lightGray: '#d8d8d8',
	lightRed: '#dba0ba',
	lightBlue: '#b6e4e3',
	lightYellow: '#e5e5ab'
}

// API Key for MapboxGL.
const key = 'pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg';


// Options for map
const options = {
	lat: 42,
	lng: 12,
	zoom: 5.61,
	style: 'light-v9',
	pitch: 0,
	width: w,
	height: h
};

const mappa = new Mappa('Mapbox', key);
const myMap = mappa.staticMap(options);
let mapImg;

// datasets
let fullData, province, confini, prov_data;
//images
let italy_bg;

//drawing variables

let mainCanvas, maskCanvas;
let svg;

let imagesLayers = {};

//lens variables
let lens_size = 200;

//timeline buttons
let timeline_btns = [];

//initialize svg
svg = d3.select("#svg_mask").append("svg")
	.attr("width", w + "px")
	.attr("height", h + "px");

var svg_overlay = d3.select("#svg_overlay").append("svg")
	.attr("width", w + "px")
	.attr("height", h + "px");

var masked = svg.append("g")
	.attr('mask', 'url(#hole-mask)');

masked.append('rect')
	.attr('x',0)
	.attr('y',0)
	.attr("width", w + "px")
	.attr("height", h + "px")
	.style("fill","white");

// // add foreign object to svg
// // https://gist.github.com/mbostock/1424037
// var foreignObject = container.append("foreignObject")
// 	.attr("width", w)
// 	.attr("height", h);

// // add embedded body to foreign object
// var foBody = foreignObject.append("xhtml:body")
// 	.attr("id", "foBody")
// 	.style("margin", "0px")
// 	.style("padding", "0px")
// 	.style("background-color", "none")
// 	.style("width", w + "px")
// 	.style("height", h + "px")
// 	.style("position", "relative")

var myTouches = {};
var radius = 100;

var defs = svg.append('defs');

var holeMask = defs.append('mask')
	.attr('id', 'hole-mask')
	.append('g');

holeMask.append('rect')
	.attr('width', '100%')
	.attr('height', '100%')
	.attr('x', 0)
	.attr('y', 0)
	.attr('fill', 'white');

var holeMaskCircles = holeMask.selectAll('.hole-mask-circles');
var overlayCircles = svg_overlay.selectAll('.overlay-circles');

d3.select('#map').on('touchstart', function(d) {
		d3.event.preventDefault();
		if (status.show_TX30 || status.show_PR95PERC || status.show_PRCPTOT) {
			myTouches.x = d3.event.touches[0].clientX - d3.event.touches[0].target.getBoundingClientRect().x;
			myTouches.y = d3.event.touches[0].clientY - d3.event.touches[0].target.getBoundingClientRect().y;
			myTouches.identifier = d3.event.touches[0].identifier;
			d3.select('.no-selection-container')
				.classed('visible', false);
			onStart();
		} else {
			var noSelection = d3.select('.no-selection-container')
				.classed('visible', true);

			noSelection.transition()
				.duration(350)
				.on('end', function(t) {
					d3.select('.no-selection-container')
						.classed('visible', false);
				});
		}
	})
	.on('touchmove', function(d) {
		d3.event.preventDefault();
		if (status.show_TX30 || status.show_PR95PERC || status.show_PRCPTOT) {
			myTouches.x = d3.event.touches[0].clientX - d3.event.touches[0].target.getBoundingClientRect().x;
			myTouches.y = d3.event.touches[0].clientY - d3.event.touches[0].target.getBoundingClientRect().y;
			myTouches.identifier = d3.event.touches[0].identifier;
			d3.select('.no-selection-container')
				.classed('visible', false);
			onMove();
		} else {
			var noSelection = d3.select('.no-selection-container')
				.classed('visible', true);

			noSelection.transition()
				.duration(350)
				.on('end', function(t) {
					d3.select('.no-selection-container')
						.classed('visible', false);
				});
		}
	})
	.on('touchend', function(d) {
		d3.event.preventDefault();
		if (d3.event.touches.length == 0) {
			myTouches = {};
			onEnd();
		}
	});

function onStart() {
	holeMaskCircles = holeMaskCircles.data([myTouches], function(d){ return d.identifier;})
	holeMaskCircles.exit().remove();
	holeMaskCircles = holeMaskCircles.enter().append('circle')
		.attr('class', 'hole-mask-circles')
		.attr('cx', function(d) { return d.x; })
		.attr('cy', function(d) { return d.y; })
		.attr('r', 0)
		.attr('fill', 'black')
		.merge(holeMaskCircles);

	holeMaskCircles.transition()
		.duration(350)
		.ease(d3.easeBackOut)
		.attr('r', radius);

	//
	overlayCircles = overlayCircles.data([myTouches], function(d){ return d.identifier;});
	overlayCircles.exit().remove();
	overlayCircles = overlayCircles.enter().append('circle')
		.attr('class', 'hole-mask-circles')
		.attr('cx', function(d) { return d.x; })
		.attr('cy', function(d) { return d.y; })
		.attr('r', 0)
		.attr('fill', 'white')
		.attr('stroke', graphVars.gray)
		.merge(overlayCircles);

	overlayCircles.transition()
		.duration(350)
		.ease(d3.easeBackOut)
		.attr('r', radius);

	updateLayers(myTouches.x, myTouches.y, true);
}

function onMove() {
	holeMaskCircles.data([myTouches], function(d){ return d.identifier;})
	holeMaskCircles.exit().remove();
	holeMaskCircles.attr('cx', function(d) { return d.x; })
		.attr('cy', function(d) { return d.y; })

	//
	overlayCircles.data([myTouches], function(d){ return d.identifier;})
	overlayCircles.exit().remove();
	overlayCircles.attr('cx', function(d) { return d.x; })
		.attr('cy', function(d) { return d.y; })

	updateLayers(myTouches.x, myTouches.y, true);
}

function onEnd() {
	holeMaskCircles = holeMaskCircles.data([])
	holeMaskCircles.exit()
		.transition()
		.duration(350)
		.ease(d3.easeBackIn)
		.attr('r', 0)
		.remove();

	//
	overlayCircles = overlayCircles.data([])
	overlayCircles.exit()
		.transition()
		.duration(350)
		.ease(d3.easeBackIn)
		.attr('r', 0)
		.remove();

	updateLayers(0, 0, false);
	selectedProvince = '';
}

//load datasets
function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
	province = loadJSON('assets/contorniProvince.json');
	italy_bg = loadImage('assets/italy_bg.png');
	confini = loadJSON('assets/contorni_italia.json');

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

	mainCanvas = createGraphics(w, h);
	mainCanvas.pixelDensity(1);
	mainCanvas.parent('canvas_RCP85_layer');
	mainCanvas.style('display', 'block');
	//mainCanvas.id('mainCanvas')

	maskCanvas = createGraphics(w, h);
	maskCanvas.pixelDensity(1);
	maskCanvas.parent('canvas_map');
	maskCanvas.style('display', 'block');
	maskCanvas.id('maskCanvas');
	//maskCanvas.attribute('mask', 'url(#hole-mask)');

	//initialize map
	prov_layer = new ShapeFileLayer(province, myMap, w, h);
	italy_layer = new ShapeFileLayer(confini, myMap, w, h);

	//call creapallozzi for each variable
	createPallozzi('TX30', graphVars.red);
	createPallozzi('PR95PERC', graphVars.blue);
	createPallozzi('PRCPTOT', graphVars.yellow);

	prov_layer.draw();
	italy_layer.draw();

	updateLayers(0, 0, false);
}

//initialize d3 buttons
d3.selectAll('.timeline_button')
	.on('touchstart', function() {
		// d3.event.preventDefault();
		var activeClass = "selected";

		d3.selectAll(".timeline_button")
			.classed(activeClass, false);
		d3.selectAll(".timeline_button").select('circle').transition().duration(350).ease(d3.easeBackIn).attr('r', 5);
		d3.select(this).classed(activeClass, true);
		d3.select(this).select('circle').transition().duration(350).ease(d3.easeBackOut).attr('r', 10);
		var highlighter = d3.select('#timeline_2011_2040 path');
		switch (this.id) {
			case 'timeline_2011_2040':
				highlighter.transition().attr("transform", "translate(0,0)");
				status.years = '2011-2040';
				break;
			case 'timeline_2041_2070':
				highlighter.transition().attr("transform", "translate(150,0)");
				status.years = '2041-2070';
				break;
			case 'timeline_2071_2100':
				highlighter.transition().attr("transform", "translate(305,0)");
				status.years = '2071-2100';
				break;
		}

		if (myTouches.x == undefined && !status.show_TX30 && !status.show_PR95PERC && !status.show_PRCPTOT) {
			updateLayers(0, 0, false);
		} else {
			updateLayers(myTouches.x, myTouches.y, true);
		}
	});

d3.selectAll('.btn-toggle')
	.on('touchstart', function() {
		var newStatus = this.getAttribute('data-variable');
		var oldStatus = status[newStatus];
		status[newStatus] = !oldStatus;
		this.classList.toggle('selected');
		d3.select('.legenda[data-variable= "'+ newStatus +'"]').node().classList.toggle('shown');
		var $button = d3.select(this).select('p');
		$button.text().includes('Mostra') ? $button.text("Rimuovi dalla mappa") : $button.text("Mostra sulla mappa");
		if (myTouches.x == undefined && !status.show_TX30 && !status.show_PR95PERC && !status.show_PRCPTOT) {
			updateLayers(0, 0, false);
		} else {
			updateLayers(myTouches.x, myTouches.y, true);
		}
	});

var selectedProvince = '';

// variables for all the graphs

var margin = { top: 25, right: 90, bottom: 25, left: 40 };
var sw = +d3.select('#graph_01').style("width").slice(0, -2) - margin.left - margin.right;
var sh = +d3.select('#graph_01').style("height").slice(0, -2) - margin.top - margin.bottom;

var x = d3.scaleOrdinal()
	.domain(["2011-2040", "2041-2070", "2071-2100"])
	.range([0, sw / 2, sw]);

//variables for first graph
var y = d3.scaleLinear()
	.rangeRound([sh, 0])
	.domain([0, 80]);

var area = d3.area()
	.x(function(d) { return x(d.anno); })
	.y1(function(d) { return y(+d.valore); })
	.y0(y(0));

var svg1 = d3.select('#graph_01')

var g1 = svg1.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var axisBottom1 = g1.append("g")
	.attr("transform", "translate(0," + y(0) + ")");
axisBottom1.call(d3.axisBottom(x).tickSize(-sh - 14).tickPadding(8));
axisBottom1.select(".domain").remove();
axisBottom1.selectAll(".tick line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2").attr("transform", "translate(0, 6)");

var axisRight1 = g1.append("g")
	.attr("transform", "translate(" + sw + ", 0)");
axisRight1.call(d3.axisRight(y).tickValues([0,20,40,60,80]).tickSize(-sw - 12).tickPadding(14).tickFormat(function(d) {
	return d > 0 ? "+ " + d + " giorni" : d + " giorni";
}));
axisRight1.select(".domain").remove();
axisRight1.selectAll(".tick text").attr("dy", "0em").style("fill", graphVars.gray);
axisRight1.selectAll(".tick:not(:first-of-type) line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2");
axisRight1.selectAll(".tick line").attr("transform", "translate(6, 0)");

var paths_g1 = g1.append('g');


//variables for second graph
var y2 = d3.scaleLinear()
	.rangeRound([sh, 0])
	.domain([-10, 60]);

var area2 = d3.area()
	.x(function(d) { return x(d.anno); })
	.y1(function(d) { return y2(+d.valore); })
	.y0(y2(0));

var svg2 = d3.select('#graph_02');

var g2 = svg2.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var axisBottom2 = g2.append("g")
	.attr("transform", "translate(0," + y2(0) + ")");
axisBottom2.call(d3.axisBottom(x).tickSize(-sh - 14).tickPadding(30));
axisBottom2.select(".domain").remove();
axisBottom2.selectAll(".tick line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2").attr("transform", "translate(0, 24)");

var axisRight2 = g2.append("g")
	.attr("transform", "translate(" + sw + ", 0)");
axisRight2.call(d3.axisRight(y2).tickValues([-10,0,20,40,60]).tickSize(-sw - 12).tickPadding(14).tickFormat(function(d) {
	return d > 0 ? "+ " + d + " mm" : (d + " mm").replace(/-/,'- ');
}));
axisRight2.select(".domain").remove();
axisRight2.selectAll(".tick text").attr("dy", "0em").style("fill", graphVars.gray);
axisRight2.selectAll(".tick:not(:nth-of-type(2)) line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2");
axisRight2.selectAll(".tick line").attr("transform", "translate(6, 0)");

var paths_g2 = g2.append('g');

//variables for third graph
var y3 = d3.scaleLinear()
	.rangeRound([sh, 0])
	.domain([-320, 28]);

var area3 = d3.area()
	.x(function(d) { return x(d.anno); })
	.y1(function(d) { return y3(+d.valore); })
	.y0(y3(0));

var svg3 = d3.select('#graph_03');

var g3 = svg3.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var axisBottom3 = g3.append("g")
	.attr("transform", "translate(0," + y3(0) + ")");
axisBottom3.call(d3.axisBottom(x).tickSize(-sh - 14).tickPadding(130));
axisBottom3.select(".domain").remove();
axisBottom3.selectAll(".tick line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2").attr("transform", "translate(0, 124)");

var axisRight3 = g3.append("g")
	.attr("transform", "translate(" + sw + ", 0)");
axisRight3.call(d3.axisRight(y3).tickValues([-320,-240,-160,-80,0,40]).tickSize(-sw - 12).tickPadding(14).tickFormat(function(d) {
	return d > 0 ? "+ " + d + " mm" : (d + " mm").replace(/-/,'- ');
}));
axisRight3.select(".domain").remove();
axisRight3.selectAll(".tick text").attr("dy", "0em").style("fill", graphVars.gray);
axisRight3.selectAll(".tick:not(:nth-of-type(5)) line").attr("stroke", graphVars.lightGray).attr("stroke-dasharray", "2,2");
axisRight3.selectAll(".tick line").attr("transform", "translate(6, 0)");

var paths_g3 = g3.append('g');


function updateLayers(_x, _y, _showPanel) {
	//clear canvas
	mainCanvas.clear();

	//draw background
	mainCanvas.image(italy_layer.image, 0, 0, w, h);
	//prov_layer

	mainCanvas.blendMode(MULTIPLY);


	if (status.show_TX30) {
		// draw the RCP85 image
		mainCanvas.image(imagesLayers[status.years + '-TX30-RCP85'], 0, 0, w, h);
		d3.select('#graph_01_container').style("opacity", 1);
	} else {
		d3.select('#graph_01_container').style("opacity", 1e-6);
	}
	if (status.show_PR95PERC) {
		// draw the RCP85 image
		mainCanvas.image(imagesLayers[status.years + '-PR95PERC-RCP85'], 0, 0, w, h);
		d3.select('#graph_02_container').style("opacity", 1);
	} else {
		d3.select('#graph_02_container').style("opacity", 1e-6);
	}
	if (status.show_PRCPTOT) {
		// draw the RCP85 image
		mainCanvas.image(imagesLayers[status.years + '-PRCPTOT-RCP85'], 0, 0, w, h);
		d3.select('#graph_03_container').style("opacity", 1);
	} else {
		d3.select('#graph_03_container').style("opacity", 1e-6);
	}

	//update panel
	if (_showPanel && (status.show_TX30 || status.show_PR95PERC || status.show_PRCPTOT)) {

		maskCanvas.clear();

		var newprov = prov_layer.drawInFront(_x, _y);
		// console.log(newprov.properties.DEN_CMPRO);
		//maskCanvas.image(prov_layer.image, 0, 0, w, h);

		maskCanvas.blendMode(MULTIPLY);

		if (status.show_TX30)
			maskCanvas.image(imagesLayers[status.years + '-TX30-RCP45'], 0, 0, w, h);
		if (status.show_PR95PERC)
			maskCanvas.image(imagesLayers[status.years + '-PR95PERC-RCP45'], 0, 0, w, h);
		if (status.show_PRCPTOT)
			maskCanvas.image(imagesLayers[status.years + '-PRCPTOT-RCP45'], 0, 0, w, h);

		// if (newprov != null && newprov.properties.DEN_CMPRO != selectedProvince) {
		if (newprov != null) {

			selectedProvince = newprov.properties.DEN_CMPRO;


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
			});

			var graphRect1 = g1.selectAll('.graph-rect')
				.data([1]);

			graphRect1.enter()
				.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 20)
				.attr("ry", 20)
				.attr("y", y(85))
				.attr("width", 40)
				.attr("height", y(0) + 13)
				.merge(graphRect1)
				.transition()
				.attr("x", x(status.years) - 20);

			//first text
			var value1_RCP85 = Math.round(+TX30_data[0].values.filter(function(d) { return d.anno == status.years })[0].valore);
			var value1_RCP45 = Math.round(+TX30_data[1].values.filter(function(d) { return d.anno == status.years })[0].valore);
			d3.select("#desc_01").html('Nel trentennio ' + status.years + ', ci saranno circa <span class="scrittaMagenta">' + Math.abs(value1_RCP85) + ' giorni di caldo intenso in ' + (value1_RCP85 > 0 ? 'più' : 'meno') + '</span> rispetto ad oggi. Con l’adozione di politiche climatiche, i giorni in ' + (value1_RCP45 > 0 ? 'più' : 'meno') + ' rispetto ad oggi saranno circa ' + Math.abs(value1_RCP45) + '.').transition().style('opacity', 1);

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
				.attr("d", function(d) { return area2(d.values) });

			axisBottom2.selectAll('.tick text').style('fill', function(d) {
				return d == status.years ? graphVars.black : graphVars.gray;
			}).style('font-weight', function(d) {
				return d == status.years ? "bold" : "normal";
			});

			var graphRect2 = g2.selectAll('.graph-rect')
				.data([2]);

			graphRect2.enter()
				.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 20)
				.attr("ry", 20)
				.attr("y", y2(65))
				.attr("width", 40)
				.attr("height", y2(-8) + 18)
				.merge(graphRect2)
				.transition()
				.attr("x", x(status.years) - 20);

			//second text
			var value2_RCP85 = Math.round(+PR95PERC_data[0].values.filter(function(d) { return d.anno == status.years })[0].valore);
			var value2_RCP45 = Math.round(+PR95PERC_data[1].values.filter(function(d) { return d.anno == status.years })[0].valore);
			d3.select("#desc_02").html('Nel trentennio ' + status.years + ', nei giorni di pioggia intensa cadranno circa <span class="scrittaCyan">' + Math.abs(value2_RCP85) + ' mm di pioggia in ' + (value2_RCP85 > 0 ? 'più' : 'meno') + '</span> rispetto ad oggi. Con l’adozione di politiche climatiche, i mm in ' + (value2_RCP45 > 0 ? 'più' : 'meno') + ' rispetto ad oggi saranno circa ' + Math.abs(value2_RCP45) + '.').transition().style('opacity', 1);

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
				.attr("transform", "translate(0,1)")
				.merge(paths3)
				.transition()
				.attr("d", function(d) { return area3(d.values) });

			axisBottom3.selectAll('.tick text').style('fill', function(d) {
				return d == status.years ? graphVars.black : graphVars.gray;
			}).style('font-weight', function(d) {
				return d == status.years ? "bold" : "normal";
			});

			var graphRect3 = g3.selectAll('.graph-rect')
				.data([3]);

			graphRect3.enter()
				.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 20)
				.attr("ry", 20)
				.attr("y", y3(55))
				.attr("width", 40)
				.attr("height", y3(-320) + 15)
				.merge(graphRect3)
				.transition()
				.attr("x", x(status.years) - 20);

			//third text
			var value3_RCP85 = Math.round(+PRCPTOT_data[0].values.filter(function(d) { return d.anno == status.years })[0].valore);
			var value3_RCP45 = Math.round(+PRCPTOT_data[1].values.filter(function(d) { return d.anno == status.years })[0].valore);
			d3.select("#desc_03").html('Nel trentennio ' + status.years + ', nei mesi estivi scenderanno circa <span class="scrittaYellow">' + Math.abs(value3_RCP85) + ' mm di acqua in ' + (value3_RCP85 > 0 ? 'più' : 'meno') + '</span> rispetto ad oggi. Con l’adozione di misure di mitigazione dei cambiamenti climatici, la variazione sarà di circa ' + Math.abs(value3_RCP45) + ' mm in ' + (value3_RCP45 > 0 ? 'più' : 'meno') + '.').transition().style('opacity', 1);

			d3.select('.graphs-box').transition().style("opacity", 1);
		} else if (newprov == null) {
			selectedProvince = '';
			d3.selectAll('.graph-rect').remove();
			d3.select('#nomeprovincia').html('Seleziona una provincia');

			//first graph
			var paths1 = paths_g1.selectAll("path")
				.data([{"key": "RCP85", "values": [{"anno": "2011-2040", "valore": "0"}, {"anno": "2041-2070", "valore": "0"}, {"anno": "2071-2100", "valore": "0"}]}, {"key": "RCP45", "values": [{"anno": "2011-2040", "valore": "0"}, {"anno": "2041-2070", "valore": "0"}, {"anno": "2071-2100", "valore": "0"}]}]);

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
			});

			var graphRect1 = g1.selectAll('.graph-rect')
				.data([1]);

			graphRect1.enter()
				.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 20)
				.attr("ry", 20)
				.attr("y", y(85))
				.attr("width", 40)
				.attr("height", y(0) + 13)
				.merge(graphRect1)
				.transition()
				.attr("x", x(status.years) - 20);

			d3.select("#desc_01").transition().style('opacity', 1e-6);

			//second graph
			var paths2 = paths_g2.selectAll("path")
				.data([{"key": "RCP85", "values": [{"anno": "2011-2040", "valore": "0"}, {"anno": "2041-2070", "valore": "0"}, {"anno": "2071-2100", "valore": "0"}]}, {"key": "RCP45", "values": [{"anno": "2011-2040", "valore": "0"}, {"anno": "2041-2070", "valore": "0"}, {"anno": "2071-2100", "valore": "0"}]}]);

			paths2.enter()
				.append("path")
				.attr("fill", function(d) { return d.key == 'RCP85' ? graphVars.blue : graphVars.lightGray; })
				.style("opacity", function(d) { return d.key == 'RCP85' ? 1 : .8 })
				.merge(paths2)
				.transition()
				.attr("d", function(d) { return area2(d.values) });

			axisBottom2.selectAll('.tick text').style('fill', function(d) {
				return d == status.years ? graphVars.black : graphVars.gray;
			}).style('font-weight', function(d) {
				return d == status.years ? "bold" : "normal";
			});

			var graphRect2 = g2.selectAll('.graph-rect')
				.data([2]);

			graphRect2.enter()
				.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 20)
				.attr("ry", 20)
				.attr("y", y2(65))
				.attr("width", 40)
				.attr("height", y2(-8) + 18)
				.merge(graphRect2)
				.transition()
				.attr("x", x(status.years) - 20);

			d3.select("#desc_02").transition().style('opacity', 1e-6);

			//third graph
			var paths3 = paths_g3.selectAll("path")
				.data([{"key": "RCP85", "values": [{"anno": "2011-2040", "valore": "0"}, {"anno": "2041-2070", "valore": "0"}, {"anno": "2071-2100", "valore": "0"}]}, {"key": "RCP45", "values": [{"anno": "2011-2040", "valore": "0"}, {"anno": "2041-2070", "valore": "0"}, {"anno": "2071-2100", "valore": "0"}]}]);

			paths3.enter()
				.append("path")
				.attr("fill", function(d) { return d.key == 'RCP85' ? graphVars.yellow : graphVars.lightGray; })
				.style("opacity", function(d) { return d.key == 'RCP85' ? 1 : .8 })
				.attr("transform", "translate(0,1)")
				.merge(paths3)
				.transition()
				.attr("d", function(d) { return area3(d.values) });

			axisBottom3.selectAll('.tick text').style('fill', function(d) {
				return d == status.years ? graphVars.black : graphVars.gray;
			}).style('font-weight', function(d) {
				return d == status.years ? "bold" : "normal";
			});

			var graphRect3 = g3.selectAll('.graph-rect')
				.data([3]);

			graphRect3.enter()
				.append("rect")
				.classed("graph-rect", true)
				.attr("rx", 20)
				.attr("ry", 20)
				.attr("y", y3(55))
				.attr("width", 40)
				.attr("height", y3(-320) + 15)
				.merge(graphRect3)
				.transition()
				.attr("x", x(status.years) - 20);

			d3.select("#desc_03").transition().style('opacity', 1e-6);

			if (myTouches.x != undefined) {
				d3.select('.graphs-box').transition().style("opacity", 1);
			}
		}
	} else {
		d3.select('.graphs-box').transition().style("opacity", 1e-6);

		holeMaskCircles.transition()
			.duration(350)
			.ease(d3.easeBackIn)
			.attr('r', 0)
			.remove();

		overlayCircles.transition()
			.duration(350)
			.ease(d3.easeBackIn)
			.attr('r', 0)
			.remove();
	}
}

function createPallozzi(_variable, _color) {
	var maxVals = {
		TX30: 74,
		PR95PERC: 87,
		PRCPTOT: -410
	}
	//create the points
	points = [];

	// formula magica, ottieni distanza tra punti
	var p1 = myMap.latLngToPixel(fullData.values[0].lat, fullData.values[0].lon);
	var p2 = myMap.latLngToPixel(fullData.values[1].lat, fullData.values[1].lon);
	var distance = (p1.x - p2.x) / 5.55;

	var maxVal = Math.sqrt(Math.abs(maxVals[_variable]));

	fullData.values.forEach(function(item) {

		const latitude = item.lat;
		const longitude = item.lon;

		// Transform lat/lng to pixel position
		const pos = myMap.latLngToPixel(latitude, longitude);

		//save the point
		var p = {
			'x': pos.x,
			'y': pos.y,
			'item': item
		};
		points.push(p);
	})

	//now create all the images
	var ya = ["2011-2040", "2041-2070", "2071-2100"].forEach(function(_year) {
		var image_RCP85 = createImage(w, h);
		var image_RCP45 = createImage(w, h);
		var layer = createGraphics(w, h);
		//layer.id("layer" + "-" + _year +"-"+ _variable+"-"+ _scenario)
		layer.clear();
		//layer.background('white');
		layer.noStroke();
		layer.ellipseMode(CENTER);
		layer.fill(_color);

		//draw rcp85
		points.forEach(function(p) {
			//calculate size
			let size = Math.sqrt(Math.abs(p.item[_year][_variable]['RCP85']));
			size = map(size, 0, maxVal, 0, distance);

			layer.ellipse(p.x, p.y, size);
		});

		image_RCP85.copy(layer, 0, 0, layer.width, layer.height, 0, 0, layer.width, layer.height);
		layer.clear();
		//draw rcp45
		points.forEach(function(p) {
			//calculate size
			let size = Math.sqrt(Math.abs(p.item[_year][_variable]['RCP85'] - p.item[_year][_variable]['RCP45']));
			size = map(size, 0, maxVal, 0, distance);

			layer.ellipse(p.x, p.y, size);
		});

		image_RCP45.copy(layer, 0, 0, layer.width, layer.height, 0, 0, layer.width, layer.height);

		layer.remove();

		//push to the main object
		imagesLayers[_year + "-" + _variable + "-RCP85"] = image_RCP85;
		imagesLayers[_year + "-" + _variable + "-RCP45"] = image_RCP45;
	})

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

	this.drawInFront = function(_mx, _my) {
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
		var outimg = createImage(layer.width, layer.height);
		outimg.copy(layer, 0, 0, layer.width, layer.height, 0, 0, layer.width, layer.height);

		maskCanvas.image(outimg, 0, 0);

		return selected;
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
