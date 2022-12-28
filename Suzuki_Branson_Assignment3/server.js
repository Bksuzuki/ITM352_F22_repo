
// Made by Branson Suzuki Fall 2022
// Layout taken from Assignment 1 Workshop Module//
//function (isNonNegInt) taken from example 1 assignment
// Copied and Modified Blake Saari's Spring 2022 Assignment 2 server.js 
// Determines valid quantity (If "q" is a negative integer)
function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    return return_errors ? errors : (errors.length == 0);
};


//Load in query string, product info, and express package, cookie parser and session middleware, and user information
const qs=require('node:querystring');
var products = require(__dirname + '/products.json');
var fs = require('fs')

var express = require('express');
var app = express();

var session = require('express-session');
var products_data = require(__dirname + '/products.json');

app.use(express.urlencoded({ extended: true }));
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

//variable to store product data 
var obj_num = {};
var user_data = './user_data.json';
const { response } = require('express');
var logged_in = {};

// monitor all requests  
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

//get product data for pages
app.post("/get_products_data", function (request, response) {
    response.json(products_data);
});

// Routing 
app.get("/products.js", function(request, response, next)
        {
            response.type('.js');
            var products_str = `var products = ${JSON.stringify(products)};`;
            response.send(products_str);
        });
        //update the cart object & arrays
app.post("/update_cart", function (request, response) {
            console.log(request.session);
            var prod_key = request.body.products_key;
            if(typeof request.session.cart == 'undefined'){
                request.session.cart = {};}
            request.session.cart[prod_key] = request.body.quantity;
            response.redirect(`./products.html?products_key=${prod_key}`);
            console.log(request.session);
           });
        //use in order to access the cart object
app.post("/get_cart", function (request, response) {
            response.json(request.session.cart)});
        // Go to the cart
app.post("/ge_to_cart", function (request, response) {
    if (request.session.cart != null) {
        response.redirect('./cart.html');
    }
    else {
        console.log(request.session.cart);
        var prod_key = request.body.products_key;
        response.write('You have no items in your cart!');
        response.redirect(`./store.html?products_key=${prod_key}`);
    }
})
// process purchase request (validate quantities, check quantity available)
app.post("/purchase", function(request, response, next){
    console.log(request.body);
    var q;
    var has_quantities = false;
    var errors = {};
    //advice for later: serialize error object; find better way to pass errors back and forth for Assignment2
    //Help from Professor Port
    for (let i in products) {
        q = request.body['quantity' + i];
        if (typeof q != 'undefined') {
            console.log(q);
            // Check whether there are even quantities that have been inputted
            if(q>0) {
                has_quantities = true;
            }
            // Validates data with isNonNegInt function
            if(isNonNegInt(q,false) == false) {
                errors['quantity_error'+i] = isNonNegInt(q,true);
            }
            if (q > products[i].amt_ava) {  //Check to see if there is enough stock left
                errors['stock_outage' + i ] = `We currently don't have ${(q)} ${products[i].name}s. Please check back later!`
            }
        }
    };
   
    // This code is to print out an error stating that the user needs to select quantites instead of leaving it blank
    if(has_quantities == false) {
        errors['no_selections_error'] = "Please select some items to purchase!";
    }
    let quantity_object = qs.stringify(request.body);
    // This code is for when there are no errors and will move the user on towards the invoice.html file I have instead of directing them back to products display (like when we do have an error)
    
    if (Object.keys(errors).length == 0) {
        //If quantities are valid, remove quantities from the quantity available.
        for(let i in products){
            products[i].amt_ava -= Number(request.body['quantity' + i]);
        }
        //store quantities in obj_num
        obj_num = quantity_object;
        response.redirect("./login.html?");
        
    } else {
        response.redirect("./products.html?" +  qs.stringify(request.body) + '&' + qs.stringify(errors));
    }});

//--------------------------Log-in-------------------------------- //

if (fs.existsSync(user_data)) {
    // Lab 13 Example
    var user_data = "./user_data.json";
    var data_str = fs.readFileSync(user_data, 'utf-8');
    var user_str = JSON.parse(data_str);
};
//Login Request
    app.post("/login", function (request, response) {

        // Process login form POST and redirect to logged in page if ok, back to login page if not
        var the_username = request.body['email'].toLowerCase();
        //save username in the event of password change
        logged_in = the_username;
        var the_password = request.body['password'];
        if (typeof user_str[the_username] != 'undefined') {
            if (user_str[the_username].password == the_password) {
                //IR4: begins counter for user in terms of how many times they logged in
                user_str[the_username].count = user_str[the_username].count+1;
                //creates variables to pass into query string for the invoice to display personalized information
                var time_stamp = user_str[the_username].time;
                var user_count = user_str[the_username].count
                var custom_name = user_str[the_username].name;
                fs.writeFileSync(user_data, JSON.stringify(user_str));
                 // Redirect with obj_num, which stores the request body of the products page and also the custome name, timestamp, and user count for the specific user
                response.redirect('./invoice.html?'+ '&' + obj_num + '&' + 'name='+ custom_name + '&' + 'time=' + time_stamp + '&' + 'count='+user_count);
                //changes the timestamp on the users information in order to update when they logged in last but only after the previous time is displayed on invoice
                var current = Date()
                user_str[the_username].time = current;
            } else {
                response.redirect(`./login.html?wrongpassword`);
            }
            return;
        }
        response.redirect(`./login.html?nousername`);
    });

//-------------------------Registration--------------------------- //
// Data validation taken and modified from Blake Saari's Spring 2022 assignment 2
app.post("/registration", function (request, response) {
    // Start with 0 registration errors
    var registration_errors = {}
    var current = Date()
    // Import email and full name from submitted page
    var register_email = request.body['email'].toLowerCase();
    // Validate email address (From Lydia Jun's Fall 2021 Assignment 2)
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(request.body.email)) { //check if the fullname is correct
    } else {
        registration_errors['valid_email'] = `Please enter a valid email address`;
    }
    // Validates that there is an email inputted
    if (register_email.length == 0) {
        registration_errors['no_email'] = `Please input an email address`;
    }
    // Validates that the email inputted has not already been registered
    if (typeof user_str[register_email] != 'undefined') {
        registration_errors['existing_email'] = `This email address has already been registered`
    }
    // Validates that password is at least 8 characters
    if (request.body.password.length < 10) {
        registration_errors['short_password'] = `Password must be at least 10 characters`;
    } 
    // Validates that there is a password inputted
    if (request.body.password.length == 0) {
        registration_errors['no_password'] = `Please enter a password`
    }
    // Validates that the passwords match
    if (request.body.password != request.body.repeat_password) {
        registration_errors['no_match'] = `Your passwords do not match, please try again`;
    }
    if (request.body.name.length == 0) {
        registration_errors['no_name'] = `Please enter your name`
    }
        // Assignment 2 Example Code -- Reading and writing user info to a JSON file
            // If there are no errors...
            if(Object.keys(registration_errors).length == 0) {
                user_str[register_email] = {};
                user_str[register_email].password = request.body.password;
                user_str[register_email].email = request.body.email.toLowerCase();
                user_str[register_email].name = request.body.name;
                user_str[register_email].count = 1;
                user_str[register_email].time = current;
                // Write data into user_data.json file via the user_str variable
                fs.writeFileSync(user_data, JSON.stringify(user_str));
                var time_stamp = user_str[register_email].time;
                var user_count = user_str[register_email].count
                var custom_name = user_str[register_email].name;
                //save username in the event of password change
                logged_in = register_email;
                // If registered send to invoice with product quantity data, name, and querystring for first purchase
                response.redirect('./invoice.html?' + obj_num+ '&' + 'name='+ custom_name + '&' + 'first');
            } else {
                // If errors exist, redirect to registration page with errors
                let params = new URLSearchParams(request.body);
                response.redirect("./registration.html?" + qs.stringify(registration_errors)+ '&'+ params.toString());
            }
});
app.post("/update", function(request, response){

    response.redirect('./update.html?'+'user='+logged_in);
})
// ---------------------------- Change Registration Details -------------------------------- // 
//Validation taken and modified from Blake Saari's Spring 2022 Assignment 2
app.post("/change_pass", function (request, response) {
// Start with no errors
var reset_errors = {};
//use stored username to access information since 
var curr_password = user_str[logged_in].password
    // Validates that both new passwords are identical
    if(request.body['newpassword'] != request.body['repeatpassword']) {
    reset_errors['no_match'] = `The passwords you entered do not match`
    }
    // Validates that password is at least 10 characters long
    if(request.body.newpassword.length < 10) {
    reset_errors['short_pass'] = `Password must be at least 10 characters`
    }
    // Validates that new password is different than current password
    if(request.body.newpassword == curr_password) {
    reset_errors['diff_pass'] = `Your new password must be different from your old password`
    }
// When there are no errors then change user information
if (Object.keys(reset_errors).length == 0) {
    user_str[logged_in].password = request.body.newpassword;
    console.log(request.body.newpassword)
    // Write new password into user_data.json
    fs.writeFileSync(user_data, JSON.stringify(user_str), "utf-8");
   //take back to update registration page with success message
    response.redirect('./update.html?'+'success');
    return;
}
else {
    // Request errors
    let params = new URLSearchParams(request.body);
    // Redirect back to update registration page with errors in string
    response.redirect('update.html?' + qs.stringify(reset_errors));
}

})
//--------------------------------------------------------------
// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
