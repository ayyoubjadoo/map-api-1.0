/*
    map-api-1.0
    A Javascript wrapper for using Google Maps API V3 simply
    Created by Ayyoub Jadoo <ayyoubjadoo@gmail.com>
*/
var MapAPI = (function () {
    var IsAPIReady = false;
    var MapInstances = {};
    var Geocoder;
    var Defaults = {
        CenterCoords: null,
        Zoom: 10,
        MarkerIcons: {
            Start: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            End: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            Normal: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            Other: ''
        }
    };

    var Point = function (lat, lng, title, type, iconUrl) {
        var self = this;
        self.Latitude = lat;
        self.Longitude = lng;
        self.Type = (typeof type == 'undefined' || type < 1 || type > 4) ? MarkerTypes.Normal : type;
        self.Icon = (typeof iconUrl == 'undefined' || type != MarkerTypes.Other) ? '' : iconUrl;
        self.Title = (typeof title == 'undefined') ? '' : title;
    };

    var MarkerTypes = {
        Start: 1,
        End: 2,
        Normal: 3,
        Other: 4
    };

    var MarkerIcons = {
        1: Defaults.MarkerIcons.Start,
        2: Defaults.MarkerIcons.End,
        3: Defaults.MarkerIcons.Normal,
        4: Defaults.MarkerIcons.Other
    }

    var initialize = function () {
        try {
            loadGoogleAPIs('MapAPI.onAPIsLoaded');
        } catch (e) {
            console.log(e);
        }
    };

    var loadGoogleAPIs = function (onLoaded) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = 'html, body, .map {' +
                            'height: 500px;' +
                            'margin-top: 2px;}' +
                            '.map-row, .map-row .col-md-12 {' +
                            'height: 100%;}';

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?key=API_KEY' +
            '&callback=' + onLoaded;

        document.head.appendChild(style);
        document.body.appendChild(script);
    };

    var onAPIsLoaded = function () {
        Defaults.CenterCoords = new google.maps.LatLng(31.95657830000000, 35.94569509999996); //Amman - Jordan
        Geocoder = new google.maps.Geocoder();
        IsAPIReady = true;
    };

    var getMapInstance = function (id, onReady, centerPoint, zoom) {
        try {
            id = (typeof id == 'undefined') ? 'map-canvas' : id;
            onReady = (typeof onReady == 'undefined') ? function () { } : onReady;
            if (typeof MapInstances[id] == 'undefined') {
                MapInstances[id] = new Map(id, onReady, centerPoint, zoom);
            }
            return MapInstances[id];
        } catch (e) {
            console.log(e);
        }
    };

    var Map = function (containerId, onReady, centerPoint, zoom) {
        var self = this;
        self.instance = null;
        self.id = null;
        self.markers = [];
        var selectedMarker = null;

        self.callbacks = {
            click: function () { },
            rightClick: function () { },
            mouseMove: function () { },
            markerClick: function () { }
        };

        self.addMarker = function (oMarker) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(oMarker.Latitude, oMarker.Longitude),
                title: oMarker.Title,
                animation: google.maps.Animation.DROP,
                icon: { url: oMarker.Type != MarkerTypes.Other ? MarkerIcons[oMarker.Type] : oMarker.Icon }
            });
            self.markers.push(marker);
            marker.setMap(self.instance);
            marker.addListener('click', onMarkerClick);
        };

        self.hideMarker = function (oMarker) {
            for (var i in self.markers) {
                if (self.markers[i].position.lat() == oMarker.Latitude && self.markers[i].position.lng() == oMarker.Longitude) {
                    self.markers[i].setMap(null);
                    break;
                }
            }
        };

        self.showMarker = function (oMarker) {
            for (var i in self.markers) {
                if (self.markers[i].position.lat() == oMarker.Latitude && self.markers[i].position.lng() == oMarker.Longitude) {
                    self.markers[i].setMap(self.instance);
                    break;
                }
            }
        };

        self.deleteMarker = function (oMarker) {
            for (var i = 0; i < self.markers.length; i++) {
                if (self.markers[i].position.lat() == oMarker.Latitude && self.markers[i].position.lng() == oMarker.Longitude) {
                    self.markers[i].setMap(null);
                    self.markers.pop(self.markers[i]);
                    break;
                }
            }
        };

        self.deleteSelectedMarker = function () {
            if (selectedMarker != null) {
                self.deleteMarker(selectedMarker);
            }
        };

        self.addMarkers = function (markers) {
            try {
                markers = (typeof markers == 'undefined') ? null : markers;
                if (markers != null && markers.length > 0) {
                    for (var i in markers) {
                        self.addMarker(markers[i], self.instance);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        };

        self.hideAllMarkers = function () {
            for (var i in self.markers) {
                self.markers[i].setMap(null);
            }
        };

        self.showAllMarkers = function () {
            for (var i in self.markers) {
                self.markers[i].setMap(self.instance);
            }
        };

        self.deleteAllMarkers = function () {
            while (self.markers.length > 0) {
                self.markers[self.markers.length - 1].setMap(null);
                self.markers.pop(self.markers[self.markers.length - 1]);
            }
        };

        self.getLocations = function (address, onSuccess) {
            var locations = [];
            Geocoder.geocode({ region: 'jo', address: address }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    for (var i in results) {
                        locations.push(new Point(results[i].geometry.location.lat(), results[i].geometry.location.lng(), results[i].formatted_address));
                    }
                }
                onSuccess(locations);
            });
        };

        self.bindLocation = function (location) {
            Geocoder.geocode({ latLng: new google.maps.LatLng(location.Latitude, location.Longitude) }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    self.instance.setCenter(results[0].geometry.location);
                    var marker = new google.maps.Marker({
                        map: self.instance,
                        position: results[0].geometry.location,
                        title: location.Address
                    });
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        };

        var onMapClick = function (e) {
            var point = new Point(e.latLng.lat(), e.latLng.lng());
            self.callbacks.click(point, e);
        };

        var onMarkerClick = function (e) {
            selectedMarker = new Point(e.latLng.lat(), e.latLng.lng());
            self.callbacks.markerClick(selectedMarker, e);
        };

        var onMapMouseMove = function (e) {
            self.callbacks.mouseMove(e.latLng.lat(), e.latLng.lng());
        };

        var onMapRightClick = function (e) {
            var point = new Point(e.latLng.lat(), e.latLng.lng());
            self.callbacks.rightClick(point, e);
        };

        var init = function (containerId, onReady, centerPoint, zoom) {
            if (!IsAPIReady) {
                setTimeout(function () { init(containerId, onReady, centerPoint, zoom); }, 300);
            }
            else {
                containerId = (typeof containerId == 'undefined') ? 'map-canvas' : containerId;
                var mapCanvas = document.getElementById(containerId);
                if (mapCanvas != null) {
                    centerPoint = (typeof centerPoint == 'undefined') ? Defaults.CenterCoords : new google.maps.LatLng(centerPoint.Latitude, centerPoint.Longitude);
                    zoom = (typeof zoom == 'undefined') ? Defaults.Zoom : zoom;

                    var mapOptions = {
                        center: centerPoint,
                        zoom: zoom
                    };

                    self.instance = new google.maps.Map(mapCanvas, mapOptions);
                    self.instance.addListener('click', onMapClick);
                    self.instance.addListener('mousemove', onMapMouseMove);
                    self.instance.addListener('rightclick', onMapRightClick);
                    self.id = containerId;
                    MapInstances[containerId] = self;
                    onReady();
                }
            }
        };

        init(containerId, onReady, centerPoint, zoom);
    };

    initialize();

    return {
        onAPIsLoaded: onAPIsLoaded,
        getMapInstance: getMapInstance,
        MarkerTypes: MarkerTypes,
        Point: Point
    };
}());
