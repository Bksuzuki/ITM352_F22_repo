var attributes  =  "Dan;50;50.5;-45.5" ;
var pieces = attributes.split(';');
for(let part in pieces) {
    console.log(`${pieces[part]} is type ${typeof part}`);
}
console.log(pieces.join(','));