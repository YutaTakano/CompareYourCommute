# CompareYourCommute

Many times, I have found myself opening up multiple transportation apps to find the easiest, fastest, and/or cheapest way to get from point A to point B. This app aggregates that data with just one search query into one location for a quick, at-a-glance comparison of travel time and travel cost between walking, cycling, driving (personal passenger car), and any available services offered by Uber. 
### APIs
Using user inputted source and destination locations, this app lists routes between the two in order of commute price and commute duration using:
- Google Maps APIs for Walking, Driving, and Bicycling duration estimates as well as Geocoding
- Wolfram Alpha API for local gas prices, with a low and high MPG estimate hard-coded in the app for $/mile calculations
- Uber Estimates API for duration and price of Uber services 
- MapQuest API for a static map image of the start and end points


### Changes:
- Previously the myGasFeed API was selected for gas prices, but the data returned from the calls appeared to be 6+ years old, so Wolfram was chosen instead
- Public transit APIs have not been implemented. Originally, the MBTA API was being considered until it was realized that the MBTA would only give results within Boston.
- MapQuest API was added to supplement the textual data, since Google’s static Map API with location markers is now a PAID endpoint. 


### Known Issues:
- Fairly high response time primarily caused by the API response from Wolfram Alpha coupled with the need to perform xml parsing
- The Uber estimates API only gives estimated time from the start to the end locations, and does NOT include the time until an Uber arrives at the start location. This appears to be a limitation to the API itself. 
- The estimates API for UberPool assumes only one passenger with no additional stops along the way, which, for population-dense areas, is fairly unlikely, thus underestimating the duration. This appears to be a limitation to the API itself. 


**************
Had security issue with API key in previous repo. Old repo deleted.
**************
