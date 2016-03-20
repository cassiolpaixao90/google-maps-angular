# google-maps-angular

**Google Map Factory and Directive for Angular 1.3+**

## Design Philosophy
A simple, unopiniated module that exposes a map directive and factory
with endless possibilities for extensibility and customization.

### Basic Usage:

Installation and Configuration:

    bower install google-maps-angular

    <script src="path/to/google-maps-angular/dist/agm.min.js"></script>

    angular.module('app', ['angularGoogleMap']) ...

The HTML:

    <google-map options="mapOptions" on-ready="mapReady"></google-map>

Yep, that's it. This directive will load the map into your DOM tree at it's first
availability. `options` specifies map options like center, zoom, etc. Valid map options
can be found [here](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Map).
The onReady function is an option parameter that is bound to function on your scope that you wish to
execute as soon as the map is loaded. If you want to plot markers or overlays on the map, for example,
it is best to add them to the map in this function (though you can always add them later).
To manipulate the map after it is rendered, you'll want to use the `GoogleMap` factory included in this module.
The `GoogleMap` factory exposes an API for your map instance.

    function myController($scope, GoogleMap) {
        GoogleMap.ready
        .then(function(map) {
            // Your map magic (check out the API)
        });
    }

### GoogleMap Factory API
The real engine of this application is the `GoogleMap` factory which exposes
some handy api methods for manipulation the map, as well as access to the map
itself if you want to use the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/3.22/reference).
All functions in the API return a `promise`

- `GoogleMap.data`
    - parameters: None
    - functional closure that gives back a collection of all data associated with your map instance including marker lists, overlays,

- `GoogleMap.centerOnUser`
    - parameters: None
    - try and evaluate the user's location from the browser's location services. This will open a confirmation window in most browsers. If the user accepts, the map will center on their location.

- `GoogleMap.addSearchBox`
    - parameters: [Google Control Constant](https://developers.google.com/maps/documentation/javascript/3.exp/reference#ControlPosition) (optional)
    - Add a google places searchbox to the map.

- `GoogleMap.geocodeLocation`
    - parameters: address
    - return value: Google Reverse Geocode query result
    - Convert a point of interest or address into a LatLng

- `GoogleMap.geocodeLatLng`
    - parameters: [Google LatLng object](https://developers.google.com/maps/documentation/javascript/3.exp/reference#LatLng)
    - return value: Google Geocode query result (list of places)
    - Convert a LatLng into a geocoded address

- `GoogleMap.makeMarker`
    - parameters: [Google LatLng object](https://developers.google.com/maps/documentation/javascript/3.exp/reference#LatLng)
    - return value: [Google Marker Object](https://developers.google.com/maps/documentation/javascript/3.exp/reference#Marker)
    - Create a marker object (you must add it to the map with `marker.setMap(map)`)

### Advanced Notes:
The `angularGoogleMap` module exposes two complimentary Angular components,
a factory and a directive. The directive simply connects the Map to your DOM
while the factory exposes an API allowing you to interact with your map
(adding data, event-listeners, places-search, etc).

Google *strongly* advises against having more than one instance of a map
on a given page. Following their advice, this module only loads the map object
once and all subsequent interactions and manipulation is done on that map.
You never "destroy" the map instance. Rather, you reset it so that when you
need it again you can start with a fresh map.

Once `GoogleMap.ready` has resolved, you have full access to the map instance, and
the `google` global object which exposes the Google JavaScript API.

## Development

Install dependencies with `npm install`. Run the test suite with `gulp watch`
which watches the module and test file for changes.