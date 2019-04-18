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



    function walking_api () {
        return new Promise (function (resolve, reject) {


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


                let travel_mode = (result.routes[0].legs[0].steps[0].travel_mode);
                let travel_secs = (result.routes[0].legs[0].duration.value); // travel time in seconds, need to standardize to compare
                let travel_time = (result.routes[0].legs[0].duration.text);

                data.push([[travel_mode],[travel_time],[travel_secs]]);

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

                let travel_mode = (result.routes[0].legs[0].steps[0].travel_mode);
                let travel_secs = (result.routes[0].legs[0].duration.value); // travel time in seconds, need to standardize to compare
                let travel_time = (result.routes[0].legs[0].duration.text);

                data.push([[travel_mode],[travel_time],[travel_secs]]);


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
                let travel_secs = (result.routes[0].legs[0].duration.value); // travel time in seconds, need to standardize to compare
                let travel_time = (result.routes[0].legs[0].duration.text);

                data.push([[travel_mode],[travel_time],[travel_secs]]);

            })
        })
            .catch((err) => {
                console.log(err);
            });
    }

    /* ------------------------------------- */

    const walking = walking_api();
    const driving = driving_api();
    const cycling = cycling_api();


    // This promise.all gathers all the data from API calls, sorts the data in order, and spits it out in a res.render

    Promise.all([walking,cycling,driving])
        .then(function(err,response){


            data = data.sort(function(a,b){return a[2] < b[2];}); // Sorts the data by travel time increasing
            console.log(data);

            for (let i = 0; i < data.length; i++) {
                modes.push(data[i][0]);
                durations.push(data[i][1]);
            }

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

