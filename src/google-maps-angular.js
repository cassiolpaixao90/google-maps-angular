(function() {
    'use strict';

angular
.module('angularGoogleMap')
.factory('GMInitializer', initializerFactory)
.factory('GoogleMap', googleMapFactory)
.directive('googleMap', googleMapDirective);

googleMapFactory.$inject = [];
function googleMapFactory() {

}

googleMapDirective.inject = [];
function googleMapDirective() {

}

initializerFactory.$inject = [];
function initializerFactory() {

}

})();