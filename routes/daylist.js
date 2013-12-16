var util = require('util');

exports.index = function(req, res){
	var pg = require('pg');
	var moment = require('moment');
	var conString = process.env.POSTGRES_CONNECTION_STRING

	pg.connect(conString, function(err, client, done) 
	{
		console.log(done);
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		var query = client.query("SELECT count(*) as datapoints, date_trunc('day', timestamp) as day FROM temperature WHERE true GROUP BY day ORDER BY day ASC");
		
		query.on('row', function(row, result) {
			console.log(row);
			if(row.datapoints > 50){
				row.date = moment(row.day).format("MM-DD-YYYY");
				result.addRow(row);
			}
		});
		
		query.on('end',function(result) {
			var days = result.rows;
			res.render('daylist', { days: days });
		});
	});
}