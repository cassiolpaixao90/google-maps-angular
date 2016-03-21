(function() {
    'use strict';

angular
.module('angularGoogleMap')
.factory('GMInitializer', initializerFactory)
.factory('GoogleMap', googleMapFactory)
.directive('googleMap', googleMapDirective);

googleMapDirective.inject = ['GoogleMap', 'GMInitializer'];
function googleMapDirective(GoogleMap, GMInitializer) {
    return {
        restrict: 'E',
        template: "<div id='gma_map_container'></div>",
        scope: {
            gmOptions: '=',
            mapReady: '&'
        },
        link: function($scope, elem, attrs, ctrl) {
            Initializer.done
            .then(function() {
                MapService.renderMap(gmOptions)
                .then(function(map) {
                    if ($scope.mapReady) {
                        $scope.mapReady(map);
                    }
                })
                .catch(function(err) {
                    console.error('Error rendering map:', err);
                });
            })
            .catch(function(err) {
                console.error('Error initializing map', err);
            });
        }
    }
}

/*
    Asynchronous Google JavaScript API load courtesy of
    Dmitri Zaitsev http://codereview.stackexchange.com/users/29119/dmitri-zaitsev
    published for public use here:
    http://codereview.stackexchange.com/questions/59678/simple-async-google-maps-initializer-with-angularjs
    Thank you sir, for a wonderful solution to getting google maps into an SPA.
*/
initializerFactory.$inject = ['$q', '$window'];
function initializerFactory($q, $window) {
    var mapsDefer = $q.defer();
    // Google's url for async maps initialization accepting callback function
    var asyncUrl = 'https://maps.googleapis.com/maps/api/js?v=3.22&libraries=places,drawing&callback=';
    if (!$window.googleMapsInitialized) {
        // Callback function - resolving promise after maps successfully loaded
        $window.googleMapsInitialized = mapsDefer.resolve;

        // Start loading google maps
        asyncLoad(asyncUrl, 'googleMapsInitialized');
    }

    // Async loader
    function asyncLoad(asyncUrl, callbackName) {
        var script = document.createElement('script');
        script.src = asyncUrl + callbackName;
        document.body.appendChild(script);
    }

    // Usage: Initializer.done.then(callback)
    return {
        done: mapsDefer.promise
    };
}

MapService.$inject = ['$q', '$timeout', '$rootScope', '$compile',
'Initializer', 'ViewBuilder'];
function MapService($q, $timeout, $rootScope, $compile, Initializer,
    DataFetchers, ViewBuilder) {
    // The Google Content loaded over the Wire
    // Loaded once and then modified in memory
    var mapReady = $q.defer();
    var content = {
        map: null,
        geocoder: null,
        searchBox: null,
        overlays: []
    };

    // The DOM Element that holds the Map
    var mapDiv = document.createElement('div');
    mapDiv.id = 'map';

    //Instatiates the Map for the Modal with Drawing Manager and Search Box
    function renderMap(options) {
        return getBaseMap(options)
        .then(function(map) {
            // Find map_canvas and attach map
            attachMaptoDOM();
            google.maps.event.trigger(map, 'resize');
            mapReady.resolve(map);
            return map;
        });
    }

    // Create the BaseMap Based on the Start Location of the Session
    function getBaseMap(options) {
        // First-time map load
        if (!content.map) {
            return makeMap(mapDiv, options)
                .then(function(newMap) {
                    content.map = newMap;
                    return content.map;
                });
        // All subsequent requests w/ current JS
        } else {
            resetMap();
            return $q.when(content.map);
        }
    }

    // Add Controls and Search once the Map is ready
    function controlsAndSearch(map, center, scope) {
        center = center || content.center;
        return addSearchBox(map)
        .then(function() {
            // This is a workaround bc injecting CustomerContent
            // would be a circular dependency. Filter linked via $scope
            customerFilters = scope.customerContent.filters;
            addMarkerDetails(map, center, scope);
            addMapListeners(map);
            return map;
        });
    }

    // Capture the users location and center the map on them
    function centerOnUser() {
        return getUserLocation()
        .then(function(cent) {
            content.center = cent || content.center;
            content.map.panTo(content.center);
            return cent;
        });
    }

    // Return a new Map Instance
    function makeMap(element, options) {
        return $q.when(new google.maps.Map(element, options));
    }

    // Attaches the MapDiv to the new Map Container
    function attachMaptoDOM() {
        if (!document.getElementById('map')) {
            document
            .getElementById('gma_map_container')
            .appendChild(mapDiv);
        }
    }

    // Fetch Geocoder and Convert Point of Interest into a LatLng
    function geocodeLocation(location) {
        var param = {
            'address': location
        };
        if (!content.geocoder) {
            return makeGeocoder()
            .then(function(geocoder) {
                content.geocoder = geocoder;
                return geocode(param);
            });
        } else {
            return geocode(param);
        }
    }

    // Fetch geocoder and Convert LatLng to Address
    function geocodeLatLng(latlng) {
        var param = {
            'location': latlng
        };
        if (!content.geocoder) {
            return makeGeocoder()
            .then(function(geocoder) {
                content.geocoder = geocoder;
                return geocode(param);
            });
        } else {
            return geocode(param);
        }
    }

    // Geocodes Location to Latlng with geocoder
    function geocode(param) {
        var defer = $q.defer();
        content.geocoder.geocode(param, function(result, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                defer.resolve(result);
            } else {
                defer.resolve(null);
            }
        });
        return defer.promise;
    }

    // Return a Google Place Geocoder
    function makeGeocoder(options) {
        return $q.when(new google.maps.Geocoder(options));
    }

    // Add a Place Search to the map
    function addSearchBox(map, position) {
        if (!content.searchBox) {
            var input = document.createElement('input');
            input.id = 'pac-input';
            input.type = 'text';
            input.className = 'map-controls';
            return makeSearchBox(input)
            .then(function(searchBox) {
                content.searchBox = searchBox;
                map.controls[position || google.maps.ControlPosition.TOP_LEFT].push(input);
                addSearchListeners(map, content.searchBox, input);
                return content.searchBox;
            });
        } else {
            var defer = $q.defer();
            // Search box is already on map, bias to new location
            content.searchBox.setBounds(map.getBounds());
            defer.resolve(content.searchBox);
            return defer.promise;
        }
    }

    // Return a Google Place Search Box
    function makeSearchBox(inputElem) {
        return $q.when(new google.maps.places.SearchBox(inputElem));
    }

    // Try to fetch the user's location
    function getUserLocation() {
        var defer = $q.defer();
        try {
            if (navigator.geolocation) {
                navigator.geolocation
                .getCurrentPosition(function(p) {
                    defer.resolve({
                        lat: p.coords.latitude,
                        lng: p.coords.longitude
                    });
                }, function(e) {
                    console.error('Geolocation Disabled by user. Using Default Location');
                    defer.resolve(null);
                });
            } else {
                console.error('Gelocation unavailable in this browser environment');
                defer.resolve(null);
            }
        } catch (e) {
            console.error('Geolocation failed');
            defer.resolve(null);
        }
        return defer.promise;
    }

    // Create a google LatLng Object
    function makeLatLng(loc) {
        var alreadyLatLng = typeof loc.lat === 'function';
        var defer = $q.defer();
        if (!alreadyLatLng) {
            defer.resolve(new google.maps.LatLng(loc.lat, loc.lng));
        } else {
            defer.resolve(loc);
        }
        return defer.promise;
    }

    // Make LatLng Bounds item
    function makeLatLngBounds(bounds) {
        var swBounds = {
            lat: bounds.southWest.lat,
            lng: bounds.southWest.lng
        };
        var neBounds = {
            lat: bounds.northEast.lat,
            lng: bounds.northEast.lng
        };
        return $q.when(new google.maps.LatLngBounds(swBounds, neBounds));
    }

    // Make Circle Overlay
    function makeCircle(options) {
        return makeLatLng(options.center)
        .then(function(center) {
            options.center = center;
            options.radius = parseFloat(radius);
            return $q.when(new google.maps.Circle(options));
        });
    }

    // Make Rectangle Overlay
    function makeRectangle(options) {
        return makeLatLngBounds(options.bounds)
        .then(function(gBounds) {
            options.bounds = gBounds;
            return $q.when(new google.maps.Rectangle(options));
        });
    }

    // Make Marker Overlay
    function makeMarker(options) {
        return makeLatLng(options.position)
        .then(function(latlng) {
            options.position = latlng;
            return $q.when(new google.maps.Marker(options));
        });
    }

    /* ------------------------------------------------------
            Map Listeners and Drawing Manager Events
    -------------------------------------------------------*/

    // Hide all Overlays from the map instance
    function hideAllOverlays() {
        angular.forEach(content.overlays, function(overlay) {
            overlay.setMap(null);
        });
    }

    // Remove all Overlays from the Map Instance
    function removeAllOverlays() {
        hideAllOverlays();
        content.overlays.length = 0;
    }

    // Returns all of the content associated with the current Map Instance
    function data() {
        return $q.when(content);
    }

    return {
        // Map Getters and Setters
        renderMap: renderMap,
        mapReady: mapReady,
        data: data,
        centerOnUser: centerOnUser,

        addSearchBox: addSearchBox,
        addControl: addControl,
        geocodeLocation: geocodeLocation,
        geocodeLatLng: geocodeLatLng,

        makeMarker: makeMarker,
        makeRectangle: makeRectangle,
        makeCircle: makeCircle,
        makeLatLng: makeLatLng,
        makeLatLngBounds: makeLatLngBounds,
        makeSearchBox: makeSearchBox
    };
}

})();