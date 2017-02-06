const $ = require('jquery')

const renderer = require('../../renderer')

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
  'OTHER': 'other.png'
}

const statusRouteTpl = require('dot').template(`
  <div class="smm-directions-container">
    <span class="smm-directions-s-heading">Next connection</span><br>
    {{~it.vehicles :value}}
      <div class="smm-directions-s-vehicle">
        <img src="modules/directions/{{=value.icon}}"/>
        <span class="smm-directions-s-vehicle-text">{{=value.name}}</span>
      </div>
    {{~}}
    <table>
      <tr>
        <td><img src="modules/directions/start.png" alt="start" /></td>
        <td>{{=it.startPos}}</td>
        <td><strong>{{=it.startTime}}</strong></td>
      </tr>
      <tr>
        <td><img src="modules/directions/end.png" alt="end" /></td>
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
          type: step.transit_details.line.vehicle.type
        }
      }))
  return ret
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


module.exports = function (data) {
  return {
    renderStatus: function (domNode) {
      if (!data.Status_Address) {
        domNode.text('Use the app to define your commute destination.')
        return
      }
      const pos = renderer.getSettings().location
      const url = 'https://maps.googleapis.com/maps/api/directions/json?key=' +
          renderer.getSettings().googleAPIKey +
          '&origin=' +
          pos.lat+','+pos.lng  +
          '&destination=' +
          data.Status_Address +
          '&mode=transit'
      $.get(url).then(directions => {
        if (directions.status != 'OK') {
          domNode.text("We couldn't find a connection")
          return
        }
        const route = parseRoute(directions.routes[0])
        renderStatusRoute(route, domNode)
      }, () => {
        domNode.text('Unfortunately there was an error while connecting to Google')
      })
    }
  }
}
