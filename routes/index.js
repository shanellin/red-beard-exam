module.exports = app => {
  const map = require('./map'); 
  app.use(/^\/$/, map.index);
  app.use('/index', map.index);
};
