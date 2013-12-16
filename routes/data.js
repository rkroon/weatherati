
/*
 * GET home page.
 */
var util = require('util');
var time = require('time');
		
exports.index = function(req, res){
	var pg = require('pg');
	var conString = process.env.POSTGRES_CONNECTION_STRING;
	
	var span = req.query.span;
	var requestDate = req.query.date;
	
	if((span == "minute" || span == "hour") && time.Date(requestDate)){

		var temperatureQueryString, priceQueryString;
		
		var dateFrom, dateTo;
		
		var previousTemp, previousPrice;
			
		if(requestDate)
		{
			dateFrom = new time.Date(requestDate);
			dateTo = new time.Date(requestDate);
		}
		else
		{
			dateFrom = new time.Date();
			dateTo = new time.Date();
		}
		
		dateFrom.setTimezone('America/New_York');
		dateTo.setTimezone('America/New_York');
						
		dateFrom.setHours(9);
		dateFrom.setMinutes(20);
		dateFrom.setSeconds(0);
		dateTo.setHours(16);
		dateTo.setMinutes(10);
		dateTo.setSeconds(0);
		
		if(span && span == "hour"){
			temperatureQueryString = util.format('SELECT AVG(temperature), EXTRACT(hour from timestamp) as hour FROM temperature WHERE timestamp > \'%s\' AND timestamp < \'%s\' GROUP BY hour ORDER BY hour ASC', dateFrom.toISOString(), dateTo.toISOString());
			priceQueryString = util.format('SELECT AVG(price), EXTRACT(hour from timestamp) as hour FROM stock WHERE timestamp > \'%s\' AND timestamp < \'%s\' GROUP BY hour ORDER BY hour ASC', dateFrom.toISOString(), dateTo.toISOString());
		}
		else{
			span = "minute";
			temperatureQueryString = util.format('SELECT temperature, timestamp FROM temperature WHERE timestamp > \'%s\' AND timestamp < \'%s\'', dateFrom.toISOString(), dateTo.toISOString());
			priceQueryString = util.format('SELECT price, timestamp FROM stock WHERE timestamp > \'%s\' AND timestamp < \'%s\'', dateFrom.toISOString(), dateTo.toISOString());
		}
		
		pg.connect(conString, function(err, client, done) 
		{
			if(err) {
				return console.error('error fetching client from pool', err);
			}
			var query = client.query(temperatureQueryString);
			
			query.on('row', function(row, result) {
					if(span == "minute"){
						var rowDate = new time.Date(row.timestamp, 'UTC');
						rowDate.setTimezone('America/New_York');
						row.timestamp = rowDate.toISOString()
						if(previousTemp){
							row.tempChange = row.temperature - previousTemp;
						}
						else{
							row.tempChange = 0;	
						}
						previousTemp = row.temperature;
						result.addRow(row);
					}
					else{
						var rowDate = new time.Date(dateFrom);
						rowDate.setHours(row.hour)
						row.timestamp = rowDate.toISOString()
						row.temperature = row.avg
						if(previousTemp){
							row.tempChange = row.temperature - previousTemp;
						}
						else{
							row.tempChange = 0;	
						}
						previousTemp = row.temperature;
						result.addRow(row);					
					}
			});
			
			query.on('end',function(result) {
				
				var tempData = result.rows;
	
				var priceQuery = client.query(priceQueryString);
						
				priceQuery.on('row', function(row, result) {
					if(span == "minute"){
						var rowDate = new time.Date(row.timestamp, 'UTC');
						rowDate.setTimezone('America/New_York');
						row.timestamp = rowDate.toISOString()
						if(previousPrice){
							row.priceChange = row.price - previousPrice;
						}
						else{
							row.priceChange = 0;	
						}
						previousPrice = row.price;
						result.addRow(row);
					}
					else{
						var rowDate = new time.Date(dateFrom);
						rowDate.setHours(row.hour)
						row.timestamp = rowDate.toISOString()
						row.price = row.avg
						if(previousPrice){
							row.priceChange = row.price - previousPrice;
						}
						else{
							row.priceChange = 0;	
						}
						previousPrice = row.price;
						result.addRow(row);					
					}
				});
			
				priceQuery.on('end',function(result) {
					var priceData = result.rows;
					res.json({ priceData: priceData, tempData: tempData});
					done();
					
				});
			});
		});
	}
	else{
		res.json({error: "Incorrect Request Format" })
	}
}
