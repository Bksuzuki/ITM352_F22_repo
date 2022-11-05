
// Layout taken from Assignment 1 Workshop Module//
 //functions taken from example 1 assignments
// Determines valid quantity (If "q" is a negative interger)
function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    return return_errors ? errors : (errors.length == 0);
};

//Load in query string, product info, and express package
var qs=require('querystring');
var products = require(__dirname + '/products.json');
var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true }));

// monitor all requests  
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// Routing 
app.get("/products.js", function(request, response, next)
        {
            response.type('.js');
            var products_str = `var products = ${JSON.stringify(products)};`;
            response.send(products_str);
        });

// process purchase request (validate quantities, check quantity available)
app.post("/purchase", function(req, res, next){
    console.log(req.body);
    var q;
    var has_quantities = false;
    var errors = {};
    for (let i in products) {
        q = req.body['quantity' + i];
            if (typeof q != 'undefined') {
            console.log(q);
            // this code is to check whether or not any quantities have been selected by the user
            if(q>0) {
                has_quantities = true;
            }
            // This checks if the inputted quantites are valid pieces of data
            if(isNonNegInt(q,false) == false) {
                errors['quantity_error'+i] = isNonNegInt(q,true);
            }
            if (q[i] > products[i].amt_ava) {
                errors['available_' + i] = `We don't have ${(quantities[i])} ${products[i].item} ready to ship, order less or check our stock later!`
            }
            }};
            
            if(has_quantities == false) {
                errors['no_selections_error'] = "Please select items!"};

            


    // if there are no errors, put quanitites into a query string and send them to the invoice. Otherwise, send back to products display
    
    var quantity_qs = qs.stringify(req.body)
    if (Object.keys(errors).length > 0){
        console.log(errors)
        res.redirect("./products_home.html?" + quantity_qs + '&' + qs.stringify({"errors_alerts": JSON.stringify(errors)}));
    }

    else{
        res.redirect('./invoice.html?'+quantity_qs);
    }
}); 


// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
