// script.js
var map;
var placesService;
var selectedPlace = {
  cityname: '',
  state: '',
  country: ''
};
var marker;
var itineraryContent;
const resetBut = document.getElementById('resetLocationButton');

function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 13
      });

      placesService = new google.maps.places.PlacesService(map);

      map.addListener('click', function(event) {
        addMarker(event.latLng);
      });
    });
  }
}

function addMarker(location) {
  // Clear any previous markers
  if (marker) {
    marker.setMap(null);
  }

  // Create a new marker at the selected location
  marker = new google.maps.Marker({
    position: location,
    map: map
  });

  // Reverse geocode the selected location to get state, city/town, and country
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: location.toJSON() }, function(results, status) {
    if (status === 'OK' && results[0]) {
      var addressComponents = results[0].address_components;
      for (var i = 0; i < addressComponents.length; i++) {
        var component = addressComponents[i];
        if (component.types.includes('locality')) {
          selectedPlace.cityname = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          selectedPlace.state = component.long_name;
        } else if (component.types.includes('country')) {
          selectedPlace.country = component.long_name;
        }
      }
      document.getElementById('selected-location').textContent = selectedPlace.cityname + ', ' + selectedPlace.state + ', ' + selectedPlace.country;
    }
  });
}

function resetLocation() {
  // Clear the marker and reset the selected location
  marker = null;
  var tmp = document.getElementById('itinerary');
  tmp.innerHTML = '';
  resetBut.style.display = 'none';
  
  selectedPlace = {
    cityname: '',
    state: '',
    country: ''
  };

  // Clear the selected location text
  document.getElementById('selected-location').textContent = '';

  // Scroll back to the map for location selection
  map.setCenter(map.getCenter()); // Re-center the map
}


async function planMyDay() {
  console.log(marker)
  if (!marker) {
    alert('Please select a location on the map.');
    return;
  }
  
  const selectedLocation = selectedPlace.state + ', ' + selectedPlace.country;
  const currentTime = new Date();
  const request = {
    location: marker.getPosition(),
    radius: 3500,
    type: 'tourist_attraction'
  };
  placesService.nearbySearch(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      const places = results.map(place => place.name);
      const timeOfDay = currentTime.getHours();

      $.ajax({
        type: "POST",
        url: "https://api.openai.com/v1/engines/gpt-3.5-turbo/completions",
        headers: {
          "Authorization": "Bearer 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"
        },
        data: JSON.stringify({
          prompt: `Plan a day trip to ${selectedLocation} at ${timeOfDay} o'clock. Suggest places to visit near ${selectedLocation}.`,
          model: "gpt-3.5-turbo-instruct",
          max_tokens: 100
        }),
        success: function (response) {
          const itinerary = response.choices[0].text;
          document.getElementById('itinerary').innerHTML = itinerary;
        }
      });
    }
  });

  const itineraryElement = document.getElementById('itinerary');
  if (itineraryElement) {
    itineraryElement.scrollIntoView({ behavior: 'smooth' });
  }
  
  const itineraryContainer = document.getElementById('itinerary');
  await sleep(3500);
  // Set the itinerary content in the container
  if (!marker) {
    alert('Please select a location on the map.');
    return;
  }
  else{
    itineraryContainer.innerHTML = itineraryContent;
  }

}
document.getElementById('planButton').addEventListener('click', function(){
  if (!marker) {
    return;
  }
  resetBut.style.display = 'inline';
});
document.getElementById('planButton').addEventListener('click', planMyDay);
