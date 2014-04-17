
/*
 * GET home page.
 */

exports.index = function(req, res){
  if(req.query) {
    console.log("name: ", req.query.name)
  }
  res.render('index.html');
};