let promises = [d3.json('assets/contorni_italia.json'),
	d3.json('assets/contorniProvince.json'),
	d3.json('assets/climatechange_data.json'),
	d3.tsv('assets/climate-change-provincie.tsv')
];

var colors = {
	mapStroke: '#ddd',
	mapFill: '#fff'
}

var width = 960*2;
var height = 960*2;

var svg = d3.select("#map")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

var layers = {
	TX30_85: {},
	TX30_45: {},
	PRCPTOT_85: {},
	PRCPTOT_45: {},
	PR95PERC_85: {},
	PR95PERC_45: {}
}

//prepare mask
var myTouches;
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
	.attr('fill', 'black');

var holeMaskCircles = holeMask.selectAll('.hole-mask-circles');

var baseLayer = svg.append('g')
	.classed('base-layer', true);

var maskedLayer = svg.append('g')
	.classed('masked-layer', true)
	.attr('mask', 'url(#hole-mask)');

svg.on('touchstart', function(d) {
		d3.event.preventDefault();
		myTouches = d3.event.touches;
		onStart();
	})
	.on('touchmove', function(d) {
		d3.event.preventDefault();
		myTouches = d3.event.touches;
		onMove();
	})
	.on('touchend', function(d) {
		d3.event.preventDefault();
		myTouches = d3.event.touches;
		onEnd();
	})

function onStart() {
	holeMaskCircles = holeMaskCircles.data([myTouches[0]], function(d) { return d.identifier; })
	holeMaskCircles.exit().remove();
	holeMaskCircles = holeMaskCircles.enter().append('circle')
		.attr('class', 'hole-mask-circles')
		.attr('cx', function(d) { return d.clientX; })
		.attr('cy', function(d) { return d.clientY; })
		.attr('r', 0)
		.attr('fill', 'white')
		.merge(holeMaskCircles);

	holeMaskCircles.transition()
		.duration(350)
		.ease(d3.easeBackOut)
		.attr('r', radius);
}

function onMove() {
	holeMaskCircles.data(myTouches, function(d) { return d.identifier; })
		.attr('cx', function(d) { return d.clientX; })
		.attr('cy', function(d) { return d.clientY; })
}

function onEnd() {
	holeMaskCircles = holeMaskCircles.data(myTouches, function(d) { return d.identifier; })
	holeMaskCircles.exit()
		.transition()
		.duration(350)
		.ease(d3.easeBackIn)
		.attr('r', 0)
		.remove();
}

var projection = d3.geoMercator()
	.scale(200)
	.translate([width / 2, height / 2])

//load data, start everything

Promise.all(promises).then(function(data) {

	projection.fitSize([width, height], data[0]);

	var path = d3.geoPath()
		.projection(projection);

	baseLayer.append("path")
		.attr("d", path(data[0]))
		.attr("id", "background_map")

	var g = baseLayer.append("g")
		.attr('mask', 'url(#hole-mask)');

	g.selectAll("path")
		.data(data[1].features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "provincia")
		.attr("id", function(d) { return d.properties.name; })
	// .on("touchstart", function(d) { d3.select(this).classed("selected", true) })
	// .on("touchmove", function(d) { d3.select(this).classed("selected", true) })
	// .on("touchend", function(d) { d3.select(this).classed("selected", false) });

	var rscale = d3.scaleSqrt()
		.domain([0, 88])
		.range([0, 3]);

	// layers.TX30_85 = svg.append('g')
	// 	.attr('id','TX30_85')
	// 	.selectAll("circle")
	// 	.data(data[2].values).enter()
	// 	.append("circle")
	// 	.attr("cx", function (d) { return projection([d.lon, d.lat])[0]; })
	// 	.attr("cy", function (d) { return projection([d.lon, d.lat])[1]; })
	// 	.attr("r", function(d){ return rscale(d['2071-2100']['TX30']['RCP85']) })
	// 	.attr("fill", "red");

	// layers.TX30_85 = initializeLayer(svg, data[2], '2071-2100', 'TX30', 'RCP85', 74, '#ff0086');
	// layers.TX30_852 = initializeLayer(svg, data[2], '2071-2100', 'PRCPTOT', 'RCP85', -410, '#00fff8');
	// layers.TX30_853 = initializeLayer(svg, data[2], '2071-2100', 'PR95PERC', 'RCP85', 88, '#f9ff00');
	// layers.TX30_45 = initializeLayer(svg, data[2], '2071-2100', 'TX30', 'RCP45', 88);

	maskedLayer.append("svg:image")
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height)
		.attr("xlink:href", "assets/layerz/rosa.png")

	maskedLayer.append("svg:image")
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height)
		.attr("xlink:href", "assets/layerz/blue.png")

	maskedLayer.append("svg:image")
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', width)
		.attr('height', height)
		.attr("xlink:href", "assets/layerz/yellove.png")
})

function initializeLayer(_svg, _data, _year, _variable, _scenario, _maxVal, _color) {

	console.log(_data);

	var rscale = d3.scaleSqrt()
		.domain([0, _maxVal])
		.range([0, 3]);

	var result = _svg.append('g')
		.attr('id', _variable + "_" + _scenario)
		.selectAll("circle")
		.data(_data.values).enter()
		.append("circle")
		.attr("fill", _color)
		.attr("cx", function(d) { return projection([d.lon, d.lat])[0]; })
		.attr("cy", function(d) { return projection([d.lon, d.lat])[1]; })
		.attr("r", function(d) { 
			if(rscale(d[_year][_variable][_scenario]) > 0) {
				return rscale(d[_year][_variable][_scenario])
			} else {
				return 0;
			}
		 })
	// .attr('mask', 'url(#hole-mask)');

	console.log(result.size())

	return result;
}