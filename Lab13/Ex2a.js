

const fs = require("fs");
var filename = __dirname + "./user_data.json";

if(fs.existsSync(filename)) {
   
    var data = fs.readFileSync(filename, 'utf-8');
    var users_reg_data = JSON.parse(data);
    console.log(users["kazman"]["password"]);
    
} else {
    console.log(`${filename} does not exist!`);
}