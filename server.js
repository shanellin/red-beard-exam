var express = require('express');
var path = require('path');

var app = express();
var port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', ()=> console.log(`Running on ${port}`));

app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'dist')));

require('./routes/index.js')(app);
module.exports = app;
