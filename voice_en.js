const speech = require('../../speech/recognition')

const renderer = require('../../renderer')

statusPlaces = ['work', 'school', 'uni', 'university']

module.exports = function () {

  const voiceError = () => {
    responsiveVoice.speak("I'm sorry, there was an error.", 'UK English Male', {onend: () => {
      renderer.showVoiceOverlay(false)
    }})
  }

  const respondWithRoute = (route) => {
    const startDate = new Date(route.startTime)
    const endDate = new Date(route.endTime)
    const startTime = startDate.getHours() + ' ' + startDate.getMinutes()
    const endTime = endDate.getHours() + ' ' + endDate.getMinutes()
    const startPlace = route.steps[0].start
    const endPlace = route.steps[route.steps.length-1].end
    let steps = ""
    for (let i = 0; i < route.steps.length; i++) {
      if (i == 0)
        steps = route.steps[0].vehicle.longName
      else if (i == route.steps.length-1)
        steps += " and " + route.steps[i].vehicle.longName
      else
        steps += ", " + route.steps[i].vehicle.longName
    }
    const text = "Leave at " + startTime + " to arrive at " + endTime +
        " . Your Route is from " + startPlace + " to " + endPlace +
        " with " + steps
    responsiveVoice.speak(text, 'UK English Male')
    renderer.showVoiceOverlay(false)
  }

  const navigateTo = (place) => {
    if (statusPlaces.includes(place.trim().toLowerCase())) {
      //use Status_Address
      getRouteTo(data.Status_Address, (err, route) => {
        if (err)
          voiceError()
        else
          respondWithRoute(route)
      })
    } else { //search for address
      getRouteTo(place, (err, route) => {
        if (err)
          voiceError()
        else
          respondWithRoute(route)
      })
    }
  }

  speech.addCommands({
    "(What's the) (When's the) (What is the) (When is the) (Which is the) (next) connection to *place": navigateTo,
    "(What's the) (When's the) (What is the) (When is the) (Which is the) (next) train to *place": navigateTo,
    "(What's the) (When's the) (What is the) (When is the) (Which is the) (next) bus to *place": navigateTo
  })

}
