
// Layout taken from Assignment 1 Workshop Module//
//function (isNonNegInt) taken from example 1 assignment
// Determines valid quantity (If "q" is a negative integer)
function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    return return_errors ? errors : (errors.length == 0);
};


//Load in query string, product info, and express package
const qs=require('node:querystring');
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
app.post("/purchase", function(request, response, next){
    console.log(request.body);
    var q;
    var has_quantities = false;
    var errors = {};
    //advice for later: serialize error object; find better way to pass errors back and forth for Assignment2
    for (let i in products) {
        q = request.body['quantity' + i];
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
            if (q > products[i].amt_ava) {  //if quantity entered is greater than quantity available 
                errors['stock_outage' + i ] = `We currenly don't have ${(q)} ${products[i].name}s. Please check back later!`
            }
        }
    }
    // This code is to print out an error stating that the user needs to select quantites instead of leaving it blank
    if(has_quantities == false) {
        errors['no_selections_error'] = "Please select some items to purchase!";
    }
    // This code is for when there are no errors and will move the user on towards the invoice.html file I have instead of directing them back to products display (like when we do have an error)
    if (Object.keys(errors).length == 0) {
        //If quantities are valid, remove quantities from the quantity available.
        for(let i in products){
            products[i].amt_ava -= Number(request.body['quantity' + i]);
        }
        response.redirect("./invoice.html?" + qs.stringify(request.body));
    } else {
        response.redirect("./products_home.html?" +  qs.stringify(request.body) + '&' + qs.stringify(errors));
    }
});


// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
