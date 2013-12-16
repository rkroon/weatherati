/**
 * Module dependencies.
 */

var config = require('./config');
var express = require('express');
var routes = require('./routes');
var data = require('./routes/data');
var daylist = require('./routes/daylist');
var path = require('path');
var http = require('http');
var app = express();
var dataJob = require('./dataJob')

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/data', data.index);
app.get('/daylist', daylist.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
