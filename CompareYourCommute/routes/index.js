const express = require('express');
const router = express.Router();
const request = require('request');
const keys = require('../config/keys');

const parser = require('fast-xml-parser');

const GOOGLE_DIRECTIONS = keys.KEYS.GOOGLE_DIRECTIONS_KEY;
//const MYGASFEED = keys.GAS_FEED_KEY; // Removed because of out-dated data
const WOLFRAM = keys.KEYS.WOLFRAM_KEY;

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
    let price_data = [];

    /* To store JSON object from API call */
    let start;
    let end;
    let start_coord;
    let end_coord;
    let modes = [];
    let durations = [];

    let drive_distance;

    // Input form data for start and end addresses
    const inputdata =
        {
            start: req.body.start_address,
            destination: req.body.end_address
        };


    function walking_api() {
        return new Promise(function (resolve, reject) {


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


            request(options, function (err, res, inhalt) {


                //console.log(inhalt);

                try {
                    let result = JSON.parse(inhalt);

                    let travel_mode = (result.routes[0].legs[0].steps[0].travel_mode);
                    let travel_secs = (result.routes[0].legs[0].duration.value); // travel time in seconds, need to standardize to compare
                    let travel_time = (result.routes[0].legs[0].duration.text);

                    data.push([travel_mode, travel_time, travel_secs]);
                    resolve(inhalt, res);
                } catch (err) {
                    reject(err)
                }


            })
        })

    }

    function driving_api() {
        return new Promise(function (resolve, reject) {

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


            request(options, function (err, res, inhalt) {


                //console.log(inhalt);
                try {
                    let result = JSON.parse(inhalt);

                    let travel_mode = (result.routes[0].legs[0].steps[0].travel_mode);
                    let travel_secs = (result.routes[0].legs[0].duration.value); // travel time in seconds, need to standardize to compare
                    let travel_time = (result.routes[0].legs[0].duration.text);

                    // Grab the driving distance in meters for use later in gas_api
                    drive_distance = parseInt((result.routes[0].legs[0].distance.value));

                    // Grab the lat long coordinates to pump into the gasfeed api
                    start_coord = [result.routes[0].legs[0].start_location[0], result.routes[0].legs[0].start_location[1]];
                    end_coord = [result.routes[0].legs[0].end_location[0], result.routes[0].legs[0].end_location[1]];

                    start = result.routes[0].legs[0].start_address;
                    end = result.routes[0].legs[0].end_address;

                    data.push([travel_mode, travel_time, travel_secs]);
                    resolve(inhalt, res);

                } catch (err) {
                    reject(err);
                }


            })
        })
    }

    function cycling_api() {
        return new Promise(function (resolve, reject) {

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


            request(options, function (err, res, inhalt) {

                //console.log(inhalt);
                try {
                    let result = JSON.parse(inhalt);

                    let travel_mode = (result.routes[0].legs[0].steps[0].travel_mode);
                    let travel_secs = (result.routes[0].legs[0].duration.value); // travel time in seconds, need to standardize to compare
                    let travel_time = (result.routes[0].legs[0].duration.text);

                    data.push([travel_mode, travel_time, travel_secs]);

                    resolve(inhalt, res);

                } catch (err) {
                    reject(err)
                }


            })
        })
    }

    /*
    function gas_api () {
        return new Promise (function (resolve, reject) {

            try {
                // Grabs the City, State, and Country of the start address

                //TODO: need to figure out why this is not working the way it is supposed to !!!!!!!!!!!!!!!!!!!!!!!!
                //const start_city = start.split(',').slice(-3);
                //const start_city = "Boston, MA";

                //* Post request setup to the Wolfram API for Gas Price Avg
                const options = { method: 'GET',
                    url: 'http://api.wolframalpha.com/v2/query',
                    qs:
                        { input: 'average gas prices in ' + start.split(',').slice(-3),//start_city,
                            appid: WOLFRAM },
                    headers:
                        { 'Postman-Token': '7ba724fc-fec2-4b18-bc17-f156e35458d4',
                            'cache-control': 'no-cache' } };


                request(options, function (err,res,inhalt) {


                    let params = {

                        ignoreAttributes : true,
                        ignoreNameSpace : false,
                        allowBooleanAttributes : false,
                        parseNodeValue : true,
                        parseAttributeValue : false,
                        trimValues: true,
                        localeRange: "", //To support non english character in tag/attribute values.
                        parseTrueNumberOnly: false,
                    };

                    const tObj = parser.getTraversalObj(inhalt,params);
                    const jsonObj = parser.convertToJson(tObj,params);

                    let dpg = jsonObj.queryresult.pod[1].subpod.plaintext;
                    dpg = parseFloat(dpg.substr(1,6));

                    console.log(drive_distance/1609.344 + " miles");

                    let cost = (drive_distance/1609.344)*dpg/20; // using 20 as an estimated average mpg

                    price_data.push(['DRIVING',cost.toFixed(2)]);
                    console.log(price_data);


                    resolve(inhalt,res);

                })
            }
            catch(err){
                reject(err);
                console.log(err);
            }

        })
    }
    */


    /* ------------------------------------- */

    // For travel TIME
    const walking = walking_api();
    const driving = driving_api();
    const cycling = cycling_api();

    //const driving_cost = gas_api();


    /* ------------------------------------- */

    // This promise.all gathers all the data from API calls, sorts the data in order, and spits it out in a res.render

    Promise.all([walking, cycling, driving])
        .then(function () {

            data = data.sort(function (a, b) {
                return a[2] - b[2];
            }); // Sorts the data by travel time increasing
            console.log(data);

            for (let i = 0; i < data.length; i++) {
                modes.push(data[i][0]);
                durations.push(data[i][1]);
            }

        })
        .then(function () {
            return new Promise(function (resolve) {
                try {
                    // Grabs the City, State, and Country of the start address

                    //TODO: need to figure out why this is not working the way it is supposed to !!!!!!!!!!!!!!!!!!!!!!!!
                    //const start_city = start.split(',').slice(-3);
                    //const start_city = "Boston, MA";

                    /* Post request setup to the Wolfram API for Gas Price Avg */
                    const options = {
                        method: 'GET',
                        url: 'http://api.wolframalpha.com/v2/query',
                        qs:
                            {
                                input: 'average gas prices in ' + start.split(',').slice(-3),//start_city,
                                appid: WOLFRAM
                            },
                        headers:
                            {
                                'Postman-Token': '7ba724fc-fec2-4b18-bc17-f156e35458d4',
                                'cache-control': 'no-cache'
                            }
                    };


                    request(options, function (err, res, inhalt) {

                        let params = {

                            ignoreAttributes: true,
                            ignoreNameSpace: false,
                            allowBooleanAttributes: false,
                            parseNodeValue: true,
                            parseAttributeValue: false,
                            trimValues: true,
                            localeRange: "", //To support non english character in tag/attribute values.
                            parseTrueNumberOnly: false,
                        };

                        const tObj = parser.getTraversalObj(inhalt, params);
                        const jsonObj = parser.convertToJson(tObj, params);

                        let dpg = jsonObj.queryresult.pod[1].subpod.plaintext;
                        dpg = parseFloat(dpg.substr(1, 6));

                        console.log(drive_distance / 1609.344 + " miles");

                        let cost = (drive_distance / 1609.344) * dpg / 20; // using 20 as an estimated average mpg

                        price_data.push(['DRIVING', cost.toFixed(2)]);
                        console.log(price_data);


                        resolve(inhalt, res);

                    })
                } catch (err) {
                    //reject(err);
                    console.log(err);
                }

            });
        })

        .then(function () {
            res.render('results', {
                title: 'Compare Your Commute',
                duration: durations,
                start: start,
                end: end,
                mode: modes,
                prices: price_data

            });
        })
        .catch(function (err) {
            console.log(err);
            res.render('error', {
                message: err
            })
        });

});






module.exports = router;

