var infowindow;
var foundUserLocation = false;
var allMapMarkers = [];

function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 37.0902,
            lng: -95.712891
        },
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });


    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);


    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchField');
    var types = document.getElementById('extraSelector');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);


    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });


    var findMeButton = document.getElementById('findMeButton');
    findMeButton.addEventListener('click', function() {
        getGeoLocation(map);
    });


    infowindow = new google.maps.InfoWindow();


    
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers, from previous searches.
        clearAllMarkers();

        // For each place, get the icon, name and location.

        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            var icon = {
                url: place.icon,
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            var test = createMarker(place, icon, map);
            allMapMarkers.push(test);

            bounds.extend(place.geometry.location);

        });


        map.fitBounds(bounds);
    });


    function createMarker(place, theIcon, theMap) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            map: theMap,
            title: place.name,
            position: place.geometry.location
        });

        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(createInfoWindowContent(place));
            infowindow.open(theMap, this);

            if (foundUserLocation) {
                document.getElementById("directions").addEventListener("click", function() {
                    clearAllMarkers()
                    
                    //I only ever drive, so setting the mode for cars
                    connectLocations(foundUserLocation, place.place_id, google.maps.TravelMode.DRIVING, directionsService, directionsDisplay);
                }, false);
            }
        });

        return marker;
    }


    function createInfoWindowContent(place) {
        var content = '<div>Error: Could not retrieve details.</div>';

        if (place) {
            content = '<div><strong>' +
                place.name +
                '</strong><br>' +
                place.formatted_address +
                '</div>'

            if (foundUserLocation) {
                content += '<br><br><div><button id="directions">Get Directions</button></div>'
            }
        }

        return content;
    }


    function connectLocations(toPlaceId, fromPlaceId, travelMode, directionsService, directionsDisplay) {
        if (!toPlaceId || !fromPlaceId) {
            return;
        }

        directionsService.route({
            origin: {
                'placeId': toPlaceId
            },
            destination: {
                'placeId': fromPlaceId
            },
            travelMode: travelMode
        }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });



    }

    getGeoLocation(map);
}

function getGeoLocation(map) {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {

        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        function success(position) {
            foundUserLocation = true;

            var crd = position.coords;
            var pos = {
                lat: crd.latitude,
                lng: crd.longitude
            };
            map.setCenter(pos);
            map.setZoom(11);

            console.log('Your current position is:');
            console.log('Latitude : ' + crd.latitude);
            console.log('Longitude: ' + crd.longitude);
            console.log('More or less ' + crd.accuracy + ' meters.');


            var geocoder = new google.maps.Geocoder;
            latitude = crd.latitude;
            longitude = crd.longitude;
            var latlng = {
                lat: parseFloat(latitude),
                lng: parseFloat(longitude)
            };

            geocoder.geocode({
                'location': latlng
            }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        console.log(results[1].place_id);
                        foundUserLocation = results[1].place_id;
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });




        };

        function error(err) {
            console.warn('ERROR(' + err.code + '): ' + err.message);
            handleLocationError(true);
        };

        navigator.geolocation.getCurrentPosition(success, error, options);

    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false);
    }
}

    function clearAllMarkers() {
    
        if (allMapMarkers) {
            for (i=0; i < allMapMarkers.length; i++) {
                allMapMarkers[i].setMap(null);
            }
            
            allMapMarkers.length = 0;
        }
        
        infowindow.close();
    }


function handleLocationError(browserHasGeolocation) {
    var content = browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.';
    alert(content);
}
