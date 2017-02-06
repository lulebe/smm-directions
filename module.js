const $ = require('jquery')

const renderer = require('../../renderer')

function getPos (cb) {
  $.get('https://maps.googleapis.com/maps/api/browserlocation/json?browser=chromium&sensor=true')
  .then(data => {
    if (data.status == 'OK')
      cb(null, data.location)
    else
      cb(true, null)
  })
}


function parseRoute (route) {
  const ret = {}
  //start and end times
  ret.startTime = route.legs[0].departure_time.text
  ret.endTime = route.legs[0].arrival_time.text
  ret.duration = route.legs[0].duration
  ret.steps = route.legs[0].steps
      .filter(step => step.travel_mode == 'TRANSIT')
      .map(step => ({
        start: step.transit_details.departure_stop.name,
        end: step.transit_details.arrival_stop.name,
        vehicle: step.transit_details.line.vehicle.name + ' ' + tep.transit_details.line.short_name
      }))
  return ret
}




module.exports = function (data) {
  return {
    renderStatus: function (domNode) {
      if (!data.statusAddress) {
        domNode.text('Use the app to define your commute destination.')
        return
      }
      getPos((err, pos) => {
        if (err) {
          domNode.text("We can't get your position")
          return
        }
        const url = 'https://maps.googleapis.com/maps/api/directions/json?key=' +
            renderer.getSettings().googleAPIKey +
            '&origin=' +
             pos.lat + ',' + pos.lng +
             '&destination=' +
             data.statusAddress +
             '&mode=transit'
        $.get(url).then(directions => {
          if (directions.status != 'OK') {
            domNode.text("We couldn't find a connection")
            return
          }
          const route = parseRoute(directions.routes[0])
          domNode.text(route)
        }, () => {
          domNode.text('Unfortunately there was an error while connecting to Google')
        })

      })
    }
  }
}
