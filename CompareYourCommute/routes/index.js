//const keys = require('keys');
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


    /* Temporarily hard-coded input data */
    const inputdata =
    {
        mode: req.body.travelmode,
        start: '42.350761,-71.109039',
        destination: '42.358147,-71.09505'
    };


    /* Post request to the directions API */
    const options = { method: 'POST',
        url: 'https://maps.googleapis.com/maps/api/directions/json',
        qs:
            { origin: inputdata.start,
                destination: inputdata.destination,
                mode: inputdata.mode,
                key: GOOGLE_DIRECTIONS},
        headers:
            { 'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
                'cache-control': 'no-cache' } };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);


        /* Parse the data returned from API call for duration, start, and end address */
        const result = JSON.parse(body);
        try {
            const duration = result.routes[0].legs[0].duration.text;
            const start = result.routes[0].legs[0].start_address;
            const end = result.routes[0].legs[0].end_address;
            console.log(duration);

            res.render('results', {title: 'Compare Your Commute', duration: duration, start: start, end: end, mode: options.qs.mode});
        }
        catch (err){
            console.log("GOOGLE API PARSE ERROR");
            res.render('error', {message: 'API Error'});
        }
});





});




module.exports = router;