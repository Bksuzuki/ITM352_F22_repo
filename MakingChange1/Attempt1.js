// setting variable for amount
var amount = 456;

// divide amount for quarters
step1 = parseInt(amount/25);
remainder1 = amount%25;

//divide for dimes
step2 = parseInt(remainder1/25);
remainder2 = remainder1%25;

//divide for nickels
step3 = parseInt(remainder2/25);
remainder3 = remainder2%25;

// divide for pennies
step4 = remainder3;

console.log([step1, step2, step3, step4]);