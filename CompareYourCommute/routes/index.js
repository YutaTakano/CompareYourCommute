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

/*----------------------------------------------------------------------*/

//
// /* POST to get the form data from page */
// router.post('/', function (req, res) {
//
//     /* To store durations of each travel method */
//     let durations = [];
//     /* To store JSON object from API call */
//     let result = '';
//
//     /* Input form data for start and end addresses */
//     const inputdata =
//     {
//         start: req.body.start_address,
//         destination: req.body.end_address
//     };
//
//     /* Travel modes to be passed into Google's API */
//     const google_travel_modes =
//         [
//             'Walking',
//             'Driving',
//             'Cycling',
//             'Transit'
//         ];
//
//
//     /* Post request to the directions API */
//     const options = { method: 'POST',
//         url: 'https://maps.googleapis.com/maps/api/directions/json',
//         qs:
//             { origin: inputdata.start,
//                 destination: inputdata.destination,
//                 key: GOOGLE_DIRECTIONS},
//         headers:
//             { 'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
//                 'cache-control': 'no-cache' } };
//
//     request(options, function (error, response, inhalt) {
//         if (error) throw new Error(error);
//
//
//         /* Parse the data returned from API call for duration, start, and end address */
//
//         try {
//             result = JSON.parse(inhalt);
//         }
//
//         catch (err){
//             console.log("GOOGLE API PARSE ERROR");
//             res.render('error', {message: 'API Error'});
//         }
//
//
//         durations.push(result.routes[0].legs[0].duration.text);
//         const start = result.routes[0].legs[0].start_address;
//         const end = result.routes[0].legs[0].end_address;
//         res.render('results', {title: 'Compare Your Commute', duration: durations, start: start, end: end, mode: google_travel_modes});
//
//
//     });
//
//
//
//
//
// });

// -------------------------------------------------------------------------------------------------------
router.post('/', function (req, res) {


    // Set up API calls

    let data = [];
    /* To store durations and each travel method */
    let durations = [];
    let modes = [];
    /* To store JSON object from API call */
    let start;
    let end;

    /* Input form data for start and end addresses */
    const inputdata =
        {
            start: req.body.start_address,
            destination: req.body.end_address
        };

    /* Travel modes to be passed into Google's API */
    const google_travel_modes =
        [
            'Walking',
            'Driving',
            'Cycling',
            'Transit'
        ];


    function walking_api () {
        return new Promise (function (resolve, reject) {

            //if (error) {reject(error + ' Walking Promise rejected');}

            /* Post request setup to the directions API */
            const options = {
                method: 'POST',
                url: 'https://maps.googleapis.com/maps/api/directions/json',
                qs:
                    {
                        origin: inputdata.start,
                        destination: inputdata.destination,
                        mode: 'walking',
                        key: GOOGLE_DIRECTIONS
                    },
                headers:
                    {
                        'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
                        'cache-control': 'no-cache'
                    }
            };


            request(options, function (err,res,inhalt) {

                resolve(inhalt,res);
                console.log(inhalt);

                let result = JSON.parse(inhalt);
                start = result.routes[0].legs[0].start_address;
                end = result.routes[0].legs[0].end_address;
                durations.push(result.routes[0].legs[0].duration.text);
                modes.push(result.routes[0].legs[0].steps[0].travel_mode);



                    //data.walking = {}
            })
        })
            .catch((err) => {
                console.log(err);
            });
    }

    function driving_api () {
        return new Promise (function (resolve, reject) {

            //if (error) {reject(error + ' Walking Promise rejected');}

            /* Post request setup to the directions API */
            const options = {
                method: 'POST',
                url: 'https://maps.googleapis.com/maps/api/directions/json',
                qs:
                    {
                        origin: inputdata.start,
                        destination: inputdata.destination,
                        mode: 'driving',
                        key: GOOGLE_DIRECTIONS
                    },
                headers:
                    {
                        'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
                        'cache-control': 'no-cache'
                    }
            };


            request(options, function (err,res,inhalt) {

                resolve(inhalt,res);
                console.log(inhalt);

                let result = JSON.parse(inhalt);
                durations.push(result.routes[0].legs[0].duration.text);
                modes.push(result.routes[0].legs[0].steps[0].travel_mode);




            })
        })
            .catch((err) => {
                console.log(err);
            });
    }

    function cycling_api () {
        return new Promise (function (resolve, reject) {

            //if (error) {reject(error + ' Walking Promise rejected');}

            /* Post request setup to the directions API */
            const options = {
                method: 'POST',
                url: 'https://maps.googleapis.com/maps/api/directions/json',
                qs:
                    {
                        origin: inputdata.start,
                        destination: inputdata.destination,
                        mode: 'bicycling',
                        key: GOOGLE_DIRECTIONS
                    },
                headers:
                    {
                        'Postman-Token': '933760e5-db5b-41e9-93f7-e7ec0a1c45d6',
                        'cache-control': 'no-cache'
                    }
            };


            request(options, function (err,res,inhalt) {

                resolve(inhalt,res);
                console.log(inhalt);

                let result = JSON.parse(inhalt);

                let travel_mode = (result.routes[0].legs[0].steps[0].travel_mode);
                let travel_time = (result.routes[0].legs[0].duration.text);

                data.push([travel_mode, travel_time]);

                durations.push(travel_time);
                modes.push(travel_mode);

            })
        })
            .catch((err) => {
                console.log(err);
            });
    }

    const walking = walking_api();
    const driving = driving_api();
    const cycling = cycling_api();

    Promise.all([walking,cycling,driving])
        .then(function(err,response){

        data = data.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
        
        res.render('results', {
            title: 'Compare Your Commute',
            duration: durations,
            start: start,
            end: end,
            mode: modes
        });
    })




});


module.exports = router;

