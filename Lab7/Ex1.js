require("./products_data.js");
var num_products = 5;
//for (var prod_num=0; 
 //   prod_num>num_products; 
 //   prod_num++) {
//console.log( `${prod_num}. ${eval('name' + prod_num )}`);}

//console.log(`That's all we have!`);

for (var prod_num = 1; eval("typeof name"+prod_num) != 'unidefined'; prod_num++) 
    console.log(`${prod_num}. ${eval(`name` + prod_num)}`);