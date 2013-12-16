var cronJob = require('cron').CronJob;
var Forecast = require('forecast.io');
var util = require('util');
var http = require('http');

var latitude = process.env.LATITUDE;
var longitude = process.env.LONGITUDE;

var forecastOptions = {
	APIKey: process.env.FORECAST_API_KEY
};

var forecast = new Forecast(forecastOptions);

var pg = require('pg');
var conString = process.env.POSTGRES_CONNECTION_STRING

new cronJob('0 20,40 * * * *', function(){
	http.get('weatherati.herokuapp.com', function(res) { 
		console.log("Keep Alive");
	});
}, null, true);

new cronJob('0 * * * * *', function(){
    
    var lastPrice, currentTemperature
	
	var url = process.env.YAHOO_FINANCE_URL;
	var time = require('time');
	var dateTime = new time.Date();

	dateTime.setTimezone('America/New_York');
	
	console.log("Current NYC Time: " + dateTime); 
	if(dateTime.getHours() > 9 && dateTime.getHours() < 17) {
	
		http.get(url, function(res) {	
		    var body = '';
		
		    res.on('data', function(chunk) {
		        body += chunk;
		    });
		
		    res.on('end', function() {
		    	var nasdaqResult
		    	try{
		       		nasdaqResult = JSON.parse(body)
		       		lastPrice = nasdaqResult.query.results.quote.LastTradePriceOnly
			         
			        console.log((dateTime.getTime()/1000).toFixed(0));
					forecast.getAtTime(latitude, longitude, ((dateTime.getTime()/1000).toFixed(0)), function (err, res, data) {
					  if (err) throw err;
						console.log('Updating WEATHER DATA');
					  	console.log('Current Temperature: ' + util.inspect(data.currently.temperature));
					 	currentTemp = util.inspect(data.currently.temperature);
					 	console.log('Updating NASDAQ DATA');
					 	console.log("Current Price: ", nasdaqResult.query.results.quote.LastTradePriceOnly);
										 	
						pg.connect(conString, function(err, client, done) {
							if(err) {
								return console.error('error fetching client from pool', err);
							}
							client.query(util.format('INSERT INTO temperature(name, temperature, location, "timestamp") VALUES (\'New York Stock Exchange\', \'%d\', \'(%d,%d)\', \'%s\');',currentTemp, latitude, longitude, dateTime.toISOString()), function(err, result) {
							
								client.query(util.format('INSERT INTO stock(name, code, price, "timestamp") VALUES (\'NASDAQ Index\', \'%s\', \'%d\', \'%s\');','IXIC^', lastPrice, dateTime.toISOString()), function(err, result) {
							
								    if(err) {
								      return console.error('error running query', err);
								    }
								});	
											
								if(err) {
									return console.error('error running query', err);
								}
							});
						});	
					});
		        }
		        catch(e){
		        	console.log("ERROR %s", e);	
		        }
			});
		}).on('error', function(e) {
			console.log("Got error: %s", e);
		});
    }
}, null, true);