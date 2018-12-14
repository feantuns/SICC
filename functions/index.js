'use strict';
const functions = require('firebase-functions')
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

// ativa funcao quando um dado é inserido/alterado nessa referencia no banco
exports.novaEncomenda = functions.database.ref('/Mensagens/Aguardando/{pushId}').onWrite(event => {
  const snapshot = event.data // pegando novo objeto escrito no banco

  // extraindo dados do objeto retornado
  const nome = snapshot.val().nome
  const motivo = snapshot.val().motivo
  const visita = snapshot.val().visita
  const key = snapshot.key

  var payload // armazena os dados que serao enviados para o cel

  if (motivo === 'Encomenda') {
    payload = {

      data: {
        title: 'Encomenda na portaria',
        body: 'Um novo pacote espera por você na portaria',
        icon: 'ic_notification',
        sound: 'default'
      }

    }
  } else if (motivo === 'Carta') {
    payload = {

      data: {
        title: 'Cartas na portaria',
        body: 'Chegaram cartas para você na portaria, venha buscar',
        icon: 'ic_notification',
        sound: 'default'
      }

    }
  } else if (motivo === 'Conta') {
    payload = {

      data: {
        title: 'Contas na portaria',
        body: 'Chegaram contas suas na portaria, venha buscar',
        icon: 'ic_notification',
        sound: 'default'
      }

    }
  } else if (motivo === 'Visita') {
    payload = {

      data: {
        title: visita + ' está aqui',
        body: 'Posso deixá-lo entrar?',
        icon: 'ic_notification',
        sound: 'default'
      }
    }
  }

  var tokensAguardando = [] // array para os tokens 

  var token 

  // procurando usuario informado pelo porteiro
  // filtrando pelo nome completo do usuario
  admin.database().ref('Usuarios/').orderByChild('nomeCompleto').equalTo(nome)
  .on('child_added', function (snap) {
    // var len = snap.length;
    var key = snap.key
    admin.database().ref('Usuarios/' + key + '/token/')
    .on('child_added', function (snapshot) {
      token = snapshot.val()
      tokensAguardando.push(token) // adicionando token ao array de tokens
    })

    // enviando a notificacao, passando os tokens e a notificacao em si 
    return admin.messaging().sendToDevice(tokensAguardando, payload).then(response => {
      response.results.forEach((result, index) => {
        const error = result.error
        if (error) {
          console.error('Algo deu errado', error)
        } else {
          console.log('Notificação enviada com sucesso!')
        }
      })
    })
  })
})

// funcao notificacoes porteiro -> morador
exports.novoEngano = functions.database.ref('/Mensagens/Enganos/{pushId}').onWrite(event => {
  const snapshot = event.data
  const nome = snapshot.val().nome
  var payload

  var tokensEngano = []
  var token
  var engano = {

    data: {
      title: 'Houve um engano, desculpe',
      body: 'Desconsidere a ultima notificação que recebeu, era para outra pessoa',
      icon: 'ic_notification',
      sound: 'default'
    }

  }

  admin.database().ref('Usuarios/').orderByChild('nomeCompleto').equalTo(nome)
  .on('child_added', function (snap) {
    var key = snap.key
    admin.database().ref('Usuarios/' + key + '/token/')
    .on('child_added', function (snapshot) {
      token = snapshot.val()
      tokensEngano.push(token)
    })

    return admin.messaging().sendToDevice(tokensEngano, engano).then(response => {
      response.results.forEach((result, index) => {
        const error = result.error
        if (error) {
          console.error('Algo deu errado', error)
        } else {
          console.log('Notificação enviada com sucesso!')
        }
      })
    })
  })
})

// funcao notificacoes nova noticia
exports.novaNoticia = functions.database.ref('/Noticias/{pushId}').onWrite(event => {
  const snapshot = event.data

  const titulo = snapshot.val().titulo
  const subtitulo = snapshot.val().subtitulo
  var payload = {

    data: {
      title: titulo,
      body: subtitulo,
      icon: 'ic_notification',
      sound: 'default'
    }

  }

  var tokens = []
  var token

  admin.database().ref('Usuarios/').on('child_added', function (snap) {
    var key = snap.key
    admin.database().ref('Usuarios/' + key + '/token/').on('child_added', function (snapshot) {
      token = snapshot.val()
      tokens.push(token)
    })

    return admin.messaging().sendToDevice(tokens, payload).then(response => {
      response.results.forEach((result, index) => {
        const error = result.error
        if (error) {
          console.error('Algo deu errado', error)
        } else {
          console.log('Notificação enviada com sucesso!')
        }
      })
    })
  })
})

// Notificacao Chegada segura
exports.chegadaSegura = functions.database.ref('/MoradoresProximos/{pushId}').onWrite(event => {
  const snapshot = event.data

  const user = snapshot.val().nome

  var payload = {

    notification: {
      title: user + ' está chegando!',
      body: 'Acompanhe sua localização exata na sessão "Acompanhe" do site',
      icon: '/logo-sicc-p.png',
      click_action: 'https://topaziovilleapp.firebaseapp.com/Paginas/sicc.html',
      sound: 'default'
    }

    // ,
    // data: {
    //   title: user + ' está chegando!',
    //   body: 'Acompanhe sua localização exata na sessão "Acompanhe" do site',
    //   icon: '/logo-sicc-p.png',
    //   click_action: 'https://topaziovilleapp.firebaseapp.com/Paginas/sicc.html',
    //   sound: 'default'
    // }

  }

  var tokens = []
  var token

  admin.database().ref('Funcionarios/').on('child_added', function (snap) {
    var key = snap.key
    admin.database().ref('Funcionarios/' + key + '/token/').on('child_added', function (snapshot) {
      token = snapshot.val()
      tokens.push(token)
    })

    return admin.messaging().sendToDevice(tokens, payload).then(response => {
      response.results.forEach((result, index) => {
        const error = result.error
        if (error) {
          console.error('Algo deu errado', error)
        } else {
          console.log('Notificação enviada com sucesso!')
        }
      })
    })
  })
})

// Enviando notificação para o funcionario quando um novo evento é marcado
exports.novoEvento = functions.database.ref('/Eventos/{userId}/{pushId}').onWrite(event => {
  
  const snapshot = event.data

  const user = snapshot.val().user

  admin.database().ref('Usuarios/' + user).once('value', function(snapshot) {
    const nome = snapshot.val().nomeCompleto
    var payload = {
      
      notification: {
        title: 'Novo Evento Marcado',
        body: 'Veja mais informações sobre o evento que ' + nome + ' marcou no portal',
        icon: '/logo-sicc-p.png',
        click_action: 'https://projetosiccbrasil.firebaseapp.com/Paginas/sicc.html',
        sound: 'default'
      }

      // ,
      // data: {
      //   title: 'Novo Evento Marcado',
      //   body: 'Veja mais informações sobre o evento que ' + nome + ' marcou no portal SICC',
      //   icon: '/logo-sicc-p.png',
      //   click_action: 'https://projetosiccbrasil.firebaseapp.com/Paginas/sicc.html',
      //   sound: 'default'
      // }
    
    }
  
    admin.database().ref('Funcionarios/').on('child_added', function (snap){
      var key = snap.key
      admin.database().ref('Funcionarios/' + key + '/token/').on('child_added', function (snapshot) {
        var token = snapshot.val()    
        
        return admin.messaging().sendToDevice(token, payload).then(response => {
          response.results.forEach((result, index) => {
            const error = result.error
            if (error) {
              console.error('Algo deu errado', error)
            } else {
              console.log('Notificação enviada com sucesso!')
            }
          })
        })

      })
    })  
  })
})
