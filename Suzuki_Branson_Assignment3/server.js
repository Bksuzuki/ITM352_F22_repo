
// Made by Branson Suzuki Fall 2022
// Layout taken from Assignment 1 Workshop Module//
//function (isNonNegInt) taken from example 1 assignment
// Copied and Modified Blake Saari's Spring 2022 Assignment 3 server.js and Anthony Lee's Spring 2022 Assignment 3
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
var user_data = require(__dirname + '/user_data.json');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const res = require('express/lib/response');
app.use(express.urlencoded({ extended: true }));
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

//variable to store product data 
var obj_num = {};

const { response } = require('express');
const { request } = require('node:http');
var logged_in = {};

// Monitor all requests  
app.all('*', function (request, response, next) {
    console.log(`Got a ${request.method} to path ${request.path}`);
    // Initialize an object to store the cart in the session
    if(typeof request.session.cart == 'undefined') { request.session.cart = {}; };
    if(typeof request.session.sessionID == 'undefined') {request.session.sessionID = {}};

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
            response.json(request.session.cart);
        });

        // Go to the cart
app.post("/get_to_cart", function (request, response) {
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
// Delete entire cart
app.post("/delete_entire_cart", function (request, response) {
    request.session.cart = 'undefined';
    console.log(request.session.cart);
    response.redirect('./index.html')
})

// Delete item within cart
app.post('/delete_item_in_cart', (request, response) => {
    key = request.body.products_key;
    id = request.body.product_id;
    console.log(request.session.cart[key][request.body.product_id]);
    request.session.cart[key][request.body.product_id] = '';
    response.redirect('back');
 })

app.get('/checkout', (request, response) => {
    if (request.session.loginID == 'undefined') {
        response.redirect('./login.html')
    }
    else {
        var user_data = './user_data.json';
        if (fs.existsSync(user_data)) {
            // Lab 13 Example
            var user_data = "./user_data.json";
            var data_str = fs.readFileSync(user_data, 'utf-8');
            var user_str = JSON.parse(data_str);}
        response.redirect(`./invoice.html`)
    }
})

//get the user session ID for use
app.post("/get_user_data", function (request, response) {
    if (typeof request.session.loginID == 'undefined') {
        request.session.loginID = 'undefined';
    }
    response.json(request.session.loginID);
});
app.get("/logout",(request, response)=>{
    if (request.session.loginID) {
        delete request.session.loginID;
    }
    response.redirect("/index.html");
    });
//--------------------------Log-in-------------------------------- //
var user_data = './user_data.json';
if (fs.existsSync(user_data)) {
    // Lab 13 Example
    var user_data = "./user_data.json";
    var data_str = fs.readFileSync(user_data, 'utf-8');
    var user_str = JSON.parse(data_str);
};
// Taken from File I/O Exercise 4
app.post("/login", function(request, response) {
    // Print body in console
        console.log(request.body);
    // Force submitted email into lowercase
        let email_input = request.body.email.toLowerCase();
        // If username exists -> Check if password matches -> Session LoginID becomes email
            if (typeof user_str[email_input] != 'undefined') {
                if (user_str[email_input].password == request.body.password) {
                    request.session.loginID = email_input;
                    response.redirect(`./index.html`)
                } else {
                    response.send(`Password incorrect!`);
            }}
                else {
                    response.send(`Email is not registered yet!`)
                }
    // Print Session LoginID in console
        console.log(request.session.loginID)
        });

        // Request user data from client's session
            app.post("/get_user_data", function (request, response) {
                if (typeof request.session.loginID == 'undefined') {
                    request.session.loginID = null;
                }
                response.json(request.session.loginID);
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
//Mailing post. Taken from example and some points adapted from Blake Saari's Spring 2022 Repo
//Nodemailer module was not found. Could not get the mail system to work
app.post('/purchase', (request, response) => {
    
  //  const transporter = nodemailer.createTransport({
   //    host: "mail.hawaii.edu",
  //     port: 25,
   //    secure: false,
   //    tls: {
          rejectUnauthorized: false
   //    }
   // });
 
    var user_email = request.session.loginID;
    var mailOptions = {
       from:'invoice@thecountdown.com',
       to: user_email,
       subject: 'The Countdown Invoice',
       html: readFile('./public/invoice.html', 'utf8')
    };
 
    //transporter.sendMail(mailOptions, (error, info) => {
   //    if (error) {
     //     invoice_str = "There was an error and your invoice could not be mailed";
    //      console.log(error);
    //   } else {
    //      invoice_str = `Your invoice was mailed to ${user_mail}`;
    //   }
    //   response.send(invoice_str);
   // })
    request.session.destroy();
   response.redirect("./index.html");
 })
//--------------------------------------------------------------
// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));