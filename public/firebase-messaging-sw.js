importScripts('https://www.gstatic.com/firebasejs/4.2.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/4.2.0/firebase-messaging.js')

// Inicializando Firebase
const config = {
  apiKey: 'AIzaSyBClkuOMHBNmQ8S8iqVhWiSQI5m1WmEkzs',
  authDomain: 'https://projetosiccbrasil.firebaseapp.com/',
  databaseURL: 'https://projetosiccbrasil.firebaseio.com/',
  projectId: 'projetosiccbrasil',
  storageBucket: 'projetosiccbrasil.appspot.com',
  messagingSenderId: '49635218103'
}
firebase.initializeApp(config)

const messaging = firebase.messaging()

messaging.setBackgroundMessageHandler(function (payload) {
  const title = 'SICC'
  const options = {
    body: payload.data.status,
    icon: '/logo-sicc-p.png'
  }
  return self.registration.showNotification(title, options)
})
