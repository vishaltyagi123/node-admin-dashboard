/* Middleware defination here */

// const routeNotFound = function( err, req, res, next){
//     console.log(req);
//     if (err instanceof NotFound) {
//         res.status('404');
//         res.status('Route Not Found');
//     } else {
//         next();
//     }
// }


// const somethingElse = function( err, req, res, next){
//     if(err){
//         console.log(err);
//         return false;
//     }
//     next();
// }

// module.exports = { routeNotFound , somethingElse };


module.exports = function routeNotFound(err, req, res, next) {

    console.log( req ); 
    //process.exit(1);

    if (err instanceof NotFound) {
        res.send('Route Not Found');
    }
    next();
};
