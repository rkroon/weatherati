function replaceGraph(tempData, priceData) {

	var margin = {top: 20, right: 75, bottom: 30, left: 60},
	width = 950 - margin.left - margin.right,
	height = 350 - margin.top - margin.bottom;
	
	d3.select("#graph").select("svg").remove();
	
	var svg = d3.select("#graph").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var x = d3.time.scale()
		.range([0, width]);
	
	var y = d3.scale.linear()
		.range([height, 0]);
	
	var priceY = d3.scale.linear()
		.range([height, 0]);
	
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
	
	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	
	var priceYAxis = d3.svg.axis()
		.scale(priceY)
		.orient("right");
	
	if(tempData && priceData){	
		
		var tempLine = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return y(d.temp); });
		
		var priceLine = d3.svg.line()
			.x(function(d) { return x(d.date); })
			.y(function(d) { return priceY(d.price); });
		
	
		
		var parseDate = d3.time.format.iso.parse;
		
		tempData.forEach(function(d) {
			d.date = parseDate(d.timestamp);
			d.temp = +d.temperature;
		});
		
		priceData.forEach(function(d) {
			d.date = parseDate(d.timestamp);
			d.price = d.price;
		});
		
		var tempMax = d3.max(tempData, function(d) { return d.temp; } ) + 2;
		var tempMin = d3.min(tempData, function(d) { return d.temp; } ) - 2;
		
		var priceMax = d3.max(priceData, function(d) { return d.price; }) + 10;
		var priceMin = d3.min(priceData, function(d) { return d.price; }) - 10;
		
		y.domain([tempMin.toFixed(0), tempMax.toFixed(0)]);
		priceY.domain([priceMin.toPrecision(3), priceMax.toPrecision(3)]);
		x.domain(d3.extent(tempData, function(d) { return d.date; }));
		
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
		
		svg.append("g")
			.attr("class", "y axis")
			.style("fill", "steelblue")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -40)
			.style("fill", "steelblue")
			.style("text-anchor", "end")
			.text("Temperature (ºF)");
		
		svg.append("g")
			.attr("class", "y axis")
			.call(priceYAxis)
			.style("fill", "red")
			.attr("transform", "translate(" + width + ", 0)")
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 70)
			.style("fill", "red")
			.style("text-anchor", "end")
			.text("NASDAQ Index");
		
		svg.append("path")
			.datum(tempData)
			.attr("class", "tline")	
			.attr("d", tempLine);
		
		svg.append("path")
			.datum(priceData)
			.attr("class", "pline")
			.attr("d", priceLine);
	}
	else{
		svg.append("g")
			.attr("class", "y axis")
			.style("fill", "steelblue")
			.append("text")
			.attr("y", 170)
			.attr("x", 440)
			.style("fill", "steelblue")
			.style("text-anchor", "end")
			.text("Loading Data...");	
	}
}

function dataTable(tempData, priceData){ 
	
	var dataTable = d3.select("#dataTable");
	dataTable.select("tr").remove();
	
	var headerHtml = new EJS({url: '/templates/index/datatableheader.ejs'}).render();
	dataTable.html(headerHtml);
	
	var rowTemplate = new EJS({url: '/templates/index/datatablerow.ejs'});
	
	if(tempData && priceData){
		for(var i=0; i < tempData.length; i++)
		{
			var rowData = {};
			rowData.date = new Date(tempData[i].timestamp);
			rowData.h = rowData.date.getHours();
			rowData.m = rowData.date.getMinutes();
			rowData.tempChange = tempData[i].tempChange;
			rowData.temperature = tempData[i].temperature;
			rowData.priceChange = 0;
	
			if(priceData[i])
			{
				rowData.priceChange = priceData[i].priceChange;
				rowData.price = priceData[i].price	
			}
			
			var html = rowTemplate.render(rowData);
			dataTable.html(dataTable.html() + html);
		}
	}
}

function loadData(date, span){
	replaceGraph(null,null);
	dataTable(null,null);
	d3.xhr('./data?date='+ date +'&span='+ span , 'JSON', function(request){
		if(request.error){
			console.log(request)
		}	
		else{	
			var response = JSON.parse(request.response);				
			replaceGraph(response.tempData, response.priceData);	
			dataTable(response.tempData, response.priceData);
		}
	});	
}

function previousDay(){
	loadData(date.subtract("days", 1).format('MM-DD-YYYY'), span);
	d3.select("#currentDay").html(date.format("MMM D, YYYY"));	
}

function nextDay(){
	loadData(date.add("days", 1).format('MM-DD-YYYY'), span);
	d3.select("#currentDay").html(date.format("MMM D, YYYY"));	
}

function byHour(){
	if(span != 'hour'){
		span = 'hour';
		loadData(date.format('MM-DD-YYYY'), span);
		d3.select("#minuteSpan").classed('current', false);
		d3.select("#hourSpan").classed('current', true);
	}
}

function byMinute(){
	if(span != 'minute'){
		span = 'minute';
		loadData(date.format('MM-DD-YYYY'), span);
		d3.select("#minuteSpan").classed('current', true);
		d3.select("#hourSpan").classed('current', false);
	}
}
		
d3.select("#previousDay").on("click", previousDay);
d3.select("#nextDay").on("click", nextDay);
d3.select("#hourSpan").on("click", byHour);
d3.select("#minuteSpan").on("click", byMinute);
