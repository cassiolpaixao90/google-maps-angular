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

    <google-map></google-map>

Yep, that's it. This directive will load the map into your DOM tree at it's first
availability, To add new data to the map, you'll want to use the `GoogleMap`
factory included in this module. Which exposes an API for your map instance.

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