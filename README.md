# CompareYourCommute

This app solves the problem of finding the most efficient route to a destination not just using one method of transportation but by comparing multiple. 

Considering adding an option for up to 4 commuters to price compare. 

Using user inputted source and destination locations, this app lists routes between the two in order of commute price or commute duration using:
- Google Maps API(s) 
- Wolfram Alpha API instead of mygasfeed API (local gas prices)
    - masgasfeed API data appeared to not have been updated in about 6 years, wolfram was the only alternative I could find
- Uber API
- Potentially MBTA API (depending on amount of detail provided in Google transit)

Users can sign in through their Google accounts and save favorite locations and routes in a db.


**************
Had security issue with API key in previous repo. Old repo deleted.
**************
