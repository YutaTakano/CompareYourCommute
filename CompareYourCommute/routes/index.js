const express = require('express');
const router = express.Router();
const request = require('request');
const keys = require('../config/keys');

const parser = require('fast-xml-parser');

const GOOGLE_DIRECTIONS = keys.KEYS.GOOGLE_DIRECTIONS_KEY;
//const MYGASFEED = keys.GAS_FEED_KEY; // Removed because of out-dated data
const WOLFRAM = keys.KEYS.WOLFRAM_KEY;
const UBER = keys.KEYS.UBER_SERVER_TOKEN;
const FACEBOOK = keys.FACEBOOK.APP_ID;
const MAPQUEST = keys.KEYS.MAPQUEST_KEY;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CompareYourCommute', {useNewUrlParser: true});
const db = mongoose.connection;
const Schema = mongoose.Schema;

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
    res.render('initial', {app_id: FACEBOOK});

});

router.get('/search', function(req,res,next) {
    res.render('search.jade',{app_id: FACEBOOK});

});


// -------------------------------------------------------------------------------------------------------

router.post('/search', function (req, res) {


    // Set up API calls

    let data = [];
    let price_data = [];

    /* To store JSON object from API call */
    let start;
    let end;
    let start_coord = [];
    let end_coord = [];
    let modes = [];
    let durations = [];

    let drive_distance;

    let map;

    // Input form data for start and end addresses
    const inputdata =
        {
            start: req.body.start_address,
            destination: req.body.end_address
        };

    // Function to convert seconds into hours and minutes
    function time_convert(num) {
        var hours = Math.floor(num / 3600);
        var minutes = Math.floor(num / 60);
        if (hours > 0) {
            return hours + " hours " + minutes + " minutes";
        }
        else{
            return minutes + " minutes";
        }
    }

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

                    // Grab the lat long coordinates to pump into the later apis
                    start_coord.push (result.routes[0].legs[0].start_location.lat,result.routes[0].legs[0].start_location.lng);
                    end_coord.push (result.routes[0].legs[0].end_location.lat, result.routes[0].legs[0].end_location.lng);


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




    /* ------------------------------------- */

    // For travel TIME
    const walking = walking_api();
    const driving = driving_api();
    const cycling = cycling_api();


    //const driving_cost = gas_api();


    /* ------------------------------------- */

    // This promise.all gathers all the data from 3 Google API calls
    // Then calls on Uber price estimate using lat-long from Google
    // Then calls on Wolfram for gas price also using same lat-long from Google
    // Then sorts the data returned from these calls
    // Then res.render

    Promise.all([walking, cycling, driving])
        .then(function(){
            // Gets an uber price estimate
            return new Promise(function(resolve){
                try {

                    // Uber Price Estimate Params

                    console.log('start is ', start_coord, typeof(start_coord[0])); //TODO Fix this

                    const options = {
                        method: 'GET',
                        url: 'https://api.uber.com/v1.2/estimates/price?',
                        qs:
                            {
                                start_latitude: start_coord[0],
                                start_longitude: start_coord[1],
                                end_latitude: end_coord[0],
                                end_longitude: end_coord[1]

                            },
                        headers:
                            { 'Postman-Token': 'b4efb06c-6e5c-4573-a6e7-04c688c2c70c',
                                'cache-control': 'no-cache',
                                'Content-Type': 'application/json',
                                Authorization: UBER }
                    };


                    request(options, function (err, res, inhalt) {

                        const uber_mode_options = {
                            UberPool: 'UberPool',
                            UberX:'UberX',
                            UberXL:'UberXL',
                            Black:'Uber Black',
                            'Black SUV':'Uber Black SUV',
                            WAV: 'Uber WheelChair Accessible'
                        };

                        let result = JSON.parse(inhalt);

                        if (result.code == 'distance_exceeded'){
                            price_data.push(['Uber','Distance exceeds 100mi']);
                            data.push(['Uber', 'Distance exceeds 100mi', Number.MAX_SAFE_INTEGER])
                        }
                        else {
                            for (let k = 0; k < result.prices.length; k++) {
                                const each_result = result.prices[k];
                                const each_mode = result.prices[k].localized_display_name;
                                if (each_mode in uber_mode_options) {
                                    let mode = uber_mode_options[each_mode];
                                    price_data.push([mode, each_result.estimate]);
                                    data.push([mode, time_convert(each_result.duration), each_result.duration])
                                }
                            }
                        }

                        console.log(result);
                        resolve(inhalt, res);

                    })
                } catch (err) {
                    reject(err);
                    console.log(err);
                }

            })

        })
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


                    /* Post request setup to the Wolfram API for Gas Price Avg */
                    const options = {
                        method: 'GET',
                        url: 'http://api.wolframalpha.com/v2/query',
                        qs:
                            {                                     // Grabs the City, State, and Country of the start address
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

                        // Average 2019 passenger car gets a combined 27mpg
                        let cost_low = (drive_distance / 1609.344) * dpg / 33; // using 33 as an estimated hwy mpg
                        let cost_high = (drive_distance / 1609.344) * dpg / 21; // using 21 as an estimated city mpg

                        price_data.unshift(['Driving', '$'+cost_low.toFixed(2) + '-' + cost_high.toFixed(2)]);
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
                prices: price_data,
                app_id: FACEBOOK,
                mq_key: MAPQUEST

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

