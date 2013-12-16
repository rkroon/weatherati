exports.index = function(req, res){
	var span = req.query.span;
	if(!span){
		span = 'hour';
	}
	var requestDate = req.query.date;
	if(!requestDate){
		var moment = require('moment');
		requestDate = moment().format("MM-DD-YYYY");
	}
			
	res.render('index', {requestDate: requestDate, requestSpan: span});
}
