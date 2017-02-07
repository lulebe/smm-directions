const speech = require('../../speech/recognition')

const renderer = require('../../renderer')

statusPlaces = ['arbeit', 'schule', 'uni', 'universität']

module.exports = function (data, getRouteTo) {

  const voiceError = () => {
    responsiveVoice.speak("Entschuldigung, ich konnte keine Route finden.", 'Deutsch Female', {onend: () => {
      renderer.showVoiceOverlay(false)
    }})
  }

  const respondWithRoute = (route) => {
    const startDate = new Date(route.startTime)
    const endDate = new Date(route.endTime)
    const startTime = startDate.getHours() + ' Uhr ' + startDate.getMinutes()
    const endTime = endDate.getHours() + ' Uhr ' + endDate.getMinutes()
    const startPlace = route.steps[0].start
    const endPlace = route.steps[route.steps.length-1].end
    let steps = ""
    for (let i = 0; i < route.steps.length; i++) {
      if (i == 0)
        steps = route.steps[0].vehicle.name
      else if (i == route.steps.length-1)
        steps += " und " + route.steps[i].vehicle.name
      else
        steps += ", " + route.steps[i].vehicle.name
    }
    const text = "Geh um " + startTime + " los, um um " + endTime +
        " anzukommen. Deine Route ist von " + startPlace + " zu " + endPlace +
        " mit " + steps
    responsiveVoice.speak(text, 'Deutsch Female', {onend: () => {
      renderer.showVoiceOverlay(false)
    }})
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
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Verbindung zu *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Verbindung zur *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Verbindung zum *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Verbindung nach *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bahn zu *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bahn zur *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bahn zum *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bahn nach *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bus zu *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bus zur *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bus zum *place": navigateTo,
    "(Was) (Wie) (Wann) (Welche) (ist) (fährt) (der) (die) (nächste) Bus nach *place": navigateTo
  })

}
