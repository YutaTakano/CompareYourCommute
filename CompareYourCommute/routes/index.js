// /*
// const express = require('express');
// const router = express.Router();
// const request = require('request');
// const keys = require('../config/keys');
//
// const GOOGLE_DIRECTIONS = keys.DIRECTIONS_KEY;
//
// /* From stack overflow - for parsing POST data */
// const bodyParser = require("body-parser");
//
//
// /** bodyParser.urlencoded(options)
//  * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
//  * and exposes the resulting object (containing the keys and values) on req.body
//  */
// router.use(bodyParser.urlencoded({
//     extended: true
// }));
//
// /**bodyParser.json(options)
//  * Parses the text as JSON and exposes the resulting object on req.body.
//  */
// router.use(bodyParser.json());
//
// /*----------------------------------------------------------------------*/
//
// /* GET home page. */
// router.get('/', function(req,res,next) {
//     res.render('index', {title: 'Compare Your Commute'});
//
// });
//
//
//
// /* POST to get the form data from page */
// router.post('/', function (req, res) {
//
//
//     /* Temporarily hard-coded input data */
//     const inputdata =
//     {
//         start: req.body.start_address,
//         destination: req.body.end_address
//     };
//
//     let google_travel_modes =
//         [
//             'Walking',
//             'Driving',
//             'Cycling',
//             'Transit'
//         ];
//
//
//     /* Post request to the directions API */
//     let responses = [];
//     let durations = [];
//     let start = '';
//     let end = '';
//
//     const response  = get_google_data(inputdata.start, inputdata.destination, google_travel_modes[0]);
//     console.log(response);
//
// /*        const options = {
//             method: 'POST',
//             url: 'https://maps.googleapis.com/maps/api/directions/json',
//             qs:
//                 {
//                     origin: inputdata.start,
//                     destination: inputdata.destination,
//                     mode: eachmode,
//                     key: GOOGLE_DIRECTIONS
//                 },
//             headers:
//                 {
//                     'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
//                     'cache-control': 'no-cache'
//                 }
//         };
//
//
//         request(options, function (error, response, body) {
//             if (error) throw new Error(error);
//
//
//             /* Parse the data returned from API call for duration, start, and end address */
//             /* adds each to the list of results */
//
//     /*
//             try {
//
//                 const result = JSON.parse(body);
//                 results.push(result);
//                 durations.push(result.routes[0].legs[0].duration.text);
//                 start = result.routes[0].legs[0].start_address;
//                 end = result.routes[0].legs[0].end_address;
//             } catch (err) {
//                 console.log("GOOGLE API ERROR");
//                 res.render('error', {message: 'API Error'});
//             }
//         }); */
//
//
//         res.render('results', {title: 'Compare Your Commute', duration: durations, start: start, end: end, mode: google_travel_modes});
// });
//
//
// function get_google_data(start, end, mode) {
//     const options = {
//         method: 'POST',
//         url: 'https://maps.googleapis.com/maps/api/directions/json',
//         qs:
//             {
//                 origin: start,
//                 destination: end,
//                 mode: mode,
//                 key: GOOGLE_DIRECTIONS
//             },
//         headers:
//             {
//                 'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
//                 'cache-control': 'no-cache'
//             }
//     };
//
//     return request(options);
// }
//
//
//
//
//
//
//
// module.exports = router;



const express = require('express');
const router = express.Router();
const request = require('request');
const keys = require('../config/keys');

const GOOGLE_DIRECTIONS = keys.DIRECTIONS_KEY;

/* From stack overflow - for parsing POST data */
const bodyParser = require("body-parser");


/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
router.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
router.use(bodyParser.json());

/*----------------------------------------------------------------------*/

/* GET home page. */
router.get('/', function(req,res,next) {
    res.render('index', {title: 'Compare Your Commute'});

});



/* POST to get the form data from page */
router.post('/', function (req, res) {

    /* To store durations of each travel method */
    let durations = [];

    /* Temporarily hard-coded input data */
    const inputdata =
    {
        start: req.body.start_address,
        destination: req.body.end_address
    };



    let google_travel_modes =
        [
            'Walking',
            'Driving',
            'Cycling',
            'Transit'
        ];

    /* Post request to the directions API */
    const options = { method: 'POST',
        url: 'https://maps.googleapis.com/maps/api/directions/json',
        qs:
            { origin: inputdata.start,
                destination: inputdata.destination,
                key: GOOGLE_DIRECTIONS},
        headers:
            { 'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
                'cache-control': 'no-cache' } };

    request(options, function (error, response, inhalt) {
        if (error) throw new Error(error);


        /* Parse the data returned from API call for duration, start, and end address */

        try {
            const result = JSON.parse(inhalt);
            durations.push(result.routes[0].legs[0].duration.text);
            const start = result.routes[0].legs[0].start_address;
            const end = result.routes[0].legs[0].end_address;


            res.render('results', {title: 'Compare Your Commute', duration: durations, start: start, end: end, mode: google_travel_modes});
        }
        catch (err){
            console.log("GOOGLE API PARSE ERROR");
            res.render('error', {message: 'API Error'});
        }
    });





});




module.exports = router;

