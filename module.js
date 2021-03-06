const $ = require('jquery')

const renderer = require('../../renderer')

const voiceDE = require('./voice_de')
const voiceEN = require('./voice_en')


const mapStyle = [
    {
        "featureType": "all",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#000000"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#000000"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#444444"
            },
            {
                "weight": 1
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#666666"
            },
            {
                "weight": 0.8
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    }
]




const typeIcons = {
  'RAIL': 'tram.png',
  'METRO_RAIL': 'tram.png',
  'SUBWAY': 'tram.png',
  'TRAM': 'tram.png',
  'MONORAIL': 'tram.png',
  'HEAVY_RAIL': 'train.png',
  'COMMUTER_TRAIN': 'train.png',
  'HIGH_SPEED_TRAIN': 'train.png',
  'BUS': 'bus.png',
  'INTERCITY_BUS': 'bus.png',
  'TROLLEYBUS': 'bus.png',
  'SHARE_TAXI': 'taxi.png',
  'FERRY': 'ferry.png',
  'CABLE_CAR': 'gondola.png',
  'GONDOLA_LIFT': 'gondola.png',
  'FUNICULAR': 'gondola.png',
  'OTHER': 'other.png',
  undefined: 'train.png'
}

const statusRouteTpl = require('dot').template(`
  <div class="smm-directions-container">
    <span class="smm-directions-s-heading">Next connection</span><br>
    {{~it.vehicles :value}}
      <div class="smm-directions-s-vehicle">
        <img src="modules/smm-directions/{{=value.icon}}"/>
        <span class="smm-directions-s-vehicle-text">{{=value.name}}</span>
      </div>
    {{~}}
    <table>
      <tr>
        <td><img src="modules/smm-directions/start.png" alt="start" /></td>
        <td>{{=it.startPos}}</td>
        <td><strong>{{=it.startTime}}</strong></td>
      </tr>
      <tr>
        <td><img src="modules/smm-directions/end.png" alt="end" /></td>
        <td>{{=it.endPos}}</td>
        <td><strong>{{=it.endTime}}</strong></td>
      </tr>
    </table>
  </div>
`)


function parseRoute (route) {
  console.log(route)
  const ret = {}
  //start and end times
  ret.startTime = route.legs[0].departure_time.value*1000
  ret.endTime = route.legs[0].arrival_time.value*1000
  ret.duration = route.legs[0].duration
  ret.steps = route.legs[0].steps
      .filter(step => step.travel_mode == 'TRANSIT')
      .map(step => ({
        start: step.transit_details.departure_stop.name,
        end: step.transit_details.arrival_stop.name,
        vehicle: {
          name: step.transit_details.line.short_name,
          longName: step.transit_details.line.vehicle.name + ' ' + step.transit_details.line.short_name,
          type: step.transit_details.line.vehicle.type
        }
      }))
  return ret
}

function getRouteTo (place, cb) {
  const pos = renderer.getSettings().location
  const url = 'https://maps.googleapis.com/maps/api/directions/json?key=' +
      renderer.getSettings().googleAPIKey +
      '&origin=' +
      pos.lat+','+pos.lng  +
      '&destination=' +
      place +
      '&mode=transit'
  $.get(url).then(directions => {
    if (directions.status != 'OK')
      cb(true, null)
    else
      cb(null, parseRoute(directions.routes[0]))
  }, () => {
    cb(true, null)
  })
}

function addLeadingZero(val) {
  let ret = val + ''
  if (ret.length == 1)
    ret = '0'+ret
  return ret
}

function renderStatusRoute (route, dom) {
  const startDate = new Date(route.startTime)
  const startTime = addLeadingZero(startDate.getHours()) + ':' + addLeadingZero(startDate.getMinutes())
  const endDate = new Date(route.endTime)
  const endTime = addLeadingZero(endDate.getHours()) + ':' + addLeadingZero(endDate.getMinutes())
  dom.html(statusRouteTpl({
    vehicles: route.steps.map(step => ({name: step.vehicle.name, icon: typeIcons[step.vehicle.type]})),
    startPos: route.steps[0].start,
    startTime,
    endPos: route.steps[route.steps.length-1].end,
    endTime
  }))
}

function renderWindowRoute (place) {
const win = renderer.openWindow()
const mapDiv = $('<div style="width: 100%; height: 100%;" id="smm-directions-map"></div>')
win.append(mapDiv)
  window.smmDirectionsRender = () => {
    const map = new google.maps.Map(document.getElementById('smm-directions-map'), {
      center: renderer.getSettings().location,
      scrollwheel: false,
      zoom: 9,
      styles: mapStyle,
      disableDefaultUI: true
    });

    const directionsDisplay = new google.maps.DirectionsRenderer({
      map: map
    });

    // Set destination, origin and travel mode.
    const request = {
      destination: place,
      origin: renderer.getSettings().location,
      travelMode: 'TRANSIT'
    };

    // Pass the directions request to the directions service.
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
      if (status == 'OK') {
        // Display the route on the map.
        directionsDisplay.setDirections(response);
      }
    });
  }
  win.append('<script src="https://maps.googleapis.com/maps/api/js?key=' + renderer.getSettings().googleAPIKey + '&callback=smmDirectionsRender"></script>')
}


module.exports = function (data) {
  voiceDE(data, getRouteTo, renderWindowRoute)
  voiceEN(data, getRouteTo, renderWindowRoute)
  return {
    renderStatus: function (domNode) {
      if (!data.Status_Address) {
        domNode.html('Use the app to define your commute destination.')
        return
      }
      getRouteTo(data.Status_Address, (err, route) => {
        if (err)
          domNode.html('Unfortunately there was an error getting a route')
        else
          renderStatusRoute(route, domNode)
      })
    }
  }
}
