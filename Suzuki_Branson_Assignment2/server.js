
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


//Load in query string, product info, and express package, and user information
const qs=require('node:querystring');
var products = require(__dirname + '/products.json');
var express = require('express');
var fs = require('fs')
var app = express();
var qty_obj = {};
var user_info = './user_info.json';
const { response } = require('express');
const { URLSearchParams } = require('url');
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
        response.redirect("./login.html?" + qs.stringify(request.body));
    } else {
        response.redirect("./products_home.html?" +  qs.stringify(request.body) + '&' + qs.stringify(errors));
    }
});

//---------------------------------------------------
// ---------------------------- Log-in -------------------------------- // 

if (fs.existsSync(user_info)) {
    // Lab 13 Example
    var data_str = fs.readFileSync(user_info, 'utf-8');
    var user_str = JSON.parse(data_str);
}
else {
    console.log(user_info + ' does not exist.');
}

// Processing Login Request
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    app.post("/process_login", function (request, response) {

        // Start with no errors
        var errors = {};

        // Pull data from login form
        var the_email = request.body['email'].toLowerCase();
        var the_password = request.body['password'];

        // Check if entered password matches stored password (Lab 13)
        if (typeof user_str[the_email] != 'undefined') {
            if (user_str[the_email].password == the_password) {
                // If the passwords match...
                qty_obj['email'] = the_email;
                qty_obj['fullname'] = user_str[the_email].name;
                // Store quantity data     
                let params = new URLSearchParams(qty_obj);
                console.log(qty_obj)
                // If no errors, redirect to invoice page with quantity data
                response.redirect('./invoice.html?' + params.toString());
                return;
            // If password incorrect add to errors variable
            } else {
                errors['login_error'] = `Incorrect password`;
            }
            // If email incorrect add to errors variable                
            } else {
                errors['login_error'] = `Wrong E-Mail`;
            }
            // If errors exist, redirect to login page with errors in string
            let params = new URLSearchParams(errors);
            params.append('email', the_email);
            response.redirect('./login.html?' + params.toString());
        }
    );

// ---------------------------- Registration -------------------------------- // 
app.post("/registration", function (request, response) {
    // Start with 0 registration errors
    var registration_errors = {}
    // Import email from submitted page
    var register_email = request.body['email'].toLowerCase();
    // Validate email address (From w3resource - Email Validation)
    if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(request.body.email) == false) {
        registration_errors['email'] = `Please enter a valid email address`;
    }
    // Validates that there is an email inputted
    else if (register_email.length == 0) {
        registration_errors['email'] = `Please enter a valid email address`;
    }
    // Validates that the email inputted has not already been registered
    if (typeof user_str[register_email] != 'undefined') {
        registration_errors['email'] = `This email address has already been registered`
    }
    // Validates that password is at least 8 characters
    if (request.body.password.length < 8) {
        registration_errors['password'] = `Password must be at least 8 characters`;
    } 
    // Validates that there is a password inputted
    else if (request.body.password.length == 0) {
        registration_errors['password'] = `Please enter a password`
    }
    // Validates that the passwords match
    if (request.body['password'] != request.body['repeat_password']) {
        registration_errors['repeat_password'] = `Your passwords do not match, please try again`;
    }
    // Validates that the full name inputted consists of A-Z characters exclusively
    if (/^[A-Za-z, ]+$/.test(request.body['fullname'])) {
    }
    else {
        registration_errors['fullname'] = `Please enter your first and last name`;
    // Assures that the name inputted will not be longer than 30 characters
    }
    if (request.body['fullname'].length > 30) {
        registration_errors['fullname'] = `Please enter a name less than 30 characters`;
    }

        // Assignment 2 Example Code -- Reading and writing user info to a JSON file
            // If there are no errors...
            if(Object.keys(registration_errors).length == 0) {
                user_str[register_email] = {};
                user_str[register_email].password = request.body.password;
                user_str[register_email].email = request.body.email;
                // Write data into user_data.json file via the user_str variable
                fs.writeFileSync(user_info, JSON.stringify(user_str));
                // Add product quantity data
                qty_obj['email'] = register_email;
                qty_obj['fullname'] = user_str[register_email].name;
                let params = new URLSearchParams(qty_obj)
                // If registered send to invoice with product quantity data
                response.redirect('./invoice.html?' + params.toString());
            } else {
                // If errors exist, redirect to registration page with errors
                request.body['registration_errors'] = JSON.stringify(registration_errors);
                let params = new URLSearchParams(request.body);
                response.redirect("./registration.html?" + params.toString());
            }
});

// ---------------------------- Change Registration Details -------------------------------- // 

app.post("/change_password", function (request, response) {
// Start with no errors
var reset_errors = {};

// Pulls data inputed into the form from the body
let current_email = request.body['email'].toLowerCase();
let current_password = request.body['password'];

// Validates that email is correct format
if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(request.body.email) == false) {
    reset_errors['email'] = `Please enter a valid email address (Ex: johndoe@meatlocker.com)`
}
// Validates that an email was inputted
else if (current_email.length == 0) {
    reset_errors['email'] = `Please enter an email address`
}
// Validates that both new passwords are identical
if(request.body['newpassword'] != request.body['repeatnewpassword']) {
    reset_errors['repeatnewpassword'] = `The passwords you entered do not match`;
}

// Validates that inputted email and password match credentials stored in user_data.json
if(typeof user_str[current_email] != 'undefined') {
    // Validates that password submited matches password saved in user_data.json
    if(user_str[current_email].password == current_password) {
        // Validates that password is at least 8 characters long
        if(request.body.newpassword.length < 8) {
            reset_errors['newpassword'] = `Password must be at least 8 characters`
        }
        // Validates that passwords matches user_data.json
        if(user_str[current_email].password != current_password) {
            reset_errors['password'] = `The password entered is incorrect`
        }
        // Validates that inputted new passwords are identical
        if(request.body.newpassword != request.body.repeatnewpassword) {
            reset_errors['repeatnewpassword'] = `The passwords you entered do not match`
        }
        // Validates that new password is different than current password
        if(request.body.newpassword && request.body.repeatnewpassword == current_password) {
            reset_errors['newpassword'] = `Your new password must be different from your old password`
        }
            }
            else {
                // Error message if password is incorrect
                reset_errors['password'] = `You entered an incorrect password`;
            }
            }
            else {
                // Error message is email is incorrect
                reset_errors['email'] = `The email entered has not been registered yet`
            }
// If there are no errors... (Momoka Michimoto)
if (Object.keys(reset_errors).length == 0) {
    user_str[current_email].password = request.body.newpassword
    // Write new password into user_data.json
    fs.writeFileSync(user_info, JSON.stringify(user_str), "utf-8");
    // Pass quantity data
    qty_obj['email'] = current_email;
    qty_obj['fullname'] = user_str[current_email].name;
    let params = new URLSearchParams(qty_obj);
    // Redirect to login page with quantity data in string
    response.redirect('./login.html?' + params.toString());
    return;
}
else {
    // Request errors
    request.body['reset_errors'] = JSON.stringify(reset_errors);
    let params = new URLSearchParams(request.body);
    // Redirect back to update registration page with errors in string
    response.redirect('update_registration.html?' + params.toString());
}

})
//--------------------------------------------------------------
// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
