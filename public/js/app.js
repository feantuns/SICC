/* global firebase, $, google, alert, data, loadImage, XMLHttpRequest */
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

// variaveis de atalho para acesso ao bd
const database = firebase.database() // bd
const rootRef = database.ref() // path raiz do bd

// dialog enviar notificacao
var motivo // motivo da notificacao

var selectedFile // armazena o arquivo enviado pelo usuario

// texto fim da página
const textoFim = document.getElementById('fim-da-linha')

// API GOOGLE MAPS
var map // variavel utilizada para iniciar mapa
var markers = [] // array todos os marcadores
var topazio // posicao do topazio

var dialogPolyfill = {} // tentando fazer com que os dialogs funcionem no mozilla

// define se curtir/descurtir ja foi clicado ou nao
var curtido = false
var descurtido = false

// funcao pega tempo atualmente
var tempoAtual = function (tipo) {
  // variavel que armazena a data local
  var data = new Date()
  var dia = data.getDate()
  var mesErrado = data.getMonth()
  var mesCerto = mesErrado + 1
  var ano = data.getFullYear()
  var hora = data.getHours()
  var minuto = data.getMinutes()
  if (minuto < 10) {
    minuto = '0' + minuto
  }
  var fullData = dia + '/' + mesCerto + '/' + ano + ' às ' + hora + 'h' + minuto
  var tempoInicial = data.getTime() // salvando o tempo atual e milisegundos desde 1 de janeiro de 1970
  var tempo = tempoInicial - (tempoInicial * 2)
  var dma = dia + '/' + mesCerto + '/' + ano

  switch(tipo) {
    case 'normal':
      return dma
    break
    case 'mili':
      return tempo
    break
    case 'exata':
      return fullData
    break
  }
}

$(document).ready(function () {

  // mostrando o dialog login
  var dialog = document.querySelector('#container-login')
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog)
  }
  dialog.showModal()

  if ($('#container-login').css('display', 'block')) {
    //alterando url 
    history.pushState('login','Login','/login');  

    $(document).keypress(function (e) {
      if (e.which === 13) $('#btnLogin').click()
    })
  }

  // 
  // 
  // LOGIN / LOGOUT
  // 

  // Status firebase Login
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      $('#container-login').hide()
      dialog.close()

      // LOADING
      setTimeout(function () {
        $('#loader').hide()
      }, 2000)

      user = firebase.auth().currentUser
      var userId = user.uid

      $('#sem-imagem-perfil-drawer').show()
      $('#sem-imagem-perfil-pagina').show()

      rootRef.child('Usuarios/' + userId + '/Perfil/')
        .on('child_added', function (snapshot) {

          $('#imagem-perfil-drawer').empty()
          $('#imagem-perfil-pagina').empty()
          chamaNoticias()

          if (snapshot.exists()) {

            var imgPerfil = snapshot.val()

            $('#sem-imagem-perfil-drawer').hide()
            $('#sem-imagem-perfil-pagina').hide()

            $('#imagem-perfil-drawer').show()
            $('#imagem-perfil-pagina').show()

            var imgDrawer = document.getElementById('imagem-perfil-drawer')
            var imgPagina = document.getElementById('imagem-perfil-pagina')

            // This can be downloaded directly:
            var xhr = new XMLHttpRequest()
            xhr.responseType = 'blob'
            xhr.onload = function (event) {
              var blob = xhr.response
              loadImage(
                blob,
                function (img) {
                  $(img).css('border-radius', '50px')
                  $(img).css('width', '100px')
                  $(img).css('height', '100px')
                  imgDrawer.appendChild(img)
                }, {
                  maxWidth: 100,
                  maxHeight: 100,
                  canvas: true,
                  pixelRatio: window.devicePixelRatio,
                  downsamplingRatio: 0.5,
                  orientation: true,
                  maxMetaDataSize: 262144,
                  disableImageHead: false
                }
              )
            }
            xhr.open('GET', imgPerfil, true)
            xhr.send()

            // This can be downloaded directly:
            var xhr2 = new XMLHttpRequest()
            xhr2.responseType = 'blob'
            xhr2.onload = function (event) {
              var blob = xhr2.response
              loadImage(
                blob,
                function (img) {
                  $(img).css('border-radius', '75px')
                  $(img).css('width', '150px')
                  $(img).css('height', '150px')
                  imgPagina.appendChild(img)
                }, {
                  maxWidth: 100,
                  maxHeight: 100,
                  canvas: true,
                  pixelRatio: window.devicePixelRatio,
                  downsamplingRatio: 0.5,
                  orientation: true,
                  maxMetaDataSize: 262144,
                  disableImageHead: false
                }
              )
            }
            xhr2.open('GET', imgPerfil, true)          
            xhr2.send()
            
          } else {
            $('#sem-imagem-perfil-drawer').show()
            $('#sem-imagem-perfil-pagina').show()
          }
        })

      rootRef.child('Usuarios').child(userId).once('value', snap => {

        // pegando noticias para slides
        rootRef.child('Noticias/').orderByChild('tempo').limitToFirst(2)
        .on('child_added', function (snapshot) {
          var conteudoPrimeiroSlide = snapshot.val()
          var tempo = conteudoPrimeiroSlide.tempo
          var html =
            '<img src="" class="d-block img-slide img-fluid" alt="">' +
            '<a style="text-decoration: none" href="#" onclick="criaContainerNoticiaFull(' + tempo + ')"><div class="carousel-caption d-none d-block" style="width: auto">' +
            '<h3 class="titulo-slide"></h3>' +
            '<p class="subtitulo-slide"></p>' +
            '</div></a>'

          var div = document.createElement('div')
          div.innerHTML = html
          div.classList.add('carousel-item')

          div.getElementsByClassName('img-slide')[0].src = conteudoPrimeiroSlide.imagem
          div.getElementsByClassName('titulo-slide')[0].innerText = conteudoPrimeiroSlide.titulo
          div.getElementsByClassName('subtitulo-slide')[0].innerText = conteudoPrimeiroSlide.subtitulo

          document.getElementById('carousel-inner').appendChild(div)
        })

        var tipoReal = snap.child('tipo').val() // guarda o tipo de usuario logado ex: sindico, morador, funcionario

          // verificando qual o tipo de usuario para assim permitir ou negar certas funcoes no site
        if (tipoReal === 'Sindico') {

          //
          //
          // ESTATISTICAS 
          //

          var numPosts = 0
          var numNoticias = 0
          var numEventos = 0
          var numNotificacoes = 0

          // Posts
          rootRef.child('Posts').on('value', function(posts) {
            numPosts = posts.numChildren()
            $('#est-posts').text(numPosts)
          })

          // Noticias
          rootRef.child('Noticias').on('value', function(noticias) {
            numNoticias = noticias.numChildren()
            $('#est-noticias').text(numNoticias)
          })

          // Eventos
          rootRef.child('Usuarios').on('value', function(usuarios) {
            usuarios.forEach(function(usuario) {
              userKey = usuario.key

              rootRef.child('Eventos/' + userKey).on('value', function(eventos) {
                numEventos += eventos.numChildren()
                $('#est-eventos').text(numEventos)
              }) 
            })
          })

          // Notificacoes
          rootRef.child('Mensagens/Aguardando').on('value', function(msgsAguardando) {
            numNotificacoes = 0
            numNotificacoes += msgsAguardando.numChildren()
            rootRef.child('Mensagens/Retiradas').on('value', function(msgsRetiradas) {
              numNotificacoes += msgsRetiradas.numChildren()
              rootRef.child('Mensagens/Enganos').on('value', function(msgsEnganos) {
                numNotificacoes += msgsEnganos.numChildren()
                $('#est-notificacoes').text(numNotificacoes)
              })
            })
          })

          //alterando url 
          history.pushState('noticias','Noticias','/noticias');

          $('#carousel').show() // mostrando carousel
          
          $('#tipo-user').show()
          document.getElementById('tipo-user').innerText = 'Síndico'

          if (snap.val().sexo === 'Masculino') {
            $('#terminacaoBemVindo').text('o')
            $('#terminacaoBemVindo2').text('o')
          } else if (snap.val().sexo === 'Feminino') {
            $('#terminacaoBemVindo').text('a')
            $('#terminacaoBemVindo2').text('a')
          }

          var name = snap.child('nome').val()
          $('#nomeUsuarioSlide').text(name)
          $('#user-name').text(name)

            // DADOS PESSOAIS PAG PERFIL
          $('#nome-usuario').text(snap.val().nomeCompleto)
          $('#tipo-usuario-perfil').text('Síndico')
          $('.residencial').hide()
          $('#tel-usuario').text(' ' + snap.val().telefone)
          $('#cel-usuario').text(' ' + snap.val().celular)

          $('#publico').show() // mostrando opcao de evento ser cadastrado como publico

          $('#show-dialog-notificacao').hide()

          $('#buttonDenuncias').show() // mostrando btn para ver denuncias

          $('#container-info').hide() // escondendo container que armazena o ap e o bloco do usuario
          $('#buttonNoticia').css('margin-top', '0') // tirando o margin top do link

            // chamando as funções aqui, assim evito a repetição na busca de dados do database
          chamaNoticias() // carrega todas as noticias
          chamaEventos()
          chamaEventosPerfil()
          chamaPosts() // carrega todos os posts
          drawChart()
          chamaMensagens() // carregando msgs mural

          $('.div-deleta-evento-publico').removeClass('display-none')
        } else if (tipoReal === 'Morador') {

          if (snap.val().sexo === 'Masculino') {
            $('#terminacaoBemVindo').text('o')
            $('#terminacaoBemVindo2').text('o')
          } else if (snap.val().sexo === 'Feminino') {
            $('#terminacaoBemVindo').text('a')
            $('#terminacaoBemVindo2').text('a')
          }

          //alterando url 
          history.pushState('noticias','Noticias','/noticias');

          $('#carousel').show() // mostrando carousel

          var moradorName = snap.child('nome').val()
          $('#user-name').text(moradorName)
          $('#nomeUsuarioSlide').text(moradorName)

          var apt = snap.child('apartamento').val()
          $('#user-apt').text(apt)

          var bloco = snap.child('bloco').val()
          $('#user-blc').text(bloco)

            // DADOS PESSOAIS PAG PERFIL
          $('#nome-usuario').text(snap.val().nomeCompleto)
          $('#tipo-usuario-perfil').text('Morador')
          $('#bloco-usuario').text(snap.val().bloco)
          $('#apt-usuario').text(snap.val().apartamento)
          $('#tel-usuario').text(snap.val().telefone)
          $('#cel-usuario').text(snap.val().celular)

          $('#tipo-evento-cadastro').hide()

          $('#buttonEstatisticas').hide()
          $('#show-dialog-notificacao').hide()
          $('#show-dialog-cadastra-funcionario').hide()
          $('#show-dialog-nova-noticia').hide()

            // chamando as funções aqui, assim evito a repetição na busca de dados do database
          chamaNoticias() // carrega todas as noticias
          chamaEventos()
          chamaEventosPerfil()
          chamaPosts() // carrega todos os posts
          chamaMensagens() // carregando msgs mural

        } else {

          $('#ultimo-evento-marcado').removeClass('d-flex')
          $('#ultimo-evento-marcado').hide()

          rootRef.child('Funcionarios').child(userId)
          .once('value')
          .then(function (snapshot) {
            if (snapshot.exists()) {
              document.getElementById('texto-noticia').classList.remove('d-block')
              $('#texto-noticia').hide()

              //alterando url 
              history.pushState('historico','Historico','/historico');

              $('#tipo-user').show().text(snapshot.val().cargo)

              $('#titulo').text('Histórico')
              $('#historico-msgs').removeClass('display-none')
              $('#show-dialog-notificacao').removeClass('display-none')
              $('.div-btn-mostra-lista').addClass('display-none')
              chamaHistorico(1)
              chamaEventosPorteiro()

              var name = snapshot.child('nome').val()
              $('#user-name').text(name)

              // DADOS PESSOAIS PAG PERFIL
              $('#nome-usuario').text(snapshot.val().nomeCompleto)
              $('#tipo-usuario-perfil').text('Funcionário')
              $('.residencial').hide()
              $('#tel-usuario').text(snapshot.val().telefone)
              $('#cel-usuario').text(snapshot.val().celular)

              $('#show-dialog-nova-noticia').hide()
              $('#show-dialog-cadastra-funcionario').hide()
              $('#show-dialog-publicacao').hide()
              $('#show-dialog-evento').hide()
              $('#buttonEstatisticas').hide()
              $('#buttonMensagens').hide()
              $('#carousel').hide()
              $('#container-aleatorio').hide()

              $('#container-info').hide() // escondendo container que armazena o ap e o bloco do usuario

              $('.pagination-nav').show() // mostrando btns paginacao

              // escondendo/mostrando links
              $('#buttonAcompanhe').show()
              $('#buttonNoticia').css('display', 'none')
              $('#buttonMural').css('display', 'none')
              $('#buttonHistorico').css('display', 'block')

              // FCM Função que permite o envio de notificações para os funcionários no site

              const messaging = firebase.messaging() // instanciando o FCM

              messaging.requestPermission()
                .then(function () {
                  var notification = document.querySelector('#toast-informacao')
                  var data = {
                    message: 'Você pode receber notificações!',
                    actionText: 'Undo',
                    timeout: 5000
                  }
                  notification.MaterialSnackbar.showSnackbar(data)
                  return messaging.getToken()
                })
                .then(function (token) {
                  console.log(token)
                  // Salvando token no database
                  var userId = firebase.auth().currentUser.uid
                  const salvaToken = {
                    token: token
                  }
                  var updates = {}
                  updates['Funcionarios/' + userId + '/token'] = salvaToken
                  firebase.database().ref().update(updates)
                })
                .catch(function () {
                  var notification = document.querySelector('#toast-informacao')
                  var data = {
                    message: 'Você não permitiu que mandemos notificações!',
                    actionText: 'Undo',
                    timeout: 5000
                  }
                  notification.MaterialSnackbar.showSnackbar(data)
                })

              messaging.onMessage(function (payload) {
                console.log('onMessage: ', payload)
                console.log(payload.val().nome)
                var notification = document.querySelector('#toast-informacao')
                var data = {
                  message: payload.val().nome + ' está chegando! Acompanhe sua localização exata na seção "Acompanhe"',
                  actionText: 'Undo',
                  timeout: 5000
                }
                notification.MaterialSnackbar.showSnackbar(data)
              })
            } else {
              rootRef.child('Funcionarios-Povisorios').once('value').then(function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                  var keyProvisoria = childSnapshot.key
                  console.log(keyProvisoria)
                  var funcProv = childSnapshot.val()
                  if (user.email == funcProv.email) {

                    // carregando dados para o funcionario
                    var dadosFuncionario = {
                      nome: funcProv.nome,
                      sobrenome: funcProv.sobrenome,
                      sexo: funcProv.sexo,
                      cargo: funcProv.cargo,
                      celular: funcProv.celular,
                      telefone: funcProv.telefone,
                      email: funcProv.email,
                      nomeCompleto: funcProv.nomeCompleto
                    }

                    var updates = {}
                    updates['/Funcionarios/' + userId] = dadosFuncionario

                    // salvando dados usuario no bd
                    firebase.database().ref().update(updates)

                    // deletando do registro provisorio
                    rootRef.child('Funcionarios-Povisorios/' + keyProvisoria).remove()    

                    location.reload()
                  }
                })
              })
            }  
          })
                
        }
      })
    } else {
        // mostrando container login
      dialog.showModal()
      $('#loader').show()

      location.reload()    

      if ($('#container-login').css('display', 'block')) {
        $(document).keypress(function (e) {
          if (e.which === 13) $('#btnLogin').click()
        })
      }
    }
  })

  // 
  // 
  // AÇÕES LOGIN/LOGOUT
  // 

  'use strict' // ativa snackbar

  textoFim.innerText = '< Este é o fim da linha />'

  $('#titulo').text('Noticias')
  $('#tela-sobre').hide()

  // Evento Login
  $('#btnLogin').on('click', e => {
    // Email e senha
    const email = $('#txtEmail').val()
    const senha = $('#txtPassword').val()
    const auth = firebase.auth()
    // Login
    const promise = auth.signInWithEmailAndPassword(email, senha)
    promise.catch(e => {
      $('#emailError').show()
      $('#txtPassword').val('')
    }
    )
  })

  // Evento Logout
  $('#buttonLogout').on('click', e => {
    firebase.auth().signOut()
    location.reload()
  })

  // Evento Troca Senha
  $('#linkTrocaSenha').on('click', function () {
    $('#btnTrocaTipo').removeClass('d-block')
    $('#btnTrocaTipo').hide()
    $('#container-normal').hide()
    $('#container-troca-senha').show()
    $('#btnLogin').hide()
    $('#linkTrocaSenha').hide()
    $('#btnTrocaSenha').show()
    $('#linkSaiLogin').hide()
    $('#saiTrocaSenha').show()
  })

  // Voltando ao normal
  $('#saiTrocaSenha').on('click', function () {
    $('#saiTrocaSenha').hide()
    $('#btnTrocaTipo').addClass('d-block')
    $('#btnTrocaTipo').show()
    $('#btnTrocaSenha').hide()
    $('#container-normal').show()
    $('#container-troca-senha').hide()
    $('#btnLogin').show()
    $('#linkSaiLogin').show()
    $('#linkTrocaSenha').show()
  })

  // Função envia email de troca senha
  $('#btnTrocaSenha').on('click', function () {
    'use strict'
    var auth = firebase.auth()
    var emailAddress = $('#txtEmailSenha').val()

    auth.sendPasswordResetEmail(emailAddress).then(function () {
      var notification = document.querySelector('#toast-informacao')
      var data = {
        message: 'Email de redefinição de senha enviado!',
        actionText: 'Undo',
        timeout: 5000
      }
      notification.MaterialSnackbar.showSnackbar(data)
      $('#form-login').show()
      $('#form-troca-senha').hide()
    }, function () {
      var notification = document.querySelector('#toast-informacao')
      var data = {
        message: 'Algo deu errado! Confira o email informado e tente novamente...',
        actionText: 'Undo',
        timeout: 5000
      }
      notification.MaterialSnackbar.showSnackbar(data)
    })

    $('#linkSaiLogin').show()
    $('#saiTrocaSenha').hide()
    $('#btnTrocaTipo').addClass('d-block')
    $('#btnTrocaTipo').show()
    $('#btnTrocaSenha').hide()
    $('#container-normal').show()
    $('#container-troca-senha').hide()
    $('#btnLogin').show()
    $('#linkTrocaSenha').show()
  })

})

// 
// 
// NOTICIAS
// 

// mostrar/esconder formulario cadastro noticia
var dialogNovaNoticia = document.querySelector('#dialog-nova-noticia') // dialog
var showDialogNovaNoticia = document.querySelector('#show-dialog-nova-noticia') // button

showDialogNovaNoticia.addEventListener('click', function () {
  if (!('showModal' in dialogNovaNoticia)) {
    dialogPolyfill.registerDialog(dialogNovaNoticia)
  }
  $('html').css('overflow', 'hidden')
  dialogNovaNoticia.showModal()
  $('#titulo-dialog-noticia').val('')
  $('#conteudo-dialog-noticia').val('')
  $('#subtitulo-dialog-noticia').val('')
  $('#novaImagemNoticia').empty()
  selectedFile = ''
})
dialogNovaNoticia.querySelector('.close').addEventListener('click', function () {
  dialogNovaNoticia.close()
})

// input que aramazena o arquivo enviado pelo usuario
$('#imagem-noticia').on('change', function (event) {
  selectedFile = event.target.files[0]

  $('#novaImagemNoticia').empty()
  var loadingImage = loadImage(
    selectedFile,
    function (img) {
      $('#novaImagemNoticia').show()
      $('#arquivoInvalidoNoticia').hide()
      try {
        $(img).addClass('d-block')
        $(img).addClass('mx-auto')
        document.getElementById('novaImagemNoticia').appendChild(img)
      } catch (err) {
        $('#arquivoInvalidoNoticia').show()
        selectedFile = ''
      }
    }, {
      maxWidth: 500,
      maxHeight: 500,
      canvas: true,
      pixelRatio: window.devicePixelRatio,
      downsamplingRatio: 0.5,
      orientation: true,
      maxMetaDataSize: 262144,
      disableImageHead: false
    }
  )
  if (!loadingImage) {
    $('#arquivoInvalidoNoticia').show()
    selectedFile = ''
  }
})

// cadastrando noticia
$('#btnCadastrarNoticia').on('click', function () {

  // passando os dados inseridos no formulario
  var titulo = $('#titulo-dialog-noticia').val()
  var noticia = $('#conteudo-dialog-noticia').val()
  var subtitulo = $('#subtitulo-dialog-noticia').val()

  // criando referencia no storage
  const storageRef = firebase.storage().ref('/noticias-photos/' + selectedFile.name)
  const uploadTask = storageRef.put(selectedFile)

  $('#btnCadastrarNoticia').hide()
  $('.loading-upload').show()

  uploadTask.on('state_changed',

    function progress (snapshot) {
      // var percentage = (snapshot.bytesTransferred /
      // snapshot.totalBytes) * 1000;
      // $('#uploader').css({
      //   width: percentage
      // });
      console.log('progress')
    }, function(error) {
      // Handle unsuccessful uploads
      console.log(error)
    },
    function () {
      var noticiaKey = firebase.database().ref('Noticias/').push().key
      var downloadURL = uploadTask.snapshot.downloadURL
      var noticiaData = {
        tempo: tempoAtual('mili'),
        imagem: downloadURL,
        data: tempoAtual('exata'),
        noticia: noticia,
        subtitulo: subtitulo,
        titulo: titulo
      }
      $('#container-noticias').empty()
      var updates = {}
      updates['/Noticias/' + noticiaKey] = noticiaData
      firebase.database().ref().update(updates)

      $('#btnCadastrarNoticia').show()
      $('.loading-upload').hide()

      dialogNovaNoticia.close()
    })
})

// função para chamar as noticias do bd
function chamaNoticias () {
  var noticiasRef = firebase.database().ref('/Noticias/').orderByChild('tempo').limitToLast(100)
  noticiasRef.on('value', function (snapshot) {
    $('#container-noticias').empty()

    var novaNoticia = snapshot.val()
    var keys = Object.keys(novaNoticia)
    var currentRow
    var i = 0

    // for(var i = 0; i < keys.length; i++) {
    snapshot.forEach(function (childSnapshot) {
      var currentObject = childSnapshot.val()
      if (i < keys.length) {
        if (i % 3 === 0) {
          currentRow = document.createElement('div')
          currentRow.classList.add('rowNoticia')
          $(currentRow).addClass('row')
          $('#container-noticias').append(currentRow)
        }
        var tempo = currentObject.tempo

        // definindo o escopo da noticia em html e utilizando classes bootstrap
        var html =
          '<div class="mdl-card__media">' +
            '<img class="imagem-noticia img-fluid">' +
          '</div>' +
          '<div class="mdl-card__title" style="justify-content: center; padding-bottom: 0;">' +
            '<h2 class="mdl-card__title-text titulo text-center"></h2>' +
          '</div>' +
          '<div class="mdl-card__supporting-text subtitulo mx-auto d-block text-center" style="justify-content: center; padding-top: 0;"></div>' +
          '<div class="mdl-card__actions">' +
            '<button data-target="#topo" onclick="criaContainerNoticiaFull(' + tempo + ')" class="mx-auto d-block mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">Ler tudo</button>' +
          '</div>'

        // juntando div que ira portar o container da noticia ao doc html
        var cardDeck = document.createElement('div')
        cardDeck.classList.add('card-deck', 'col-md-4')
        cardDeck.style.paddingRight = '0'
        cardDeck.style.paddingLeft = '0'

        var div = document.createElement('div')
        div.classList.add('mdl-card', 'card-shadow', 'card-noticia')
        div.style.marginTop = '4rem'
        div.style.marginBottom = '1rem'
        div.style.paddingRight = '0px'
        div.style.paddingLeft = '0px'
        div.style.width = 'auto'
        div.innerHTML = html

        // passando os valores
        div.getElementsByClassName('titulo')[0].innerText = currentObject.titulo
        div.getElementsByClassName('subtitulo')[0].innerText = currentObject.subtitulo
        if (currentObject.imagem != null) {
          div.getElementsByClassName('imagem-noticia')[0].src = currentObject.imagem
        } else {
          div.getElementsByClassName('imagem-noticia')[0].classList.add('display-none')
        }
        // noticias.getElementsByClassName('data')[0].innerText = 'Publicado em ' + currentObject.data;

        cardDeck.append(div)

        $(currentRow).append(cardDeck)
      }
      i++
      // }
    })
  })

  textoFim.style.display = 'block'
}

// função para criar o container que mostrará ao usuário a notícia inteira
function criaContainerNoticiaFull (tempo) {

  textoFim.style.display = 'none'
  $('#carousel').hide()
  $('#texto-noticia').hide()
  $('#container-noticias').hide()
  $('#container-noticia-full').show()
  rootRef.child('Noticias').orderByChild('tempo').equalTo(tempo).on('value', function (snap) {
    snap.forEach(function (childSnapshot) {
      // variavel que da acesso aos dados aos objetos gerados atraves da consulta
      // previamente realizada
      var dadosNoticia = childSnapshot.val()

      // criando elemento que será a página com a noticia inteira
      var html =
        '<div class="container-noticia-full">' +
          '<div class="row background-noticia">' +
            '<div class="suporta-imagem">' +
              '<img src="" alt="Capa Noticia" class="img-fluid imagem-principal animated fadeIn">' +
            '</div>' +
          '</div>' +
          '<div class="row card-shadow content">' +
            '<div align="justify" class="suporta-texto">' +
              '<hr>' +
              '<div class="titulo-noticia-full"></div>' +
              '<div class="conteudo-noticia"></div>' +
              '<div class="data text-center" style="color: #777; margin-top: 3rem;"></div>' +
            '</div align="justify">' +
            '<button class="mx-auto d-block mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent btn-volta" onclick="voltarTodas()">Voltar</button>' +
          '</div>' +
        '</div>'

      // criando div que vai abrigar a noticia inteira
      var div = document.createElement('div')
      div.innerHTML = html
      var noticiaCompleta = div.firstChild

      // passando os valores de cada noticia para seu respectivo campo
      noticiaCompleta.getElementsByClassName('imagem-principal')[0].src = dadosNoticia.imagem
      noticiaCompleta.getElementsByClassName('titulo-noticia-full')[0].innerText = dadosNoticia.titulo
      noticiaCompleta.getElementsByClassName('conteudo-noticia')[0].innerText = dadosNoticia.noticia
      noticiaCompleta.getElementsByClassName('data')[0].innerText = 'Publicada em ' + dadosNoticia.data

      document.getElementById('container-noticia-full').appendChild(div)
    })
  })
}

// funcao que sai da noticia selecionada e mostra novamente todas as noticias salvas
function voltarTodas () {

  // animação voltar ao topo suave
  $('.mdl-layout__content').animate({
    scrollTop: $('#topo').offset().top
  }, 500);

  textoFim.style.display = 'block'
  $('#container-noticia-full').empty()
  $('#carousel').show()
  $('#container-noticia-full').hide()
  $('#container-noticias').show()
  $('#texto-noticia').show()
}

// 
// 
// MURAL
// 

// mostrar/esconder formulario nova publicacao
var dialogNovaPublicacao = document.querySelector('#dialog-publicacao') // dialog
var showDialogNovaPublicacao = document.querySelector('#show-dialog-publicacao') // button

showDialogNovaPublicacao.addEventListener('click', function () {
  if (!('showModal' in dialogNovaPublicacao)) {
    dialogPolyfill.registerDialog(dialogNovaPublicacao)
  }
  $('html').css('overflow', 'hidden')
  $('#titulo-pub').val('')
  $('#descricao-pub').val('')
  $('#novaImagemMural').hide()
  $('#btnPublicar').hide()
  dialogNovaPublicacao.showModal()
})
dialogNovaPublicacao.querySelector('.close').addEventListener('click', function () {
  dialogNovaPublicacao.close()
  $('#semTexto').hide()
  selectedFile = ''
})

// input que aramazena o arquivo enviado pelo usuario
$('#imagem-pub').on('change', function (event) {
  $('#novaImagemMural').empty()
  selectedFile = event.target.files[0]

  var loadingImage = loadImage(
    selectedFile,
    function (img) {
      $('#novaImagemMural').show()
      $('#arquivoInvalido').hide()
      try {
        $(img).addClass('mx-auto')
        $(img).css('display', 'block')
        document.getElementById('novaImagemMural').appendChild(img)
      } catch (err) {
        $('#arquivoInvalido').show()
        selectedFile = ''
      }
    }, {
      maxWidth: 500,
      maxHeight: 500,
      canvas: true,
      pixelRatio: window.devicePixelRatio,
      downsamplingRatio: 0.5,
      orientation: true,
      maxMetaDataSize: 262144,
      disableImageHead: false
    }
  )
  if (!loadingImage) {
    $('#arquivoInvalido').show()
    selectedFile = ''
  }

  $('#btnPublicar').show()
})

// chama a função para salvar os dados da publlicação
$('#btnPublicar').on('click', function () {
  if (!$('#descricao-pub').val() || !$('#titulo-pub')) {
    $('#semTexto').show()
  } else {
    uploadPost()
    $('#semTexto').hide()
    $('#arquivoInvalido').hide()
    selectedFile = ''
  }
})

// funcao chamada ao clicar no botao publicar do form de nova publicacao
// encarregada de salvar o arquivo no storage e salvar o metadata da publicação
// no realtime database para pesquisas futuras
function uploadPost () {

  if (!selectedFile) {
    rootRef.child('Usuarios/' + userId).once('value', function(usuario) {
      var nome = usuario.val().nomeCompleto

      var postKey = firebase.database().ref('Posts/').push().key
      var downloadURL = uploadTask.snapshot.downloadURL
      var postData = {
        data: tempoAtual('exata'),
        tempo: tempoAtual('mili'),
        descricao: $('#descricao-pub').val(),
        titulo: $('#titulo-pub').val(),
        id: userId
      }
      var updates = {}
      updates['/Posts/' + postKey] = postData
      firebase.database().ref().update(updates)
    })
  } else {
    $('.loading-upload').show()
    $('#btnPublicar').hide()

    // criando referencia no storage
    const storageRef = firebase.storage().ref('/posts-photos/' + selectedFile.name)
    const uploadTask = storageRef.put(selectedFile)

    uploadTask.on('state_changed',

      function progress (snapshot) {
        // var percentage = (snapshot.bytesTransferred /
        // snapshot.totalBytes) * 1000;
        // $('#uploader').css({
        //   width: percentage
        // });
      },
      function (error) {
        console.log(error)
      },
      function () {
        var userId = firebase.auth().currentUser.uid
        rootRef.child('Usuarios/' + userId).once('value', function(usuario) {
          var nome = usuario.val().nomeCompleto

          rootRef.child('Usuarios/' + userId + '/Perfil').once('value', function(imgPerfil) {
            var imagem = imgPerfil.val().imagemPerfil
            
            var postKey = firebase.database().ref('Posts/').push().key
            var downloadURL = uploadTask.snapshot.downloadURL
            var postData = {
              data: tempoAtual('exata'),
              tempo: tempoAtual('mili'),
              url: downloadURL,
              descricao: $('#descricao-pub').val(),
              titulo: $('#titulo-pub').val(),
              id: userId,
              nome: nome,
              perfil: imagem
            }
            var updates = {}
            updates['/Posts/' + postKey] = postData
            firebase.database().ref().update(updates)
          })
        })
        
        dialogNovaPublicacao.close()
        $('.loading-upload').hide()
        $('#btnPublicar').show()
    })

    $('#imagem-pub').val('')
  }
}

// funcao que chama todos os posts cadastrados ate o momento no banco de dados
// também mostra os novos posts que são cadastrados pelos usuários
// todavia os novos posts vão para o final da página ao invés do início
function chamaPosts () {

 rootRef.child('Posts').orderByChild('tempo').on('value', function (snapshot) {

  $('#container-novo-post').empty()

    snapshot.forEach(function (childSnapshot) {
      var post = childSnapshot.val()
      var postId = childSnapshot.key
      var userId = firebase.auth().currentUser.uid

      rootRef.child('/CurtidasPosts/' + userId + '/' + postId)
      .once('value', function(curtidasPost) {
        if(curtidasPost.exists()) {
          curtidasPost.forEach(function(postCurtido) {
            var status = postCurtido.val()
            if (status == 'Liked') {
              var html =
                '<div class="mdl-card card-shadow card-mural col-md-6">' +
                  '<div class="card-header">' +
                    '<div class="row">' +
                      '<div class="imagemPerfil"></div> ' +
                      '<div class="nomeUser"></div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="mdl-card__media imagem-teste"></div>' +
                  '<div class="mdl-card__title">' +
                    '<h2 class="mdl-card__title-text titulo-mural"></h2>' +
                  '</div>' +
                  '<div class="mdl-card__supporting-text descricao-mural"></div>' +
                  '<div class="mdl-card__actions mdl-card--border">' +
                    '<a style="color: #d9534f;" id="like' + post.tempo + '" onclick="likePost(' + post.tempo + ')" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
                    '<i class="material-icons">favorite</i>' +
                    '</a>' +
                    '<span id="likes' + post.tempo + '" class="countLikes"></span>' +
                    '<a style="color: #777; margin-right: 5px;" data-toggle="modal" data-target="#' + post.tempo + 'denuncia" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
                    '<i class="material-icons">flag</i>' +
                    '</a>' +
                    '<a style="color: #777; margin-right: 5px;" data-toggle="modal" data-target="#' + post.tempo + 'comentario" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
                    '<i class="material-icons">send</i>' +
                    '</a>' +
                  '</div>' +
                '</div>'

                // juntando div que ira portar o container da noticia ao doc html
                var div = document.createElement('div')
                div.innerHTML = html
                div.classList.add('elemento')

                // passando os valores
                var imagemPerfil = div.getElementsByClassName('imagemPerfil')[0]
                
                // This can be downloaded directly:
                var xhrImgPerfil = new XMLHttpRequest()
                xhrImgPerfil.responseType = 'blob'
                xhrImgPerfil.onload = function (event) {
                  var blob = xhrImgPerfil.response
                  loadImage(
                    blob,
                    function (img) {
                      $(img).css('width', '50px')
                      $(img).css('height', '50px')
                      $(img).css('border-radius', '25px')
                      $(img).css('margin', '10px')
                      imagemPerfil.appendChild(img)
                    }, {
                      maxWidth: 500,
                      maxHeight: 500,
                      canvas: true,
                      pixelRatio: window.devicePixelRatio,
                      downsamplingRatio: 0.5,
                      orientation: true,
                      maxMetaDataSize: 262144,
                      disableImageHead: false
                    }
                  )
                }
                xhrImgPerfil.open('GET', post.perfil, true)
                xhrImgPerfil.send()

                div.getElementsByClassName('nomeUser')[0].innerText = post.nome

                div.getElementsByClassName('descricao-mural')[0].innerText = post.descricao
                div.getElementsByClassName('titulo-mural')[0].innerText = post.titulo
                if (post.url != null) {
                  var myImage = div.getElementsByClassName('imagem-teste')[0]

                  // This can be downloaded directly:
                  var xhr = new XMLHttpRequest()
                  xhr.responseType = 'blob'
                  xhr.onload = function (event) {
                    var blob = xhr.response
                    loadImage(
                      blob,
                      function (img) {
                        $(img).css('width', '100%')
                        $(img).css('max-height', '600px')
                        $(img).addClass('img-fluid')
                        myImage.appendChild(img)
                      }, {
                        maxWidth: 500,
                        maxHeight: 500,
                        canvas: true,
                        pixelRatio: window.devicePixelRatio,
                        downsamplingRatio: 0.5,
                        orientation: true,
                        maxMetaDataSize: 262144,
                        disableImageHead: false
                      }
                    )
                  }
                  xhr.open('GET', post.url, true)
                  xhr.send()
                } else {
                  div.getElementsByClassName('imagem-mural')[0].classList.add('display-none')
                }
                document.getElementById('container-novo-post').appendChild(div)
                // div.getElementsByClassName('usuario')[0].innerText = 'Publicado por ' + nomeUsuario;

          } else {
              var html =
                '<div class="mdl-card card-shadow card-mural col-md-6">' +
                '<div class="card-header">' +
                  '<div class="row">' +
                    '<div class="imagemPerfil"></div> ' +
                    '<div class="nomeUser"></div>' +
                  '</div>' +
                '</div>' +
                '<div class="mdl-card__media imagem-teste">' +
                '</div>' +
                '<div class="mdl-card__title">' +
                '<h2 class="mdl-card__title-text titulo-mural"></h2>' +
                '</div>' +
                '<div class="mdl-card__supporting-text descricao-mural"></div>' +
                '<div class="mdl-card__actions mdl-card--border">' +
                '<a style="color: #777;" id="like' + post.tempo + '" onclick="likePost(' + post.tempo + ')" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
                '<i class="material-icons">favorite</i>' +
                '</a>' +
                '<span id="likes' + post.tempo + '" class="countLikes"></span>' +
                '<a style="color: #777; margin-right: 5px;" data-toggle="modal" data-target="#' + post.tempo + 'denuncia" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
                '<i class="material-icons">flag</i>' +
                '</a>' +
                '<a style="color: #777; margin-right: 5px;" data-toggle="modal" data-target="#' + post.tempo + 'comentario" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
                '<i class="material-icons">send</i>' +
                '</a>' +
                '  </div>' +
                '</div>'

                // juntando div que ira portar o container da noticia ao doc html
                var div = document.createElement('div')
                div.innerHTML = html
                div.classList.add('elemento')

                // passando os valores
                var imagemPerfil = div.getElementsByClassName('imagemPerfil')[0]

                // This can be downloaded directly:
                var xhrImgPerfil = new XMLHttpRequest()
                xhrImgPerfil.responseType = 'blob'
                xhrImgPerfil.onload = function (event) {
                  var blob = xhrImgPerfil.response
                  loadImage(
                    blob,
                    function (img) {
                      $(img).css('width', '50px')
                      $(img).css('height', '50px')
                      $(img).css('border-radius', '25px')
                      $(img).css('margin', '10px')
                      imagemPerfil.appendChild(img)
                    }, {
                      maxWidth: 500,
                      maxHeight: 500,
                      canvas: true,
                      pixelRatio: window.devicePixelRatio,
                      downsamplingRatio: 0.5,
                      orientation: true,
                      maxMetaDataSize: 262144,
                      disableImageHead: false
                    }
                  )
                }
                xhrImgPerfil.open('GET', post.perfil, true)
                xhrImgPerfil.send()

                div.getElementsByClassName('nomeUser')[0].innerText = post.nome

                div.getElementsByClassName('descricao-mural')[0].innerText = post.descricao
                div.getElementsByClassName('titulo-mural')[0].innerText = post.titulo
                if (post.url != null) {
                  var myImage = div.getElementsByClassName('imagem-teste')[0]

                  // This can be downloaded directly:
                  var xhr = new XMLHttpRequest()
                  xhr.responseType = 'blob'
                  xhr.onload = function (event) {
                    var blob = xhr.response
                    loadImage(
                      blob,
                      function (img) {
                        $(img).css('width', '100%')
                        $(img).css('max-height', '600px')
                        $(img).addClass('img-fluid')
                        myImage.appendChild(img)
                      }, {
                        maxWidth: 500,
                        maxHeight: 500,
                        canvas: true,
                        pixelRatio: window.devicePixelRatio,
                        downsamplingRatio: 0.5,
                        orientation: true,
                        maxMetaDataSize: 262144,
                        disableImageHead: false
                      }
                    )
                  }
                  xhr.open('GET', post.url, true)
                  xhr.send()
                } else {
                  div.getElementsByClassName('imagem-mural')[0].classList.add('display-none')
                }
                document.getElementById('container-novo-post').appendChild(div)
                // div.getElementsByClassName('usuario')[0].innerText = 'Publicado por ' + nomeUsuario;
            }
        })
        } else {
          // definindo o escopo da noticia em html e utilizando classes bootstrap
          var html =
            '<div class="mdl-card card-shadow col-md-6 card-mural">' +
            '<div class="card-header">' +
              '<div class="row">' +
                '<div class="imagemPerfil"></div> ' +
                '<div class="nomeUser"></div>' +
              '</div>' +
            '</div>' +
            '<div class="mdl-card__media imagem-teste">' +
            '</div>' +
            '<div class="mdl-card__title">' +
            '<h2 class="mdl-card__title-text titulo-mural"></h2>' +
            '</div>' +
            '<div class="mdl-card__supporting-text descricao-mural"></div>' +
            '<div class="mdl-card__actions mdl-card--border">' +
            '<a style="color: #777;" id="like' + post.tempo + '" onclick="likePost(' + post.tempo + ')" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
            '<i class="material-icons">favorite</i>' +
            '</a>' +
            '<span id="likes' + post.tempo + '" class="countLikes"></span>' +
            '<a style="color: #777; margin-right: 5px;" data-toggle="modal" data-target="#' + post.tempo + 'denuncia" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
            '<i class="material-icons">flag</i>' +
            '</a>' +
            '<a style="color: #777; margin-right: 5px;" data-toggle="modal" data-target="#' + post.tempo + 'comentario" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
            '<i class="material-icons">send</i>' +
            '</a>' +
            '  </div>' +
            '</div>'

            // juntando div que ira portar o container da noticia ao doc html
            var div = document.createElement('div')
            div.innerHTML = html
            div.classList.add('elemento')

            // passando os valores

            var imagemPerfil = div.getElementsByClassName('imagemPerfil')[0]

            // This can be downloaded directly:
            var xhrImgPerfil = new XMLHttpRequest()
            xhrImgPerfil.responseType = 'blob'
            xhrImgPerfil.onload = function (event) {
              var blob = xhrImgPerfil.response
              loadImage(
                blob,
                function (img) {
                  $(img).css('width', '50px')
                  $(img).css('height', '50px')
                  $(img).css('border-radius', '25px')
                  $(img).css('margin', '10px')
                  imagemPerfil.appendChild(img)
                }, {
                  maxWidth: 500,
                  maxHeight: 500,
                  canvas: true,
                  pixelRatio: window.devicePixelRatio,
                  downsamplingRatio: 0.5,
                  orientation: true,
                  maxMetaDataSize: 262144,
                  disableImageHead: false
                }
              )
            }
            xhrImgPerfil.open('GET', post.perfil, true)
            xhrImgPerfil.send()

            div.getElementsByClassName('nomeUser')[0].innerText = post.nome            
            div.getElementsByClassName('descricao-mural')[0].innerText = post.descricao
            div.getElementsByClassName('titulo-mural')[0].innerText = post.titulo
            if (post.url != null) {
              var myImage = div.getElementsByClassName('imagem-teste')[0]

              // This can be downloaded directly:
              var xhr = new XMLHttpRequest()
              xhr.responseType = 'blob'
              xhr.onload = function (event) {
                var blob = xhr.response
                loadImage(
                  blob,
                  function (img) {
                    $(img).css('width', '100%')
                    $(img).css('max-height', '600px')
                    $(img).addClass('img-fluid')
                    myImage.appendChild(img)
                  }, {
                    maxWidth: 500,
                    maxHeight: 500,
                    canvas: true,
                    pixelRatio: window.devicePixelRatio,
                    downsamplingRatio: 0.5,
                    orientation: true,
                    maxMetaDataSize: 262144,
                    disableImageHead: false
                  }
                )
              }
              xhr.open('GET', post.url, true)
              xhr.send()
            } else {
              div.getElementsByClassName('imagem-mural')[0].classList.add('display-none')
            }
            document.getElementById('container-novo-post').appendChild(div)
        }

        // Comentarios
        rootRef.child('Usuarios/' + post.id).on('value', function(usuario) {

          var nomeUserDestino = usuario.val().nomeCompleto

          // criando modal Envia Comentário
          var modalEnviaComentario =
          '<div class="modal fade" id="' + post.tempo + 'comentario" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
            '<div class="modal-dialog" role="document">' +
              '<div class="modal-content">' +
                '<div class="modal-header" style="padding-top: 0;">' +
                  '<h5 class="modal-title" id="exampleModalLabel">Enviar Comentário</h5>' +
                  '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                  '</button>' +
                '</div>' +
                '<div class="modal-body" style="color: #777">' +
                  '<h6 style="margin-bottom: 0;">Tem alguma coisa a dizer sobre o post "' + post.titulo + '"?</h6> <br>' +

                  '<form>' +
                  '<div class="form-group">' +
                    '<label for="recipient-name" class="col-form-label">Destinatário:</label>' +
                    '<input type="text" class="form-control" value="' + nomeUserDestino + '" disabled>' +
                  '</div>' +
                  '<div class="form-group">' +
                    '<label for="message-text" class="col-form-label">Mensagem:</label>' +
                    '<textarea rows="5" class="form-control" id="' + post.tempo + '_mensagem"></textarea>' +
                  '</div>' +
                '</form>' +

                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
                  '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="enviarComentario(' + post.tempo + ')">Enviar Mensagem</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'

          // Integrando modalEngano à pagina
          var divModal = document.createElement('div')
          divModal.innerHTML = modalEnviaComentario
          document.querySelector('body').appendChild(divModal)
        })

        // Denuncia 
        var modalDenuncia =
        '<div class="modal fade" id="' + post.tempo + 'denuncia" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
          '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
              '<div class="modal-header" style="padding-top: 0;">' +
                '<h5 class="modal-title" id="exampleModalLabel">Denunciar</h5>' +
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                  '<span aria-hidden="true">&times;</span>' +
                '</button>' +
              '</div>' +
              '<div class="modal-body" style="color: #777">' +
                '<h6 style="margin-bottom: 0;">Qual o motivo de você estar denunciando essa publicação?</h6> <br>' +

              '<form>' +

                '<div class="form-group">' +
                  '<label class="mdl-radio opcoes-notificacao mdl-js-radio mdl-js-ripple-effect" for="' + post.tempo + '_option1">' +
                  '<input type="radio" id="' + post.tempo + '_option1" class="mdl-radio__button" name="options" value="1">' +
                  '<span class="mdl-radio__label span-denuncia-mural">É irritante ou desinteressante</span>' +
                '</div>' +

                '<div class="form-group">' +
                  '<label class="mdl-radio opcoes-notificacao mdl-js-radio mdl-js-ripple-effect" for="' + post.tempo + '_option2">' +
                  '<input type="radio" id="' + post.tempo + '_option2" class="mdl-radio__button" name="options" value="2">' +
                  '<span class="mdl-radio__label span-denuncia-mural">Estou nessa foto e não gosto dela</span>' +
                '</div>' +

                '<div class="form-group">' +
                  '<label class="mdl-radio opcoes-notificacao mdl-js-radio mdl-js-ripple-effect" for="' + post.tempo + '_option3">' +
                  '<input type="radio" id="' + post.tempo + '_option3" class="mdl-radio__button" name="options" value="3">' +
                  '<span class="mdl-radio__label span-denuncia-mural">Acredito que não deveria estar no Mural</span>' +
                '</div>' +

                '<div class="form-group">' +
                  '<label class="mdl-radio opcoes-notificacao mdl-js-radio mdl-js-ripple-effect" for="' + post.tempo + '_option4">' +
                  '<input type="radio" id="' + post.tempo + '_option4" class="mdl-radio__button" name="options" value="4">' +
                  '<span class="mdl-radio__label span-denuncia-mural">É spam</span>' +
                '</div>' +
              
              '</form>' +

              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" data-dismiss="modal"> Fechar</button>' +
                '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="denunciarPost(' + post.tempo + ')">Denunciar</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // Integrando modalEngano à pagina
        var divModal = document.createElement('div')
        divModal.innerHTML = modalDenuncia
        document.querySelector('body').appendChild(divModal)
        
        // conta likes do post
        countCurtidas(post.tempo)

      })

    })
  })
}

// funcao LIKE
function likePost (id) {
  var userId = firebase.auth().currentUser.uid
  
  rootRef.child('Posts').orderByChild('tempo').equalTo(id)
  .once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var chavePost = childSnapshot.key

      //verificando status curtida post 
      rootRef.child('CurtidasPosts/' + userId + '/' + chavePost)
      .once('value', function(snapshot) {
        if (snapshot.exists()) {
          snapshot.forEach(function(childSnapshot) {
            var status = childSnapshot.val()
            if (status == 'Unliked') {
              $('#like' + id).css('color', '#d9534f')            
              var postData = {
                status: 'Liked'
              }

              var updates = {}
              updates['/CurtidasPosts/' + userId + '/' + chavePost] = postData
              firebase.database().ref().update(updates)

            } else {
              $('#like' + id).css('color', '#777')            
              var postData = {
                status: 'Unliked'
              }

              var updates = {}
              updates['/CurtidasPosts/' + userId + '/' + chavePost] = postData
              firebase.database().ref().update(updates)

            }
          })
        } else {
          $('#like' + id).css('color', '#d9534f')            
          var postData = {
            status: 'Liked'
          }

          var updates = {}
          updates['/CurtidasPosts/' + userId + '/' + chavePost] = postData
          firebase.database().ref().update(updates)

        }  
      })
     
    })
  })

  countCurtidas(id)
}

// funcao conta curtidas post
function countCurtidas (tempo) {

  var qtdCurtidas = 0

  // pegando key post
  rootRef.child('Posts').orderByChild('tempo').equalTo(tempo)
  .on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var key = childSnapshot.key

      // pegando key usuarios
      rootRef.child('Usuarios').on('value', function(usuarios) {
        usuarios.forEach(function(dadosUsuario) {
          var userKey = dadosUsuario.key

          // contando curtidas
          rootRef.child('CurtidasPosts/' + userKey + '/' + key)
          .on('value', function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              var status = childSnapshot.val()
              if (status == 'Liked') {
                qtdCurtidas++
                $('#likes' + tempo).text(qtdCurtidas)
              }  
            })
          })
        })
      })
    })

    if (qtdCurtidas == 0) {
      $('#likes' + tempo).text('0')
    }
  })

  
  
}

// funcao denuncia post
function denunciarPost (tempo) {
  var denuncia = $('#' + tempo + '_txtDenuncia').val()
  if (!denuncia) {
    var notification = document.querySelector('#toast-informacao')
    var data = {
      message: 'Denúncia não concluída com êxito!',
      actionText: 'Undo',
      timeout: 5000
    }
    notification.MaterialSnackbar.showSnackbar(data)
  } else {
    rootRef.child('Posts').orderByChild('tempo').equalTo(tempo)
    .once('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var post = childSnapshot.val()
        var postId = childSnapshot.key
        var userRemetente = firebase.auth().currentUser.uid

        var denunciaKey = firebase.database().ref('Denuncias-Mural/').push().key
        var denunciaData = {
          denuncia: denuncia,
          remetente: userRemetente,
          post: postId,
          tempo: tempoAtual('mili')
        }

        // enviando mensagem
        var updates = {}
        updates['Denuncias-Mural/' + userRemetente + '/' + denunciaKey] = denunciaData
        firebase.database().ref().update(updates)

      })
    })
  }

  $('#' + tempo + 'denuncia').modal('hide')
  $('#' + tempo + '_txtDenuncia').val('')
}

// funcao envia comentario
function enviarComentario (tempo) {
  var mensagem = $('#' + tempo + '_mensagem').val()
  if (!mensagem) {
    var notification = document.querySelector('#toast-informacao')
    var data = {
      message: 'Mensagem não enviada!',
      actionText: 'Undo',
      timeout: 5000
    }
    notification.MaterialSnackbar.showSnackbar(data)
  } else {
    rootRef.child('Posts').orderByChild('tempo').equalTo(tempo)
    .once('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var post = childSnapshot.val()
        var postId = childSnapshot.key
        var userDestino = post.id
        var userRemetente = firebase.auth().currentUser.uid

        rootRef.child('Usuarios/' + userRemetente).once('value', function(dadosUsuario) {
          var nome = dadosUsuario.val().nomeCompleto
          var mensagemKey = firebase.database().ref('Mensagem-Mural/').push().key
          var mensagemData = {
            mensagem: mensagem,
            remetente: userRemetente,
            post: postId,
            tempo: tempoAtual('mili'),
            nome: nome
          }
  
          // enviando mensagem
          var updates = {}
          updates['Mensagem-Mural/' + userDestino + '/' + mensagemKey] = mensagemData
          firebase.database().ref().update(updates)
        })

      })
    })
  }

  $('#' + tempo + 'comentario').modal('hide')
  $('#' + tempo + '_mensagem').val('')
}

// funcao que permite ao usuario deletar eventos previamente cadastrados
function deletaPublicacao (tempo) {
  var userId = firebase.auth().currentUser.uid
  rootRef.child('Usuario-Posts/' + userId).orderByChild('tempo').equalTo(tempo).on('value', function (snap) {
    var publicacao = snap.val()
    var keys = Object.keys(publicacao)
    rootRef.child('Usuario-Posts/' + userId + '/' + keys[0]).remove()
    rootRef.child('Posts/' + keys[0]).remove()
  })
} 

// funcao carrega msgs mural
function chamaMensagens () {
  var userId = firebase.auth().currentUser.uid

  rootRef.child('Mensagem-Mural/' + userId).on('value', function (snapshot) {

    $('#container-msgs-mural').empty()

    var novaMsg = snapshot.val()
    var keys = Object.keys(novaMsg)
    var currentRow
    var i = 0

    snapshot.forEach(function (childSnapshot) {
      var currentObject = childSnapshot.val()
      if (i < keys.length) {
        if (i % 4 === 0) {
          currentRow = document.createElement('div')
          currentRow.classList.add('rowNoticia')
          $(currentRow).addClass('row')
          $('#container-msgs-mural').append(currentRow)
        }

        var tempo = currentObject.tempo

        // definindo o escopo da noticia em html e utilizando classes bootstrap
        var html =
          '<div class="mdl-card__title container-titulo">' +
            '<h3 class="mdl-card__title-text titulo text-center"></h3>' +
          '</div>' +
          '<div class="mdl-card__supporting-text">' + 
            '<p> Mensagem referente ao post "<span class="post"></span>" </p>' +
            '<p class="mensagem"></p>' +
          '</div>' +
          '<div class="mdl-card--border">' +
            '' +
          '</div>'

        // juntando div que ira portar o container da noticia ao doc html
        var cardDeck = document.createElement('div')
        cardDeck.classList.add('col-md-3')

        var div = document.createElement('div')
        div.classList.add('mdl-card', 'card-msgs-mural')
        div.innerHTML = html
        
        // passando os valores
        div.getElementsByClassName('mensagem')[0].innerText = currentObject.mensagem
        div.getElementsByClassName('titulo')[0].innerText = currentObject.nome
        
        console.log(currentObject.post)

        rootRef.child('Posts/' + currentObject.post).on('value', function(snapshot) {
          var titulo = snapshot.val().titulo
          
          div.getElementsByClassName('post')[0].innerText = titulo
      })

        cardDeck.append(div)

        $(currentRow).append(cardDeck)
      }
      i++
    })
  })
}

// 
// 
// HISTORICO
// 

//variavel aramazena ultima chave
var lastKeyAguardando 
var firstKeyAguardando

var lastKeyRetiradas
var firstKeyRetiradas

var lastKeyEnganos
var firstKeyEnganos

// verifica se tem mais que 10 registros no bd para gerar os btn prox
var temMais = false

// mostrar/esconder container nova notificacao
var dialogNotificacao = document.querySelector('#dialog-notificacao')
var showDialogNotificacao = document.querySelector('#show-dialog-notificacao')

showDialogNotificacao.addEventListener('click', function () {
  if (!('showModal' in dialogNotificacao)) {
    dialogPolyfill.registerDialog(dialogNotificacao)
  }
  dialogNotificacao.showModal()
  $('html').css('overflow', 'hidden')
})
dialogNotificacao.querySelector('.close').addEventListener('click', function () {
  $('#inputError').hide()
  $('#campo-visita').hide()
  $('#btnProximo').show()
  $('#btnEnviar').hide()
  $('#campos-inicio').show()
  $('#campos-proximo').hide()
  $('#bloco').val('')
  $('#apt').val('')
  $('#moradores').empty()

  dialogNotificacao.close()
})
dialogNotificacao.querySelector('.ativaCampoVisita').addEventListener('click', function () {
  $('#campo-visita').show()
})

function chamaListaNomes (usuarios) {
  var options = []

  for (var i = 0; i < usuarios.length; i++) {
    rootRef.child('Usuarios/' + usuarios[i]).on('value', function (snapshot) {
      var dados = snapshot.val()

      var option = document.createElement('option')
      option.classList.add('nome-completo')

      option.value = dados.nomeCompleto
      option.innerText = dados.nomeCompleto

      options.push(option)
    })
    for (var j = 0; j < options.length; j++) {
      document.getElementById('moradores').appendChild(options[i])
    }
  }
}

// altera txt inserido no campo em CAPSLOCK
$('#bloco').on('keyup', function () {
  var valor = document.getElementById('bloco')
  var novoTexto = valor.value.toUpperCase()
  valor.value = novoTexto
})

// valida e mostra mais informacoes
$('#btnProximo').on('click', function () {
  var usuarioDestino = []
  var bloco = $('#bloco').val()
  var apt = $('#apt').val()
  var temBloco = false

  rootRef.child('Usuarios').orderByChild('bloco').equalTo(bloco).on('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var usuarioDestinoId = childSnapshot.key
      var aptAtual = childSnapshot.val().apartamento
      if (aptAtual === apt) {
        usuarioDestino.push(usuarioDestinoId)
      }

      temBloco = true
    })

    if (temBloco === false) {
      var notification = document.querySelector('#toast-informacao')
      var data = {
        message: 'Bloco ou Apartamento Inválidos',
        actionText: 'Undo',
        timeout: 5000
      }
      notification.MaterialSnackbar.showSnackbar(data)
    } else {
      $('#btnProximo').hide()
      $('#btnEnviar').show()
      $('#campos-inicio').hide()
      $('#campos-proximo').show()
      chamaListaNomes(usuarioDestino)
    }
  })
})

// Enviar notificação
$('#btnEnviar').on('click', function () {

  var nomeVisita
  var userId = firebase.auth().currentUser.uid
  var nomeCompleto = $('#moradores').val()
  var msgKey = database.ref('Mensagens').push().key
  var funcionario
  var userKey

  var dataExata = tempoAtual('exata')
  var dataCompacta = tempoAtual('normal')
  var tempo = tempoAtual('mili')


  if (document.getElementById('motivo1').checked) {
    motivo = 'Encomenda'
    nomeVisita = 'null'
  } else if (document.getElementById('motivo2').checked) {
    motivo = 'Carta'
    nomeVisita = 'null'
  } else if (document.getElementById('motivo3').checked) {
    motivo = 'Conta'
    nomeVisita = 'null'
  } else if (document.getElementById('motivo4').checked) {
    motivo = 'Visita'
    $('#campo-visita').show()
    nomeVisita = $('#visita').val()
  }

  rootRef.child('Usuarios').orderByChild('nomeCompleto').equalTo(nomeCompleto)
  .on('value', function (snap) {
    snap.forEach(function (childSnapshot) {
      userKey = childSnapshot.key
      rootRef.child('Funcionarios/' + userId)
      .on('value', function (snapshot) {
        funcionario = snapshot.val().nomeCompleto

        rootRef.child('Usuarios').orderByChild('nomeCompleto').equalTo(nomeCompleto)
        .once('value').then(function (snapshot) {
          if (snapshot.exists()) {
            snapshot.forEach(function(childSnapshot) {
              const dataNotificacao = {
                dataExata: dataExata,
                dataCompacta: dataCompacta,
                tempo: tempo,
                nome: nomeCompleto,
                motivo: motivo,
                visita: nomeVisita,
                funcionario: funcionario,
                bloco: childSnapshot.val().bloco,
                apartamento: childSnapshot.val().apartamento
              }

              // limpando e atualizando banco de dados
              $('#notificacoes-aguardando').empty()
              var updates = {}
              updates['/Mensagens/Aguardando/' + msgKey] = dataNotificacao
              updates['/Mensagens/' + userKey + '/' + msgKey] = dataNotificacao
              firebase.database().ref().update(updates)

              $('#campo-visita').hide()
              $('#btnProximo').show()
              $('#btnEnviar').hide()
              $('#campos-inicio').show()
              $('#campos-proximo').hide()
              $('#bloco').val('')
              $('#apt').val('')
              $('#moradores').empty()

              // fechando e voltando ao normal
              dialogNotificacao.close()

              var notification = document.querySelector('#toast-informacao')
              var data = {
                message: 'Notificação enviada com sucesso',
                actionText: 'Undo',
                timeout: 5000
              }
              notification.MaterialSnackbar.showSnackbar(data)
            })  
          } else {
            $('#inputError').show()
            $('#campo-visita').hide()
            document.getElementById('moradores').focus()
          }
        })
      })
    })
  })
})

// funcao responsavel por chamar o historico de mensagens enviadas pelo funcionario papra os moradores
function chamaHistorico (caso) {
  var userId = firebase.auth().currentUser.uid  

    rootRef.child('Funcionarios/' + userId).on('value', function (snapshot) {
      if (caso === 1) {
        rootRef.child('/Mensagens/Aguardando/').orderByChild('tempo')
        .limitToFirst(1)
        .on('value', function (snap) {
          snap.forEach(function(childSnap) {
            // latestKey = childSnap.key
            lastKeyAguardando = childSnap.val().tempo
          })
        })
        chamaLevaHistoricoSeguinte(lastKeyAguardando, 1) 
        // Chamando função que vai trazer apenas dez notificações partindo da ultima chave
        // Passando como parametro o status das notificacoes que serão buscadas
        // 1 para aguardando
        // 2 para retiradas
        // 3 para enganos  
        
        rootRef.child('/Mensagens/Retiradas/').orderByChild('tempo')
        .limitToFirst(1)
        .on('value', function (snap) {
          snap.forEach(function(childSnap) {
            // latestKey = childSnap.key
            lastKeyRetiradas = childSnap.val().tempo
          })
        })
        chamaLevaHistoricoSeguinte(lastKeyRetiradas, 2)
        
        rootRef.child('/Mensagens/Enganos/').orderByChild('tempo')
        .limitToFirst(1)
        .on('value', function (snap) {
          snap.forEach(function(childSnap) {
            // latestKey = childSnap.key
            lastKeyEnganos = childSnap.val().tempo
          })
        })
        chamaLevaHistoricoSeguinte(lastKeyEnganos, 3)
      } else if (caso === 2) {
        rootRef.child('/Mensagens/Aguardando/').orderByChild('tempo')
        .limitToFirst(1)
        .on('value', function (snap) {
          snap.forEach(function(childSnap) {
            // latestKey = childSnap.key
            lastKeyAguardando = childSnap.val().tempo
          })
        })
        chamaLevaHistoricoSeguinte(lastKeyAguardando, 1)
      } else if (caso === 3) {
        rootRef.child('/Mensagens/Retiradas/').orderByChild('tempo')
        .limitToFirst(1)
        .on('value', function (snap) {
          snap.forEach(function(childSnap) {
            // latestKey = childSnap.key
            lastKeyRetiradas = childSnap.val().tempo
          })
        })
        chamaLevaHistoricoSeguinte(lastKeyRetiradas, 2)
      } else {
        rootRef.child('/Mensagens/Enganos/').orderByChild('tempo')
        .limitToFirst(1)
        .on('value', function (snap) {
          snap.forEach(function(childSnap) {
            // latestKey = childSnap.key
            lastKeyEnganos = childSnap.val().tempo
          })
        })
        chamaLevaHistoricoSeguinte(lastKeyEnganos, 3)
      }      
    })   

  textoFim.style.display = 'none'
}

function chamaLevaHistoricoSeguinte(lastKey, caso) {
  var contaPosts = 0

  switch(caso) {
    case 1:
      caso = 'Aguardando'
    break

    case 2:
      caso = 'Retiradas'
    break
    
    case 3:
      caso = 'Enganos'
    break
    
    default:
    break
  }

  rootRef.child('/Mensagens/' + caso + '/').orderByChild('tempo')
  .limitToFirst(10)
  .startAt(lastKey)
  .on('value', function (snap) {
    if (caso === 'Aguardando') {
      $('#notificacoes-aguardando').empty()
    } else if (caso === 'Retiradas') {
      $('#notificacoes-retiradas').empty()
    } else {
      $('#notificacoes-engano').empty()
    }
      snap.forEach(function (childSnapshot) {

      var notificacoes = childSnapshot.val()
      var tempo = notificacoes.tempo

      // pegando primeira chave
      if (contaPosts === 0) {

        if (caso === 'Aguardando') {
          firstKeyAguardando = tempo
          // Navegação entre as páginas
          $('#btn-anterior').empty()

          var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyAguardando + ', 1); liberaBtnAnterior()">Voltar</a>'          
          document.getElementById('btn-anterior').innerHTML = btnAnterior

        } else if (caso === 'Retiradas') {
          firstKeyRetiradas = tempo
          // Navegação entre as páginas
          $('#btn-anterior').empty()

          var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyRetiradas + ', 2); liberaBtnAnterior()">Voltar</a>'          
          document.getElementById('btn-anterior').innerHTML = btnAnterior

        } else {key
          firstKeyEnganos = tempo
          // Navegação entre as páginas
          $('#btn-anterior').empty()

          var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyEnganos + ', 3); liberaBtnAnterior()">Voltar</a>'          
          document.getElementById('btn-anterior').innerHTML = btnAnterior

        }

      }

      var key = childSnapshot.key
      var html

      if (caso === 'Retiradas') {
        // criando o card
        html =
        '<div class="flip-container card-historico" style="margin-top: 3rem; color: white; background-color: #5cb85c">' +
          '<div class="card-block">' +
          '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
          '<hr class="my-4 linha-historico">' +
          '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
          '<hr class="my-4 linha-historico">' +
          '<div class="card-text"> Enviada em <span class="data"></span></div>' +
          '<hr class="my-4 linha-historico">' +
          '<div class="card-text"> Status: <span>Retirada(o)</span></div>' +
          '</div>' +
        '</div>'

        // criando div que vai suportar o card
        var cardRetirada = document.createElement('div')
        cardRetirada.innerHTML = html
        cardRetirada.classList.add('elemento')

        // passando os valores de cada notificacao
        cardRetirada.getElementsByClassName('destinatario')[0].innerText = notificacoes.nome + ' · ' + notificacoes.bloco + '  |  ' + notificacoes.apartamento
        cardRetirada.getElementsByClassName('motivo')[0].innerText = notificacoes.motivo
        cardRetirada.getElementsByClassName('data')[0].innerText = notificacoes.dataExata

        document.getElementById('notificacoes-retiradas').appendChild(cardRetirada)

      } else if(caso === 'Enganos') {
        // criando o card
        html =
        '<div class="flip-container card-historico" style="margin-top: 3rem; color: white; background-color: #d9534f;">' +
          '<div class="card-block">' +
          '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
          '<hr class="my-4 linha-historico">' +
          '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
          '<hr class="my-4 linha-historico">' +
          '<div class="card-text"> Enviada em <span class="data"></span></div>' +
          '<hr class="my-4 linha-historico">' +
          '<div class="card-text"> Status: <span>Engano</span></div>' +
          '</div>' +
        '</div>'

        // criando div que vai suportar o card
        var cardEngano = document.createElement('div')
        cardEngano.innerHTML = html
        cardEngano.classList.add('elemento')

        // passando os valores de cada notificacao
        cardEngano.getElementsByClassName('destinatario')[0].innerText = notificacoes.nome + ' · ' + notificacoes.bloco + '  |  ' + notificacoes.apartamento
        cardEngano.getElementsByClassName('motivo')[0].innerText = notificacoes.motivo
        cardEngano.getElementsByClassName('data')[0].innerText = notificacoes.dataExata

        document.getElementById('notificacoes-engano').appendChild(cardEngano)
      } else {
        // criando modal
        var modalRetirada =
        '<div class="modal fade" id="' + tempo + 'c" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
          '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
              '<div class="modal-header" style="padding-top: 0;">' +
                '<h5 class="modal-title" id="exampleModalLabel">Encomenda Retirada</h5>' +
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                  '<span aria-hidden="true">&times;</span>' +
                '</button>' +
              '</div>' +
              '<div class="modal-body" style="color: #777">' +
                '<h6>Tem certeza que essa encomenda foi retirada na portaria?</h6>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
                '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="encomendaRetirada(' + tempo + ', ' + false + ')">Sim</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // Integrando modal à pagina
        var modalDiv = document.createElement('div')
        modalDiv.innerHTML = modalRetirada
        document.querySelector('body').appendChild(modalDiv)

        // criando modal Engano
        var modalEngano =
        '<div class="modal fade" id="' + tempo + 'e" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
          '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
              '<div class="modal-header" style="padding-top: 0;">' +
                '<h5 class="modal-title" id="exampleModalLabel">Engano</h5>' +
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                  '<span aria-hidden="true">&times;</span>' +
                '</button>' +
              '</div>' +
              '<div class="modal-body" style="color: #777">' +
              '<h6 style="margin-bottom: 0;">Tem certeza que essa notificação foi enviada erroneamente?</h6> <br>' +
                '<h6 style="margin-top: 0;">Uma nova notificação informando o morador sobre a ocorrência será enviada caso você confirme a situação!</h6>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
                '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="engano(' + tempo + ', ' + false + ')">Confirmar</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // Integrando modalEngano à pagina
        var modalDivEngano = document.createElement('div')
        modalDivEngano.innerHTML = modalEngano
        document.querySelector('body').appendChild(modalDivEngano)

        // criando o card
        html =
        '<div id="container_' + tempo + '" class="flip-container card-historico" style="margin-top: 3rem; color: #777;" ontouchstart="this.classList.toggle(' + 'hover' + ');">' +
          '<div class="flipper">' +
            '<div class="front">' +
              '<div class="card-block">' +
                '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
                '<hr class="my-4 linha-historico">' +
                '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
                '<hr class="my-4 linha-historico">' +
                '<div class="card-text"> Enviada em <span class="data"></span></div>' +
                '<hr class="my-4 linha-historico">' +
                '<div class="card-text"> Status: <span>Aguardando</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="back">' +
              '<div class="card-block">' +
                '<div class="container">' +
                  '<div class="row" style="display: flex; justify-content: center; margin-top: 2.5rem;">' +
                    '<button class="btn btn-success btn-status-notificacao btn-confirmar" data-toggle="modal" title="Encomenda Retirada" data-target="#' + tempo + 'c" >' +
                      '<i class="fa fa-check fa-2x" aria-hidden="true"></i>' +
                    '</button>' +
                    '<button class="btn btn-danger btn-status-notificacao btn-engano" data-toggle="modal" title="Engano" data-target="#' + tempo + 'e">' +
                      '<i class="fa fa-times fa-2x" aria-hidden="true"></i>' +
                    '</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // criando div que vai suportar o card
        var div = document.createElement('div')
        div.innerHTML = html
        div.classList.add('elemento')

        // passando os valores de cada notificacao
        div.getElementsByClassName('destinatario')[0].innerText = notificacoes.nome + ' · ' + notificacoes.bloco + '  |  ' + notificacoes.apartamento
        div.getElementsByClassName('motivo')[0].innerText = notificacoes.motivo
        div.getElementsByClassName('data')[0].innerText = notificacoes.dataExata

        document.getElementById('notificacoes-aguardando').appendChild(div)
      }

      contaPosts += 1

      if(contaPosts === 10) {

        if (caso === 'Aguardando') {
          lastKeyAguardando = tempo
          // Navegação entre as páginas
          $('#btn-proximo').empty()

          var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyAguardando + ', 1); liberaBtnAnterior()">Próximo</a>'          
          document.getElementById('btn-proximo').innerHTML = btnProximo

          $('#btn-inicio').empty()

          var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(2)">' +
          '<i class="material-icons">home</i>' +
         '</a>'          
         document.getElementById('btn-inicio').innerHTML = btnHome
        } else if (caso === 'Retiradas') {
          lastKeyRetiradas = tempo
          // Navegação entre as páginas
          $('#btn-proximo').empty()

          var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyRetiradas + ', 2); liberaBtnAnterior()">Próximo</a>'          
          document.getElementById('btn-proximo').innerHTML = btnProximo

          $('#btn-inicio').empty()

          var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(3)">' +
          '<i class="material-icons">home</i>' +
         '</a>'          
         document.getElementById('btn-inicio').innerHTML = btnHome
        } else {
          lastKeyEnganos = tempo
          // Navegação entre as páginas
          $('#btn-proximo').empty()

          var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyEnganos + ', 3); liberaBtnAnterior()">Próximo</a>'          
          document.getElementById('btn-proximo').innerHTML = btnProximo

          $('#btn-inicio').empty()

          var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(4)">' +
          '<i class="material-icons">home</i>' +
          '</a>'          
          document.getElementById('btn-inicio').innerHTML = btnHome
        }

        temMais = true

      } 

    })
  })
}

function chamaLevaHistoricoAnterior(firstKey, caso) {
  var contaPosts = 0

  switch(caso) {
    case 1:
      caso = 'Aguardando'
    break

    case 2:
      caso = 'Retiradas'
    break
    
    case 3:
      caso = 'Enganos'
    break
    
    default:
    break
  }

  rootRef.child('/Mensagens/' + caso + '/').orderByChild('tempo')
  .limitToFirst(10)
  .endAt(firstKey)
  .on('value', function (snap) {
    if (caso === 'Aguardando') {
      $('#notificacoes-aguardando').empty()
    } else if (caso === 'Retiradas') {
      $('#notificacoes-retiradas').empty()
    } else {
      $('#notificacoes-engano').empty()
    }
    snap.forEach(function (childSnapshot) {

      var notificacoes = childSnapshot.val()
      var tempo = notificacoes.tempo

      // pegando primeira chave
      if (contaPosts === 0) {

        if (caso === 'Aguardando') {
          firstKeyAguardando = tempo
          // Navegação entre as páginas
          $('#btn-anterior').empty()

          var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyAguardando + ', 1); liberaBtnAnterior()">Voltar</a>'          
          document.getElementById('btn-anterior').innerHTML = btnAnterior

        } else if (caso === 'Retiradas') {
          firstKeyRetiradas = tempo
          // Navegação entre as páginas
          $('#btn-anterior').empty()

          var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyRetiradas + ', 2); liberaBtnAnterior()">Voltar</a>'          
          document.getElementById('btn-anterior').innerHTML = btnAnterior

        } else {
          firstKeyEnganos = tempo
          // Navegação entre as páginas
          $('#btn-anterior').empty()

          var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyEnganos + ', 3); liberaBtnAnterior()">Voltar</a>'          
          document.getElementById('btn-anterior').innerHTML = btnAnterior

        }

      }

      var key = childSnapshot.key
      var html

      if (caso === 'Retiradas') {
        // criando o card
        html =
        '<div class="flip-container card-historico" style="margin-top: 3rem; color: white; background-color: #5cb85c">' +
          '<div class="card-block">' +
            '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text"> Enviada em <span class="data"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text"> Status: <span>Retirada(o)</span></div>' +
          '</div>' +
        '</div>'

        // criando div que vai suportar o card
        var cardRetirada = document.createElement('div')
        cardRetirada.innerHTML = html
        cardRetirada.classList.add('elemento')

        // passando os valores de cada notificacao
        cardRetirada.getElementsByClassName('destinatario')[0].innerText =  notificacoes.nome + ' · ' + notificacoes.bloco + '  |  ' + notificacoes.apartamento
        cardRetirada.getElementsByClassName('motivo')[0].innerText =  notificacoes.motivo
        cardRetirada.getElementsByClassName('data')[0].innerText =  notificacoes.dataExata

        document.getElementById('notificacoes-retiradas').appendChild(cardRetirada)

      } else if(caso === 'Enganos') {
        // criando o card
        html =
        '<div class="flip-container card-historico" style="margin-top: 3rem; color: white; background-color: #d9534f;">' +
          '<div class="card-block">' +
            '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text"> Enviada em <span class="data"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text"> Status: <span>Engano</span></div>' +
          '</div>' +
        '</div>'

        // criando div que vai suportar o card
        var cardEngano = document.createElement('div')
        cardEngano.innerHTML = html
        cardEngano.classList.add('elemento')

        // passando os valores de cada notificacao
        cardEngano.getElementsByClassName('destinatario')[0].innerText = notificacoes.nome + ' · ' + notificacoes.bloco + '  |  ' + notificacoes.apartamento
        cardEngano.getElementsByClassName('motivo')[0].innerText = notificacoes.motivo
        cardEngano.getElementsByClassName('data')[0].innerText = notificacoes.dataExata

        document.getElementById('notificacoes-engano').appendChild(cardEngano)
      } else {
        // criando modal
        var modalRetirada =
        '<div class="modal fade" id="' + tempo + 'c" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
          '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
              '<div class="modal-header" style="padding-top: 0;">' +
                '<h5 class="modal-title" id="exampleModalLabel">Encomenda Retirada</h5>' +
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                  '<span aria-hidden="true">&times;</span>' +
                '</button>' +
              '</div>' +
              '<div class="modal-body" style="color: #777">' +
                '<h6>Tem certeza que essa encomenda foi retirada na portaria?</h6>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
                '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="encomendaRetirada(' + tempo + ')">Sim</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // Integrando modal à pagina
        var modalDiv = document.createElement('div')
        modalDiv.innerHTML = modalRetirada
        document.querySelector('body').appendChild(modalDiv)

        // criando modal Engano
        var modalEngano =
        '<div class="modal fade" id="' + tempo + 'e" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
          '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
              '<div class="modal-header" style="padding-top: 0;">' +
                '<h5 class="modal-title" id="exampleModalLabel">Engano</h5>' +
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                  '<span aria-hidden="true">&times;</span>' +
                '</button>' +
              '</div>' +
              '<div class="modal-body" style="color: #777">' +
              '<h6 style="margin-bottom: 0;">Tem certeza que essa notificação foi enviada erroneamente?</h6> <br>' +
                '<h6 style="margin-top: 0;">Uma nova notificação informando o morador sobre a ocorrência será enviada caso você confirme a situação!</h6>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
                '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="engano(' + tempo + ')">Confirmar</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // Integrando modalEngano à pagina
        var modalDivEngano = document.createElement('div')
        modalDivEngano.innerHTML = modalEngano
        document.querySelector('body').appendChild(modalDivEngano)

        // criando o card
        html =
        '<div class="flip-container card-historico" style="margin-top: 3rem; color: #777;" ontouchstart="this.classList.toggle(' + 'hover' + ');">' +
          '<div class="flipper">' +
            '<div class="front">' +
              '<div class="card-block">' +
                '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
                '<hr class="my-4 linha-historico">' +
                '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
                '<hr class="my-4 linha-historico">' +
                '<div class="card-text"> Enviada em <span class="data"></span></div>' +
                '<hr class="my-4 linha-historico">' +
                '<div class="card-text"> Status: <span>Aguardando</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="back">' +
              '<div class="card-block">' +
                '<div class="container">' +
                  '<div class="row" style="display: flex; justify-content: center; margin-top: 2.5rem;">' +
                    '<button class="btn btn-success btn-status-notificacao btn-confirmar" data-toggle="modal" title="Encomenda Retirada" data-target="#' + tempo + 'c" >' +
                      '<i class="fa fa-check fa-2x" aria-hidden="true"></i>' +
                    '</button>' +
                    '<button class="btn btn-danger btn-status-notificacao btn-engano" data-toggle="modal" title="Engano" data-target="#' + tempo + 'e">' +
                      '<i class="fa fa-times fa-2x" aria-hidden="true"></i>' +
                    '</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'

        // criando div que vai suportar o card
        var div = document.createElement('div')
        div.innerHTML = html
        div.classList.add('elemento')

        // passando os valores de cada notificacao
        div.getElementsByClassName('destinatario')[0].innerText = notificacoes.nome + ' · ' + notificacoes.bloco + '  |  ' + notificacoes.apartamento
        div.getElementsByClassName('motivo')[0].innerText = notificacoes.motivo
        div.getElementsByClassName('data')[0].innerText = notificacoes.dataExata

        document.getElementById('notificacoes-aguardando').appendChild(div)
      }

      contaPosts += 1
      
      if(contaPosts === 10) {

        if (caso === 'Aguardando') {
          lastKeyAguardando = tempo
          // Navegação entre as páginas
          $('#btn-proximo').empty()

          var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyAguardando + ', 1); liberaBtnAnterior()">Próximo</a>'          
          document.getElementById('btn-proximo').innerHTML = btnProximo

          $('#btn-inicio').empty()

          var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(2)">' +
          '<i class="material-icons">home</i>' +
         '</a>'          
         document.getElementById('btn-inicio').innerHTML = btnHome
        } else if (caso === 'Retiradas') {
          lastKeyRetiradas = tempo
          // Navegação entre as páginas
          $('#btn-proximo').empty()

          var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyRetiradas + ', 2); liberaBtnAnterior()">Próximo</a>'          
          document.getElementById('btn-proximo').innerHTML = btnProximo

          $('#btn-inicio').empty()

          var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(3)">' +
          '<i class="material-icons">home</i>' +
         '</a>'          
         document.getElementById('btn-inicio').innerHTML = btnHome
        } else {
          lastKeyEnganos = tempo
          // Navegação entre as páginas
          $('#btn-proximo').empty()

          var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyEnganos + ', 3); liberaBtnAnterior()">Próximo</a>'          
          document.getElementById('btn-proximo').innerHTML = btnProximo

          $('#btn-inicio').empty()

          var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(4)">' +
          '<i class="material-icons">home</i>' +
          '</a>'          
          document.getElementById('btn-inicio').innerHTML = btnHome
        }

        temMais = true

      } 
    })
  })
}

function liberaBtnAnterior () {
  $('#btn-anterior').removeClass('disabled')
}

$('#mostra-aguardando').on('click', function () {

  if (temMais == true) {
    // chamaLevaHistoricoSeguinte(lastKeyAguardando, 1)
    // Navegação entre as páginas
    var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyAguardando + ', 1); liberaBtnAnterior()">Próximo</a>'

    $('#btn-proximo').empty()
    
    document.getElementById('btn-proximo').innerHTML = btnProximo

    var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyAguardando + ', 1)">Voltar</a>'
    
    $('#btn-anterior').empty()
    
    document.getElementById('btn-anterior').innerHTML = btnAnterior

    $('#btn-inicio').empty()

    var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(2)">' +
    '<i class="material-icons">home</i>' +
    '</a>'          
    document.getElementById('btn-inicio').innerHTML = btnHome
  }  

  $('#notificacoes-aguardando').show()
  $('#notificacoes-engano').hide()
  $('#notificacoes-retiradas').hide()
})

$('#mostra-retiradas').on('click', function () {

  if (temMais == true) {
    // chamaLevaHistoricoSeguinte(lastKeyRetiradas, 2)
    // Navegação entre as páginas
    var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyRetiradas + ', 2); liberaBtnAnterior()">Próximo</a>'

    $('#btn-proximo').empty()  
    
    document.getElementById('btn-proximo').innerHTML = btnProximo

    var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyRetiradas + ', 2)">Voltar</a>'
    
    $('#btn-anterior').empty()
    
    document.getElementById('btn-anterior').innerHTML = btnAnterior

    $('#btn-inicio').empty()

    var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(3)">' +
    '<i class="material-icons">home</i>' +
    '</a>'          
    document.getElementById('btn-inicio').innerHTML = btnHome
  }  

  $('#notificacoes-retiradas').show()
  $('#notificacoes-engano').hide()
  $('#notificacoes-aguardando').hide()
})

$('#mostra-enganos').on('click', function () {

  if (temMais == true) {
    // chamaLevaHistoricoSeguinte(lastKeyEnganos, 3)
    // Navegação entre as páginas
    var btnProximo = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoSeguinte(' + lastKeyEnganos + ', 3); liberaBtnAnterior()">Próximo</a>'
    
    $('#btn-proximo').empty()  
    
    document.getElementById('btn-proximo').innerHTML = btnProximo

    var btnAnterior = '<a href="#topo" class="page-link"' + 'onclick="chamaLevaHistoricoAnterior(' + firstKeyEnganos + ', 3)">Voltar</a>'
    
    $('#btn-anterior').empty()
    
    document.getElementById('btn-anterior').innerHTML = btnAnterior

    $('#btn-inicio').empty()

    var btnHome = '<a href="#topo" class="page-link"' + 'onclick="chamaHistorico(4)">' +
    '<i class="material-icons">home</i>' +
    '</a>'          
    document.getElementById('btn-inicio').innerHTML = btnHome
  }  
  
  $('#notificacoes-engano').show()
  $('#notificacoes-aguardando').hide()
  $('#notificacoes-retiradas').hide()
})

$('#toggle-pesquisa-registro').on('click', function() {
  $('#pesquisaNome').val('')
  $('#pesquisaBloco').val('')
  $('#pesquisaDia').val('')
  $('#pesquisaMes').val('')
  $('#pesquisaAno').val('')
})

$('#btn-pesquisa-registro').on('click', function (e) {
  e.preventDefault()
  $('#btn-pesquisa-registro').empty()

  var search = '<i class="fa fa-search fa-2x" aria-hidden="true"></i>'
  var spinner = '<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>'

  var div = document.createElement('div')
  div.innerHTML = spinner

  $('#btn-pesquisa-registro').append(div)

  var nome = $('#pesquisaNome').val()
  var bloco = $('#pesquisaBloco').val()
  var dia = $('#pesquisaDia').val()
  var mes = $('#pesquisaMes').val()
  var ano = $('#pesquisaAno').val()
  var data

  if ($('#pesquisaDia').val() != '' && $('#pesquisaMes').val() != '' && $('#pesquisaAno').val() != '') {
    data = dia + '/' + mes + '/' + ano
  } else {
    data = ''
  } 

  $('#resultadoPesquisa').empty()

  pesquisaRegistros(nome, bloco, data)  

  setTimeout(function() {    
    $('#btn-pesquisa-registro').empty()
    div.innerHTML = search
    $('#btn-pesquisa-registro').append(div)
    $('#btn-close-collapse').show()
  }, 2500)

})

$('#btn-close-collapse').on('click', function() {
  $('#btn-close-collapse').hide() // escondendo botao
  $('#resultadoPesquisa').empty() // limpando container resultado
  $('#collapsePesquisa').collapse('hide') // fechando collapse

  // limpando campos
  $('#pesquisaNome').val('')
  $('#pesquisaBloco').val('')
  $('#pesquisaDia').val('')
  $('#pesquisaMes').val('')
  $('#pesquisaAno').val('')

  // animação voltar ao topo suave
  $('.mdl-layout__content').animate({
    scrollTop: $('#topo').offset().top
  }, 500);
  return false;
})

function confereNotificacao (status, tipoPesquisa, nome, bloco, data) {
  rootRef.child('/Mensagens/' + status).orderByChild('tempo')
  .once('value', function(snapshot) {
    snapshot.forEach(function (childSnapshot) {          
      var notificacao = childSnapshot.val()

      if (tipoPesquisa == 'nomeBloco') {
        if (notificacao.bloco == bloco && notificacao.nome == nome) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        }  
      } else if (tipoPesquisa == 'nomeData') {
        if (notificacao.dataCompacta == data && notificacao.nome == nome) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        }  
      } else if (tipoPesquisa == 'blocoData') {
        if (notificacao.bloco == bloco && notificacao.dataCompacta == data) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        }  
      } else if (tipoPesquisa == 'nomeBlocoData') {
        if (notificacao.bloco == bloco && notificacao.nome == nome && notificacao.dataCompacta == data) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        }  
      } else if (tipoPesquisa == 'soNome') {
        if (notificacao.nome == nome) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        }   
      } else if (tipoPesquisa == 'soBloco') {
        if (notificacao.bloco == bloco) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        }   
      } else if (tipoPesquisa == 'soData') {
        if (notificacao.dataCompacta == data) {
          if (status == 'Aguardando') {
            return geraContainerAguardando('resultadoPesquisa', notificacao, true)
          } else if (status == 'Retiradas') {
            return geraContainerRetiradas('resultadoPesquisa', notificacao)
          } else if (status == 'Enganos') {
            return geraContainerEnganos('resultadoPesquisa', notificacao)
          }
        } else {
          return geraContainerNoFound()
        } 
      }  

    })
  })
}
// Função que definitivamente pesquisa pelos registros no banco
function pesquisaRegistros (nome, bloco, data) {
  var status
  var i

  for (i = 0; i < 3; i++) {

    switch(i) {
      case 0:
        status = 'Aguardando'

        if (nome && bloco && data == '') { // pesquisando por nome e bloco
          confereNotificacao(status, 'nomeBloco', nome, bloco, data)         
        } else if (nome && data && bloco == '') { // pesquisando por nome e data
          confereNotificacao(status, 'nomeData', nome, bloco, data)
        } else if (bloco && data && nome == '') { // pesquisando por bloco e data
          confereNotificacao(status, 'blocoData', nome, bloco, data)
        } else if (nome && bloco && data) { // pesquisando por tudo
          confereNotificacao(status, 'nomeBlocoData', nome, bloco, data)
        } else if (bloco == '' && data == '' && nome) { // pesquisando por nome
          confereNotificacao(status, 'soNome', nome, bloco, data)
        } else if (nome == '' && data == '' && bloco) { // pesquisando por bloco
          confereNotificacao(status, 'soBloco', nome, bloco, data)
        } else if (nome == '' && bloco == '' && data) { // pesquisando por data
          confereNotificacao(status, 'soData', nome, bloco, data)
        }       
      break
      
      case 1:
        status = 'Retiradas'

        if (nome && bloco && data == '') { // pesquisando por nome e bloco
          confereNotificacao(status, 'nomeBloco', nome, bloco, data)         
        } else if (nome && data && bloco == '') { // pesquisando por nome e data
          confereNotificacao(status, 'nomeData', nome, bloco, data)
        } else if (bloco && data && nome == '') { // pesquisando por bloco e data
          confereNotificacao(status, 'blocoData', nome, bloco, data)
        } else if (nome && bloco && data) { // pesquisando por tudo
          confereNotificacao(status, 'nomeBlocoData', nome, bloco, data)
        } else if (bloco == '' && data == '' && nome) { // pesquisando por nome
          confereNotificacao(status, 'soNome', nome, bloco, data)
        } else if (nome == '' && data == '' && bloco) { // pesquisando por bloco
          confereNotificacao(status, 'soBloco', nome, bloco, data)
        } else if (nome == '' && bloco == '' && data) { // pesquisando por data
          confereNotificacao(status, 'soData', nome, bloco, data)
        }  
      break
      
      case 2:
        status = 'Enganos'

        if (nome && bloco && data == '') { // pesquisando por nome e bloco
          confereNotificacao(status, 'nomeBloco', nome, bloco, data)         
        } else if (nome && data && bloco == '') { // pesquisando por nome e data
          confereNotificacao(status, 'nomeData', nome, bloco, data)
        } else if (bloco && data && nome == '') { // pesquisando por bloco e data
          confereNotificacao(status, 'blocoData', nome, bloco, data)
        } else if (nome && bloco && data) { // pesquisando por tudo
          confereNotificacao(status, 'nomeBlocoData', nome, bloco, data)
        } else if (bloco == '' && data == '' && nome) { // pesquisando por nome
          confereNotificacao(status, 'soNome', nome, bloco, data)
        } else if (nome == '' && data == '' && bloco) { // pesquisando por bloco
          confereNotificacao(status, 'soBloco', nome, bloco, data)
        } else if (nome == '' && bloco == '' && data) { // pesquisando por data
          confereNotificacao(status, 'soData', nome, bloco, data)
        }  
      break  
    }  
    
  }
}

// Função cria container das notificações com status Aguardando
function geraContainerAguardando (container, notificacao, ePesquisa) {

  var tempo = notificacao.tempo

  if (ePesquisa === false) {

    // criando modal
    var modalRetirada =
    '<div class="modal fade" id="' + tempo + 'c" tabindex="-1" role="dialog" aria-hidden="true">' +
      '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
          '<div class="modal-header" style="padding-top: 0;">' +
            '<h5 class="modal-title" id="exampleModalLabel">Encomenda Retirada</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
            '</button>' +
          '</div>' +
          '<div class="modal-body" style="color: #777">' +
            '<h6>Tem certeza que essa encomenda foi retirada na portaria?</h6>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
            '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="encomendaRetirada(' + tempo + ')">Sim</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

    // Integrando modal à pagina
    var modalDivRetirada = document.createElement('div')
    modalDivRetirada.innerHTML = modalRetirada
    document.querySelector('body').appendChild(modalDivRetirada)

    // criando modal Engano
    var modalEngano =
    '<div class="modal fade" id="' + tempo + 'e" tabindex="-1" role="dialog" aria-hidden="true">' +
      '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
          '<div class="modal-header" style="padding-top: 0;">' +
            '<h5 class="modal-title" id="exampleModalLabel">Engano</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
            '</button>' +
          '</div>' +
          '<div class="modal-body" style="color: #777">' +
          '<h6 style="margin-bottom: 0;">Tem certeza que essa notificação foi enviada erroneamente?</h6> <br>' +
            '<h6 style="margin-top: 0;">Uma nova notificação informando o morador sobre a ocorrência será enviada caso você confirme a situação!</h6>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
            '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="engano(' + tempo + ')">Confirmar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

    // Integrando modalEngano à pagina
    var modalDivEngano = document.createElement('div')
    modalDivEngano.innerHTML = modalEngano
    document.querySelector('body').appendChild(modalDivEngano)

    // criando o card
    var html =
    '<div class="flip-container card-historico" style="margin-top: 3rem; color: #777;" ontouchstart="this.classList.toggle(' + 'hover' + ');">' +
      '<div class="flipper">' +
        '<div class="front">' +
          '<div class="card-block">' +
            '<div class="card-text destinatario"></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text motivo"></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text data"></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text"> Status: Aguardando</div>' +
          '</div>' +
        '</div>' +
        '<div class="back">' +
          '<div class="card-block">' +
            '<div class="container">' +
              '<div class="row" style="display: flex; justify-content: center; margin-top: 2.5rem;">' +
                '<button class="btn btn-success btn-status-notificacao btn-confirmar" data-toggle="modal" title="Encomenda Retirada" data-target="#' + tempo + 'c" >' +
                  '<i class="fa fa-check fa-2x" aria-hidden="true"></i>' +
                '</button>' +
                '<button class="btn btn-danger btn-status-notificacao btn-engano" data-toggle="modal" title="Engano" data-target="#' + tempo + 'e">' +
                  '<i class="fa fa-times fa-2x" aria-hidden="true"></i>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

    // criando div que vai suportar o card
    var div = document.createElement('div')
    div.innerHTML = html
    div.classList.add('elemento')

    // passando os valores de cada notificacao
    div.getElementsByClassName('destinatario')[0].innerText = 'Enviada para ' + notificacao.nome + ' · ' + notificacao.bloco + '  |  ' + notificacao.apartamento
    div.getElementsByClassName('motivo')[0].innerText = 'Motivo do envio: ' + notificacao.motivo
    div.getElementsByClassName('data')[0].innerText = 'Enviada em ' + notificacao.dataExata

    document.getElementById(container).appendChild(div)
  } else {
    // criando modal
    var modalRetirada =
    '<div class="modal fade" id="' + tempo + 'cp" tabindex="-1" role="dialog" aria-hidden="true">' +
      '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
          '<div class="modal-header" style="padding-top: 0;">' +
            '<h5 class="modal-title" id="exampleModalLabel">Encomenda Retirada</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
            '</button>' +
          '</div>' +
          '<div class="modal-body" style="color: #777">' +
            '<h6>Tem certeza que essa encomenda foi retirada na portaria?</h6>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
            '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="encomendaRetirada(' + tempo + ', ' + true + ')">Sim</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

    // Integrando modal à pagina
    var modalDivRetirada = document.createElement('div')
    modalDivRetirada.innerHTML = modalRetirada
    document.querySelector('body').appendChild(modalDivRetirada)

    // criando modal Engano
    var modalEngano =
    '<div class="modal fade" id="' + tempo + 'ep" tabindex="-1" role="dialog" aria-hidden="true">' +
      '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
          '<div class="modal-header" style="padding-top: 0;">' +
            '<h5 class="modal-title" id="exampleModalLabel">Engano</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
            '</button>' +
          '</div>' +
          '<div class="modal-body" style="color: #777">' +
          '<h6 style="margin-bottom: 0;">Tem certeza que essa notificação foi enviada erroneamente?</h6> <br>' +
            '<h6 style="margin-top: 0;">Uma nova notificação informando o morador sobre a ocorrência será enviada caso você confirme a situação!</h6>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">Não, Fechar</button>' +
            '<button type="button" class="btn btn-warning btn-confirmar-status" onclick="engano(' + tempo + ', ' + true + ')">Confirmar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

    // Integrando modalEngano à pagina
    var modalDivEngano = document.createElement('div')
    modalDivEngano.innerHTML = modalEngano
    document.querySelector('body').appendChild(modalDivEngano)

    // criando o card
    var html =
    '<div class="flip-container card-historico" style="margin-top: 3rem; color: #777;" ontouchstart="this.classList.toggle(' + 'hover' + ');">' +
      '<div class="flipper">' +
        '<div class="front">' +
          '<div class="card-block">' +
            '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text">Enviada em <span class="data"></span></div>' +
            '<hr class="my-4 linha-historico">' +
            '<div class="card-text"> Status: Aguardando</div>' +
          '</div>' +
        '</div>' +
        '<div class="back">' +
          '<div class="card-block">' +
            '<div class="container">' +
              '<div class="row" style="display: flex; justify-content: center; margin-top: 2.5rem;">' +
                '<button type="button" class="btn btn-success btn-status-notificacao btn-confirmar" data-toggle="modal" title="Encomenda Retirada" data-target="#' + tempo + 'cp" >' +
                  '<i class="fa fa-check fa-2x" aria-hidden="true"></i>' +
                '</button>' +
                '<button type="button" class="btn btn-danger btn-status-notificacao btn-engano" data-toggle="modal" title="Engano" data-target="#' + tempo + 'ep">' +
                  '<i class="fa fa-times fa-2x" aria-hidden="true"></i>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'

    // criando div que vai suportar o card
    var div = document.createElement('div')
    div.innerHTML = html
    div.classList.add('elemento')

    // passando os valores de cada notificacao
    div.getElementsByClassName('destinatario')[0].innerText = notificacao.nome + ' · ' + notificacao.bloco + '  |  ' + notificacao.apartamento
    div.getElementsByClassName('motivo')[0].innerText = notificacao.motivo
    div.getElementsByClassName('data')[0].innerText = notificacao.dataExata

    document.getElementById(container).appendChild(div)
  }  
}

// Função cria container das notificações com status Retirada
function geraContainerRetiradas (container, notificacao) {
  // criando o card
  var html =
  '<div class="flip-container card-historico" style="margin-top: 3rem; color: white; background-color: #5cb85c">' +
    '<div class="card-block">' +
      '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
      '<hr class="my-4 linha-historico">' +
      '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
      '<hr class="my-4 linha-historico">' +
      '<div class="card-text">Enviada em <span class="data"></span></div>' +
      '<hr class="my-4 linha-historico">' +
      '<div class="card-text"> Status: Retirada</div>' +
    '</div>' +
  '</div>'

  // criando div que vai suportar o card
  var cardRetirada = document.createElement('div')
  cardRetirada.innerHTML = html
  cardRetirada.classList.add('elemento')

  // passando os valores de cada notificacao
  cardRetirada.getElementsByClassName('destinatario')[0].innerText = notificacao.nome + ' · ' + notificacao.bloco + '  |  ' + notificacao.apartamento
  cardRetirada.getElementsByClassName('motivo')[0].innerText = notificacao.motivo
  cardRetirada.getElementsByClassName('data')[0].innerText = notificacao.dataExata

  document.getElementById(container).appendChild(cardRetirada)
}

// Função cria container das notificações com status Engano
function geraContainerEnganos (container, notificacao) {
  // criando o card
  var html =
  '<div class="flip-container card-historico" style="margin-top: 3rem; color: white; background-color: #d9534f;">' +
    '<div class="card-block">' +
      '<div class="card-text">Enviada para <span class="destinatario"></span></div>' +
      '<hr class="my-4 linha-historico">' +
      '<div class="card-text">Motivo do envio: <span class="motivo"></span></div>' +
      '<hr class="my-4 linha-historico">' +
      '<div class="card-text">Enviada em <span class="data"></span></div>' +
      '<hr class="my-4 linha-historico">' +
      '<div class="card-text"> Status: Engano</div>' +
    '</div>' +
  '</div>'

  // criando div que vai suportar o card
  var cardEngano = document.createElement('div')
  cardEngano.innerHTML = html
  cardEngano.classList.add('elemento')

  // passando os valores de cada notificacao
  cardEngano.getElementsByClassName('destinatario')[0].innerText = notificacao.nome + ' · ' + notificacao.bloco + '  |  ' + notificacao.apartamento
  cardEngano.getElementsByClassName('motivo')[0].innerText = notificacao.motivo
  cardEngano.getElementsByClassName('data')[0].innerText = notificacao.dataExata

  document.getElementById(container).appendChild(cardEngano)
}

// funcao marca encomenda como retirada
function encomendaRetirada (tempo, ePesquisa) {
  rootRef.child('Mensagens/Aguardando/').orderByChild('tempo').equalTo(tempo)
  .on('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var key = childSnapshot.key
      var dados = childSnapshot.val()
      var nome = dados.nome
      var status = {
        status: 'Retirada'
      }
      var dataNotificacao = {
        dataExata: dados.dataExata,
        bloco: dados.bloco,
        apartamento: dados.apartamento,
        dataCompacta: dados.dataCompacta,
        tempo: dados.tempo,
        nome: dados.nome,
        motivo: dados.motivo,
        visita: dados.visita,
        funcionario: dados.funcionario
      }
      var updates = {}
      rootRef.child('Usuarios').orderByChild('nomeCompleto').equalTo(nome)
      .on('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          var userKey = childSnapshot.key
          updates['Mensagens/' + userKey + '/' + key + '/Status'] = status
          updates['Mensagens/Retiradas/' + key] = dataNotificacao
          firebase.database().ref().update(updates)
        })
      })

      // Removendo do banco de dados
      rootRef.child('Mensagens/Aguardando/' + key).remove()
    })
  })

  var notification = document.querySelector('#toast-informacao')
  var data = {
    message: 'Notificação alterada como "Retirada"!',
    actionText: 'Undo',
    timeout: 5000
  }
  notification.MaterialSnackbar.showSnackbar(data)
  if (ePesquisa == false) {
    $('#' + tempo + 'c').modal('hide')
  } else {     
    $('#' + tempo + 'cp').modal('hide')
  }
}

// funcao altera notificacao com o status Engano
function engano (tempo, ePesquisa) {
  rootRef.child('Mensagens/Aguardando/').orderByChild('tempo').equalTo(tempo)
  .on('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var key = childSnapshot.key
      var dados = childSnapshot.val()
      var nome = dados.nome
      var status = {
        status: 'Engano'
      }
      var dataNotificacao = {
        dataExata: dados.dataExata,
        dataCompacta: dados.dataCompacta,
        bloco: dados.bloco,
        apartamento: dados.apartamento,
        tempo: dados.tempo,
        nome: dados.nome,
        motivo: dados.motivo,
        visita: dados.visita,
        funcionario: dados.funcionario
      }
      var updates = {}
      rootRef.child('Usuarios').orderByChild('nomeCompleto').equalTo(nome)
      .on('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          var userKey = childSnapshot.key
          updates['Mensagens/' + userKey + '/' + key + '/Status'] = status
          updates['Mensagens/Enganos/' + key] = dataNotificacao
          firebase.database().ref().update(updates)
        })
      })

      // Removendo do banco de dados
      rootRef.child('Mensagens/Aguardando/' + key).remove()

      var notification = document.querySelector('#toast-informacao')
      var data = {
        message: 'Uma Notificação de Engano foi enviada para o morador ' + nome + '!',
        actionText: 'Undo',
        timeout: 5000
      }
      notification.MaterialSnackbar.showSnackbar(data)
    })
  })
  if (ePesquisa == false) {
    $('#' + tempo + 'e').modal('hide')
  } else {     
    $('#' + tempo + 'ep').modal('hide')
  }
}

// 
// 
// CHEGADA SEGURA
// 

var distance

// funcao mostrar mapa interativo
function iniciarMapa () {
  // API GOOGLE MAPS
  /* eslint-disable */
  const directionsService = new google.maps.DirectionsService()
  /* eslint-disable */
  topazio = new google.maps.LatLng(-22.93064781, -47.05699816)

  map = new google.maps.Map(document.getElementById('mapa'), {
    zoom: 17,
    center: topazio
  })

  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(-22.93064781, -47.05699816),
    draggable: false,
    animation: google.maps.Animation.DROP
  })

  marker.setMap(map)
}

// funcao carregar pontos
function carregaPontos () {
  rootRef.child('ChegadSegura').on('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      if (childSnapshot.val().status === 'false') {
        rootRef.child('ChegadaSegura').remove(function (error) {
          console.log(error)
        })
      }
    })
  })

  var pontosRef = rootRef.child('ChegadaSegura').on('value', function (snapshot) {

    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null)
    }

    // Variaveis que serão populadas para os marcadores
    var nomeUsuario
    var blocoUsuario
    var aptUsuario
    var veiculo
    var imagemPerfil

    snapshot.forEach(function (childSnapshot) {
      var uid = childSnapshot.val().user
      rootRef.child('Usuarios/' + uid).on('value', function (snap) {
        nomeUsuario = snap.val().nomeCompleto
        blocoUsuario = snap.val().bloco
        aptUsuario = snap.val().apartamento
      })
      var veiculoRef = rootRef.child('Usuarios/' + uid + '/Veiculos').on('value', function (snapshot) {
        veiculo = snapshot.val().modelo + ' ' + snapshot.val().cor + ' de placa ' + snapshot.val().placa
      })
      var imagemRef = rootRef.child('Usuarios/' + uid + '/Perfil').on('value', function (snapshot) {
        imagemPerfil = snapshot.val().imagemPerfil
      })

      var contentString =
        '<div>' +
        '<img class="mx-auto d-block rounded-circle" style="width: 80px !important; height: 80px !important;" src="' + imagemPerfil + '" alt=" ' + nomeUsuario + '">' +
        '<h4 class="nomeUser text-center">' + nomeUsuario + '</h4> <br>' +
        '<p style="font-size: 15px; font-weight: bold;">Está a ' + distance + '  do condomínio</p>' +
        '<h6 class="blocoUser"><b> Bloco: </b>' + blocoUsuario + '</h6>' +
        '<h6 class="aptUser"><b>Apartamento: </b>' + aptUsuario + '</h6>' +
        '<h6 class="veiculo"><b>Veículo: </b>' + veiculo + '</h6> <br>' +
        '</div>'

      var infowindow = new google.maps.InfoWindow({
        content: contentString
      })

      var origem = new google.maps.LatLng(childSnapshot.val().latitude, childSnapshot.val().longitude)

      var service = new google.maps.DistanceMatrixService()
      service.getDistanceMatrix({
        origins: [origem],
        destinations: [topazio],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC
      }, callback)

      // criando maker atual
      var marker = new google.maps.Marker({
        position: origem,
        title: nomeUsuario,
        draggable: false,
        animation: google.maps.Animation.DROP
      })

      marker.addListener('click', function () {
        infowindow.open(map, marker)
      })
      if (marker.title != undefined) {
        markers.push(marker) // adicionando o marker atual para o array markers
        marker.setMap(map)
      } else {
        marker.setMap(null)
      }

      if (childSnapshot.val().status === 'false') {
        marker.setMap(null)
        var keys = childSnapshot.key
        rootRef.child('ChegadaSegura/' + keys).remove()
      }

      pegaDistanciaUser(distance, uid)
    })
  })

  if (!pontosRef) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null)
    }
  }
}

function callback (response, status) {
  if (status === 'OK') {
    var origins = response.originAddresses
    var destinations = response.destinationAddresses

    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements
      for (var j = 0; j < results.length; j++) {
        var element = results[j]
        distance = element.distance.text
        duration = element.duration.text
      }
    }
  }
}

// funcao que vai pegar a distancia atual do usuario e verificar se o mesmo está a
// 300m do condomínio, se estiver envia uma notificação para os funcionários
function pegaDistanciaUser (distance, uid) {
  console.log(distance, uid)
  rootRef.child('Usuarios').child(uid).on('value', function (snapshot) {
    const nomeUsuario = snapshot.val().nomeCompleto
    if (distance === '6.0 km' || distance === '5.9 km') {
      data = {
        distancia: distance,
        nome: nomeUsuario,
        user: uid
      }
      var novoMoradorProximoKey = rootRef.child('MoradoresProximos').push().key
      var updates = {}
      updates['MoradoresProximos/' + novoMoradorProximoKey] = data
      firebase.database().ref().update(updates)
    }
  })
}

// 
// 
// ESTATISTICAS
// 

// Load the Visualization API and the corechart package.
google.charts.load('current', {
  'packages': ['corechart']
})

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawChart)

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart () {
  return
}

$('.container-dados').popover({
  trigger: 'focus'
})

$('#est-posts').on('mouseover', function() {
  $('#est-posts').popover()
})

//
//
// ALTERA IMAGEM PERFIL
//

// mostrar/esconder dialog altera imagem perfil
var dialogAlteraImagemPerfil = document.querySelector('#dialog-troca-imagem') // dialog
// pegando links para trocar imagem de perfils
var linksTrocaImagemPerfil = document.getElementsByClassName('troca-imagem') // mostra dialog

// laço que vai atribuir a funcao para ambos os links
for (var i = 0; i < linksTrocaImagemPerfil.length; i++) {
  linksTrocaImagemPerfil[i].addEventListener('click', function () {
    if (!('showModal' in dialogAlteraImagemPerfil)) {
      dialogPolyfill.registerDialog(dialogAlteraImagemPerfil)
    }
    dialogAlteraImagemPerfil.showModal()
    selectedFile = ''
    $('#novaImagemPerfil').empty()
  })
}
dialogAlteraImagemPerfil.querySelector('.close').addEventListener('click', function () {
  dialogAlteraImagemPerfil.close()
  selectedFile = ''
})

// aguarda a alteração do input que permite a seleção de uma nova foto e
// então armazena o arquivo selecionado em uma variavel
$('#imagem-perfil').on('change', function (event) {
  selectedFile = event.target.files[0]
  $('#novaImagemPerfil').empty()

  var loadingImage = loadImage(
    selectedFile,
    function (img) {
      $('#novaImagemPerfil').show()
      $('#arquivoInvalidoPerfil').hide()
      try {
        $(img).addClass('rounded-circle')
        $(img).addClass('d-block')
        $(img).addClass('mx-auto')
        $(img).css('width', '150px')
        $(img).css('height', '150px')
        document.getElementById('novaImagemPerfil').appendChild(img)
      } catch (err) {
        $('#arquivoInvalidoPerfil').show()
        selectedFile = ''
      }
    }, {
      maxWidth: 500,
      maxHeight: 500,
      canvas: true,
      pixelRatio: window.devicePixelRatio,
      downsamplingRatio: 0.5,
      orientation: true,
      maxMetaDataSize: 262144,
      disableImageHead: false
    }
  )
  if (!loadingImage) {
    $('#arquivoInvalidoPerfil').show()
    selectedFile = ''
  }
})

// funcao que altera a imagem de perfil do usuario
// ao alterar a foto, a imagem antiga é automaticamente deletada do banco de dados
$('#btnAlterarImagemPerfil').on('click', function () {
  if (selectedFile === '') {
    $('#sem-imagem').show()
  } else {
    $('.loading-upload').show()
    $('#btnAlterarImagemPerfil').hide()
    // criando referencia no storage
    storageRef = firebase.storage().ref('/perfil-photos/' + selectedFile.name)
    uploadTask = storageRef.put(selectedFile)

    uploadTask.on('state_changed',

      function progress (snapshot) {
        // var percentage = (snapshot.bytesTransferred /
        // snapshot.totalBytes) * 1000;
        // $('#uploader').css({
        //   width: percentage
        // });
      },
      function (error) {

      },
      function () {
        var userId = firebase.auth().currentUser.uid
        var imagens = rootRef.child('/Usuarios/' + userId + '/Perfil/').remove()
        var downloadURL = uploadTask.snapshot.downloadURL
        var imgData = {
          imagemPerfil: downloadURL
        }
        $('#container-noticias').empty()
        var updates = {}
        updates['/Usuarios/' + userId + '/Perfil/'] = imgData
        firebase.database().ref().update(updates)

        dialogAlteraImagemPerfil.close()

        $('.loading-upload').hide()
        $('#btnAlterarImagemPerfil').show()
      })
  }
})

//
//
// ALTERAR SENHA
//

// abre dialog para alterar senha
var dialogNovaSenha = document.querySelector('#dialog-altera-senha') // dialog
var showDialogNovaSenha = document.querySelector('#show-dialog-senha') // button

showDialogNovaSenha.addEventListener('click', function () {
  if (!('showModal' in dialogNovaSenha)) {
    dialogPolyfill.registerDialog(dialogNovaSenha)
  }
  // fixaTela.classList.add('fixed');
  $('html').css('overflow', 'hidden')
  dialogNovaSenha.showModal()
  var status = document.getElementById('status-redefinicao-senha')
  status.innerText = 'Clique em enviar para que seja enviado à você um email de redefinição de senha!'
})
dialogNovaSenha.querySelector('.close').addEventListener('click', function () {
  dialogNovaSenha.close()
  $('#senha-invalida').hide()
})

// funcao altera senha
$('#btnEnviarEmail').on('click', function () {
  var user = firebase.auth().currentUser
  var auth = firebase.auth()
  var emailAddress = user.email
  var status = document.getElementById('status-redefinicao-senha')

  auth.sendPasswordResetEmail(emailAddress).then(function () {
    var notification = document.querySelector('#toast-informacao')
    var data = {
      message: 'Um email de redefinição de senha foi enviado para o seu email. Fique de Olho!',
      actionText: 'Undo',
      timeout: 5000
    }
    notification.MaterialSnackbar.showSnackbar(data)
    dialogNovaSenha.close()
  }, function (error) {
    status.innerText = 'Algo deu errado!'
  })
})

//
//
// EVENTOS
//

// mostrar/esconder dialog novo evento
var dialogNovoEvento = document.querySelector('#dialog-evento') // dialog
var showDialogNovoEvento = document.querySelector('#show-dialog-evento') // button
showDialogNovoEvento.addEventListener('click', function () {
  if (!('showModal' in dialogNovoEvento)) {
    dialogPolyfill.registerDialog(dialogNovoEvento)
  }
  $('#semDados').hide()
  // fixaTela.classList.add('fixed');
  $('html').css('overflow', 'hidden')
  dialogNovoEvento.showModal()
})
dialogNovoEvento.querySelector('.close').addEventListener('click', function () {
  dialogNovoEvento.close()
})

// verificando  se há ou não um evento ja cadastrado na mesma data e local requisitados
$('#btnVerificarEvento').on('click', function () {
  $('#btnVerificarEvento').hide()
  $('#btnMarcarEvento').show()
  var ocupado
  var data = $('#dia-evento').val() + '/' + $('#mes-evento').val() + '/' + $('#ano-evento').val()
  var evento = data + ' ' + $('#local-evento').val()

  if ($('#dia-evento').val() === '' || $('#mes-evento').val() === '' || $('#ano-evento').val() === '' || $('#local-evento').val() === '') {
    $('#semDados').show()
    $('#btnVerificarEvento').show()
    $('#btnMarcarEvento').hide()
  } else {
    rootRef.child('Usuarios').on('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var user = childSnapshot.key
        var eventosRef = rootRef.child('Eventos/' + user).once('value', function(eventos) {
          eventos.forEach(function(eventosChild) {
            var dataLocal = eventosChild.val().data_local
            if (dataLocal == evento) {
              if(ocupado != 1) {
                var notification = document.querySelector('#toast-informacao')
                var data = {
                  message: 'Já existe um evento marcado para esta data! Tente outro dia...',
                  actionText: 'Undo',
                  timeout: 5000
                }
                notification.MaterialSnackbar.showSnackbar(data)
                ocupado == 1

                $('#btnVerificarEvento').show()
                $('#btnMarcarEvento').hide()
              }  
            } 
          })
        })
      })
    })
  }
})

// funcao para marcar um novo evento no bd
$('#btnMarcarEvento').on('click', function () {

  if ($('#nome-evento').val() === '') {
    $('#semDados').show()
  } else {
    var tipo
    if (document.getElementById('publico').checked) {
      tipo = 'Publico'
    } else if (document.getElementById('privado').checked) {
      tipo = 'Privado'
    }
    var eventKey = rootRef.child('Eventos').push().key
    var userId = firebase.auth().currentUser.uid
    var data = $('#dia-evento').val() + '/' + $('#mes-evento').val() + '/' + $('#ano-evento').val()
    var novoEvento = {
      data: data,
      nome: $('#nome-evento').val(),
      local: $('#local-evento').val(),
      data_local: data + ' ' + $('#local-evento').val(),
      tipo:  tipo,
      tempo: tempoAtual('mili'),
      user:  userId
    }
    var updates = {}
    updates['/Eventos/' + userId + '/' + eventKey] = novoEvento
    firebase.database().ref().update(updates)

    $('#dia-evento').val('')
    $('#mes-evento').val('')
    $('#nome-evento').val('')
    $('#local-evento').val('')

    dialogNovoEvento.close()
  }

  var notification = document.querySelector('#toast-informacao')
  var data = {
    message: 'Evento marcado com sucesso! Você será notificado posteriormente',
    actionText: 'Undo',
    timeout: 5000
  }
  notification.MaterialSnackbar.showSnackbar(data)

  $('#btnVerificarEvento').show()
  $('#btnMarcarEvento').hide()
})

// chamando eventos para os porteiros
function chamaEventosPorteiro () {
  $('#container-eventos').empty()
  var usuariosRef = rootRef.child('Usuarios').once('value', function(allUsers) {
    allUsers.forEach(function(user) {
      var userKey = user.key
      rootRef.child('Eventos/' + userKey).orderByChild('tempo').on('value', function (eventos) {
        if (eventos.exists()) {
          var novoEvento = eventos.val()
          var textoEventos = document.getElementById('textoEventos')
          if (!novoEvento) {
            textoEventos.classList.remove('d-block')
            textoEventos.classList.add('display-none')
            var semEvento = document.createElement('h3')
            semEvento.classList.add('titulo-sessao', 'd-block', 'mx-auto')
            semEvento.innerText = 'Você não tem nenhum evento marcado!'
            document.getElementById('container-eventos').append(semEvento)
          } else {
            var currentRow
            var i = 0
            var keys = Object.keys(novoEvento)
      
            textoEventos.classList.add('d-block')
            textoEventos.classList.remove('display-none')

            $('#container-eventos').addClass('col-md-12')
  
      
            var g = 1
      
            eventos.forEach(function (evento) {
              var evento = evento.val()
              if (evento.user === userKey) {
                if (i < keys.length) {
                  if (i % 4 === 0) {
                    currentRow = document.createElement('div')
                    currentRow.classList.add('rowNoticia')
                    $(currentRow).addClass('row')
                    $('#container-eventos').append(currentRow)
                  }
      
                  var html =
                    '<div>' +
                      '<div class="card-header header-eventos" style="background-color: #3fb399;">' +
                        '<div class="nome-evento mx-auto d-block" style="heigth: 100px; padding: 10px;"></div>' +
                      '</div>' +
        
                      '<div class="card-block">' +
                        '<div class="card-text data-evento"></div>' +
                        '<hr class="my-4 linha-evento">' +
                        '<div class="d-flex justify-content-center">' +
                          '<button class="btn-ver-evento" onclick="verEvento(' + evento.tempo + ')">Ver Mais</button>' +
                        '</div>' +
                      '</div>' +
                    '</div>'
      
                  var div = document.createElement('div')
                  if (evento.tipo === 'Publico') {
                    div.classList.add('display-none')
                  } else {
                    div.classList.add('card', 'card-evento', 'text-center')
                    div.style.marginTop = '3rem'
                    div.style.marginBottom = '3rem'
                    div.innerHTML = html
      
                    var cardDeck = document.createElement('div')
                    cardDeck.classList.add('card-deck-evento')
                    cardDeck.classList.add('card-deck')
      
                    var eventos = div.firstChild
      
                    // passando os valores de cada noticia para seu respectivo campo
                    eventos.getElementsByClassName('nome-evento')[0].innerText = evento.nome
                    eventos.getElementsByClassName('data-evento')[0].innerText = evento.data
      
                    cardDeck.append(div)
                    $(currentRow).append(cardDeck)
                  }
      
                  i++
                  g++
                }
              }
            })
          }
        }  
      })
    })
  })
}

// vendo mais informações sobre o evento
function verEvento (tempo) {
  $('#container-eventos-full').empty()
  $('#container-eventos-full').show()
  $('#container-eventos').removeClass('col-md-12')
  $('#container-eventos').addClass('col-md-6')
  $('#container-eventos-full').addClass('col-md-6')

  rootRef.child('Usuarios').once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var userKey = childSnapshot.key
      rootRef.child('Eventos/' + userKey).orderByChild('tempo').equalTo(tempo).on('value', function (snapshot) {       

        snapshot.forEach(function (childSnapshot) {
          var evento = childSnapshot.val()

          var html =
            '<div id="full' + evento.tempo + '">' +
              '<div class="card-header header-eventos" style="background-color: #3fb399;">' +
                '<div class="nome-evento mx-auto d-block" style="heigth: 100px; padding: 10px;"></div>' +
              '</div>' +

              '<div class="card-block">' +
                '<div class="card-text data-evento"></div>' +
                '<hr  class="my-4 linha-evento">' +
                '<div class="row">' +
                  '<div class="col">' +
                    '<div class="img-perfil-user"></div>' +
                  '</div>' +
                  '<div class="col">' +
                    '<div class="nome-user"></div>' +
                    '<p>Apartamento <span class="apt-user"></span> | Bloco <span class="bloco-user"></span></p> <br>' +
                    '<p> RG XXXXXXXX-X </p>' +
                  '</div>' +  
                '</div>' +  
                '<hr class="my-4 linha-evento">' +
                '<p class="text-center">Local: <span class="local-evento"></span></p>' +
                '<hr class="my-4 linha-evento">' +
                '<div class="d-flex justify-content-center">' +
                  '<div class="row">' +
                    '<button class="btn-close" onclick="fechaEventoFull(' + evento.tempo + ')"> Fechar </button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>'

          var div = document.createElement('div')
          if (evento.tipo === 'Publico') {
            div.classList.add('display-none')
          } else {
            div.classList.add('card', 'card-evento', 'text-center')
            div.style.marginTop = '3rem'
            div.style.marginBottom = '3rem'
            div.innerHTML = html

            var cardDeck = document.createElement('div')
            cardDeck.classList.add('card-deck-evento')
            cardDeck.classList.add('card-deck')

            var eventos = div.firstChild

            // passando os valores de cada noticia para seu respectivo campo
            eventos.getElementsByClassName('nome-evento')[0].innerText = evento.nome
            eventos.getElementsByClassName('data-evento')[0].innerText = evento.data
            eventos.getElementsByClassName('local-evento')[0].innerText = evento.local

            // pegando imagem perfil usuario
            rootRef.child('Usuarios/' + userKey + '/Perfil/')
            .once('value', function (snapshot) {
    
              if (snapshot.exists()) {                
    
                var imgPerfil = snapshot.val().imagemPerfil
    
                var imgUserEvento = eventos.getElementsByClassName('img-perfil-user')[0]
    
                // This can be downloaded directly:
                var xhr = new XMLHttpRequest()
                xhr.responseType = 'blob'
                xhr.onload = function (event) {
                  var blob = xhr.response
                  loadImage(
                    blob,
                    function (img) {
                      $(img).css('border-radius', '60px')
                      $(img).css('width', '120px')
                      $(img).css('height', '120px')
                      $(img).addClass('animated fadeIn')
                      imgUserEvento.appendChild(img)
                    }, {
                      maxWidth: 100,
                      maxHeight: 100,
                      canvas: true,
                      pixelRatio: window.devicePixelRatio,
                      downsamplingRatio: 0.5,
                      orientation: true,
                      maxMetaDataSize: 262144,
                      disableImageHead: false
                    }
                  )
                }

                xhr.open('GET', imgPerfil, true)
                xhr.send()
                
              } 
            })

            // pegando nome, apt e bloco user
            rootRef.child('Usuarios/' + userKey).once('value', function(snapshot) {
              var dados = snapshot.val()
              eventos.getElementsByClassName('nome-user')[0].innerText = dados.nomeCompleto
              eventos.getElementsByClassName('bloco-user')[0].innerText = dados.bloco
              eventos.getElementsByClassName('apt-user')[0].innerText = dados.apartamento

            })

            cardDeck.append(div)
            $('#container-eventos-full').append(cardDeck)
          }

          
        })
      })
    }) 
  })
}

function fechaEventoFull (tempo) {
  $('#container-eventos-full').removeClass('col-md-6')
  $('#container-eventos-full').hide()
  $('#container-eventos-full').empty()
  $('#container-eventos').addClass('col-md-12')
  $('#container-eventos').removeClass('col-md-6')
}

// funcao carrega eventos caso haja algum marcado, por enquanto mostra apenas os que forem do usuario
function chamaEventos () {
  var userId = firebase.auth().currentUser.uid
  var eventosMarcadosRef = rootRef.child('Eventos/' + userId).orderByChild('tempo').on('value', function (snapshot) {
    var novoEvento = snapshot.val()
    var textoEventos = document.getElementById('textoEventos')
    if (!novoEvento) {
      textoEventos.classList.remove('d-block')
      textoEventos.classList.add('display-none')
      var semEvento = document.createElement('h3')
      semEvento.classList.add('titulo-sessao', 'd-block', 'mx-auto')
      semEvento.innerText = 'Você não tem nenhum evento marcado!'
      document.getElementById('container-eventos').append(semEvento)
    } else {
      var currentRow
      var i = 0
      var keys = Object.keys(novoEvento)

      textoEventos.classList.add('d-block')
      textoEventos.classList.remove('display-none')

      $('#container-eventos').empty()
      $('#container-eventos').addClass('col-md-12')

      var g = 1

      snapshot.forEach(function (childSnapshot) {
        var evento = childSnapshot.val()
        if (evento.user === userId) {
          if (i < keys.length) {
            if (i % 4 === 0) {
              currentRow = document.createElement('div')
              currentRow.classList.add('rowNoticia')
              $(currentRow).addClass('row')
              $('#container-eventos').append(currentRow)
            }

            var html =
              '<div>' +
              '<div class="card-header header-eventos" style="background-color: #3fb399;">' +
              '<div class="nome-evento mx-auto d-block" style="heigth: 100px; padding: 10px;"></div>' +
              '<div class="btn-group dropup div-deleta-evento">' +
              '<button id="evento' + g + '" class="btn-deleta-evento mdl-button mdl-js-ripple-effect" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
              '<i class="material-icons" style="color: white;">more_vert</i>' +
              '</button>' +
              '<div class="dropdown-menu dropdown-menu-evento">' +
              '<a class="dropdown-item dropdown-item-evento" style="font-size: 15px;" href="#" onclick="deletaEvento(' + evento.tempo + ')"><i style="margin-right: 5px;" class="material-icons">delete</i>Deletar</a>' +
              '</div>' +
              '</div>' +
              '</div>' +

              '<div class="card-block">' +
              '<div class="card-text data-evento"></div>' +
              '<hr  class="my-4 linha-evento">' +
              '<div class="card-text local-evento"></div>' +
              '</div>' +
              '</div>'

            var div = document.createElement('div')
            if (evento.tipo === 'Publico') {
              div.classList.add('display-none')
            } else {
              div.classList.add('card', 'card-evento', 'text-center')
              div.style.marginTop = '3rem'
              div.style.marginBottom = '3rem'
              div.innerHTML = html

              var cardDeck = document.createElement('div')
              cardDeck.classList.add('card-deck-evento')
              cardDeck.classList.add('col-md-3')
              cardDeck.classList.add('card-deck')

              var eventos = div.firstChild

              

              // passando os valores de cada noticia para seu respectivo campo
              eventos.getElementsByClassName('nome-evento')[0].innerText = evento.nome
              eventos.getElementsByClassName('data-evento')[0].innerText = evento.data
              eventos.getElementsByClassName('local-evento')[0].innerText = evento.local

              cardDeck.append(div)
              $(currentRow).append(cardDeck)
            }

            i++
            g++
          }
        }
      })
    }
  })
}

// funcao que chama o ultimo evento adicionado na tela de perfil do usuario
function chamaEventosPerfil () {
  var userId = firebase.auth().currentUser.uid

  // chamando ultimo evento adicionado
  var ultimoEventoRef = rootRef.child('Eventos/' + userId).orderByChild('tempo')
    .limitToLast(1).on('value', function (snapshot) {
      if (!snapshot.val()) {
        $('#container-ultimo-evento').empty()

        $('#status-eventos-perfil').text('Nenhum Evento Marcado!')
        var hr = document.createElement('hr')
        hr.classList.add('my-4')
        document.getElementById('container-ultimo-evento').appendChild(hr)

        var img = document.createElement('img')
        img.src = '../img/logo-sicc-p.png'
        img.id = 'logo-perfil'
        $(img).css('margin-top', '2rem')
        $(img).css('margin-bottom', '2rem')
        $(img).css('cursor', 'pointer')
        $(img).addClass('mx-auto', 'd-block')
        $(img).addClass('d-block')

        document.getElementById('container-ultimo-evento').appendChild(img)

        var girar = true

        // girando logo infinitamente
        $('#logo-perfil').on('click', function () {
          if (girar === true) {
            $('#logo-perfil').addClass('rodando')
            girar = false
          } else if (girar === false) {
            $('#logo-perfil').removeClass('rodando')
            girar = true
          }
        })
      } else {
        $('#status-eventos-perfil').text('Último Evento Marcado')

        $('#container-ultimo-evento').empty()

        var hr = document.createElement('hr')
        hr.classList.add('my-4')
        document.getElementById('container-ultimo-evento').appendChild(hr)

        snapshot.forEach(function (childSnapshot) {
          var evento = childSnapshot.val()

          var html =
            '<div>' +
            '<div class="card-header header-eventos" style="background-color: #3fb399;">' +
            '<div class="nome-evento mx-auto d-block" style="heigth: 100px; padding: 10px;"></div>' +
            '<div class="btn-group dropup div-deleta-evento">' +
            '<button class="btn-deleta-evento mdl-button mdl-js-ripple-effect" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
            '<i class="material-icons" style="color: white;">more_vert</i>' +
            '</button>' +
            '<div class="dropdown-menu dropdown-menu-evento">' +
            '<a class="dropdown-item dropdown-item-evento" style="font-size: 15px;" href="#" onclick="deletaEvento(' + evento.tempo + ')"><i style="margin-right: 5px;" class="material-icons">delete</i>Deletar</a>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="card-block">' +
            '<div class="card-text data-evento"></div>' +
            '<hr  class="my-4 linha-evento">' +
            '<div class="card-text local-evento"></div>' +
            '</div>' +
            '</div>'

          var div = document.createElement('div')
          div.classList.add('card', 'card-evento', 'text-center')
          div.style.marginTop = '3rem'
          div.style.marginBottom = '3rem'
          div.innerHTML = html

          var eventos = div.firstChild

          // passando os valores de cada noticia para seu respectivo campo
          eventos.getElementsByClassName('nome-evento')[0].innerText = evento.nome
          eventos.getElementsByClassName('data-evento')[0].innerText = evento.data
          eventos.getElementsByClassName('local-evento')[0].innerText = evento.local

          document.getElementById('container-ultimo-evento').appendChild(div)
        })
      }
    })
}

// funcao que permite ao usuario deletar eventos previamente cadastrados
function deletaEvento (tempo) {
  var userId = firebase.auth().currentUser.uid
  var eventoExcluido = rootRef.child('Eventos/Todos').orderByChild('tempo').equalTo(tempo)
    .once('value').then(function (snap) {
      var evento = snap.val()
      var keys = Object.keys(evento)
      rootRef.child('Eventos/Todos/' + keys[0]).remove()
    })
}

// 
// 
// CADASTRO FUNCIONARIOS
// 

// mostrar/esconder dialog novo funcionario
var dialogNovoFuncionario = document.querySelector('#dialog-cadastra-funcionario') // dialog
var showDialgoCadastraFuncionario = document.querySelector('#show-dialog-cadastra-funcionario') // button
showDialgoCadastraFuncionario.addEventListener('click', function () {
  if (!('showModal' in dialogNovoFuncionario)) {
    dialogPolyfill.registerDialog(dialogNovoFuncionario)
  }
  $('#semDados').hide()
  // fixaTela.classList.add('fixed');
  $('html').css('overflow', 'hidden')
  dialogNovoFuncionario.showModal()
})
dialogNovoFuncionario.querySelector('.close').addEventListener('click', function () {
  dialogNovoFuncionario.close()
})

// funcao que permite o sindico cadastrar novos funcionarios
$('#btnCadastrarFuncionario').on('click', function () {
  const auth = firebase.auth()
  const email = $('#email-funcionario').val()
  const pass = $('#senha-funcionario').val()
  const confirmPass = $('#confirma-senha-funcionario').val()
  const nome = $('#nome-funcionario').val()
  const sobrenome = $('#sobrenome-funcionario').val()
  const nomeCompleto = nome + ' ' + sobrenome
  const cargo = $('#cargo-funcionario').val()
  const cel = $('#celular-funcionario').val()
  const tel = $('#telefone-funcionario').val()

  // Criando usuario
  const promiseCadastro = auth.createUserWithEmailAndPassword(email, pass)
  promiseCadastro.catch(e => alert('Usuario não Cadastrado! Erro: ' + e.message))
  promiseCadastro.then(function (result) {
    if (confirmPass == pass && email && nome && sobrenome && cargo && cel && tel) {

      var proKey = rootRef.child('Funcionarios-Provisorios').push().key
      var sexo

      if (document.getElementById('masculino').checked) {
        sexo = 'Masculino'
      } else if (document.getElementById('feminino').checked) {
        sexo = 'Feminino'
      }

      var novoFuncionario = {
        nome: nome,
        sobrenome: sobrenome,
        sexo: sexo,
        cargo: cargo,
        celular: cel,
        telefone: tel,
        email: email,
        nomeCompleto: nomeCompleto
      }

      var updates = {}
      updates['/Funcionarios-Povisorios/' + proKey] = novoFuncionario
      // Salvando dados usuario no bd
      firebase.database().ref().update(updates)

      // Fechando dialog
      dialogNovoFuncionario.close()

      // Limpando os dados formulario
      $('#nome-funcionario').val('')
      $('#sobrenome-funcionario').val('')
      $('#cargo-funcionario').val('')
      $('#celular-funcionario').val('')
      $('#telefone-funcionario').val('')
      $('#email-funcionario').val('')
      $('#senha-funcionario').val('')

      var notification = document.querySelector('#toast-informacao')
      var data = {
        message: 'Novo funcionário cadastrado com sucesso!',
        actionText: 'Undo',
        timeout: 5000
      }
      notification.MaterialSnackbar.showSnackbar(data)

    } else {
      alert('Veja se todos os campos estão preenchidos!')
      $('#senhas-diferentes').show()
      $('#senha-funcionario').val('')
      $('#confirma-senha-funcionario').val('')
    }
  })
})

//
// 
// FUNÇÕES GENÉRICAS
// 

// mostrando regulamento interno
$('#buttonShowRules').on('click', function () {
  $('#rules').show()
  $('#informacoes-condominio').hide()
  $('#buttonVoltarInfo').show()
  $('#buttonVoltarInfo').css('display', 'block')
})

$('#buttonVoltarInfo').on('click', function () {
  $('#rules').hide()
  $('#informacoes-condominio').show()
  $('#buttonVoltarInfo').hide()
})

var girar = true

// girando logo infinitamente
$('#logoSobre').on('click', function () {
  $('#logoSobre').addClass('animated flash')
  var wait = setTimeout(function() {
    $('#logoSobre').removeClass('animated flash')
  }, 1000)
})

// funcao que verifica a extensao do arquivo que fora escolhido para ser publicado nas noticias ou no mural
function verifica_extencao (inputImagem) {
  var extensoesOk = ',.gif,.jpg,.png,.jpeg,'
  var extensao = ',' + inputImagem.value.substr(inputImagem.value.length - 5).toLowerCase() + ','
  var extensao2 = ',' + inputImagem.value.substr(inputImagem.value.length - 4).toLowerCase() + ','

  if (extensoesOk.indexOf(extensao) === -1 && extensoesOk.indexOf(extensao2) === -1) {
    var notification = document.querySelector('#toast-informacao')
    var data = {
      message: 'O arquivo selecionado não é uma imagem!',
      actionText: 'Undo',
      timeout: 5000
    }
    notification.MaterialSnackbar.showSnackbar(data)
    inputImagem.value = ''
    selectedFile = ''
    $('#check-perfil').hide()
  }
}

// funcao responsavel de formatar os campos de telefone quando o usuario for alterar seus dados
function formatar (mascara, documento) {
  var i = documento.value.length
  var saida = mascara.substring(0, 1)
  var texto = mascara.substring(i)

  if (texto.substring(0, 1) != saida) {
    documento.value += texto.substring(0, 1)
  }
}

// Fazendo botão mostra lista girar 45deg
var clicado = false

$('#mostra-lista').on('click', function() {
  if (clicado == false) {
    $('#mostra-lista').removeClass('desgiraBtn')
    $('#mostra-lista').addClass('giraBtn')
    clicado = true
  }  else {
    $('#mostra-lista').removeClass('giraBtn')
    $('#mostra-lista').addClass('desgiraBtn')
    clicado = false
  } 

  $(document).on('click', function() {
    $('#mostra-lista').removeClass('giraBtn')
    $('#mostra-lista').addClass('desgiraBtn')
    clicado = false
  })
})

// 
// 
// TROCA DE TELAS
// 

// botoes que chamam seus respectivos containers
$('#buttonMural').on('click', function () {
  $('#container-aleatorio').hide()
  $('#pagina-perfil').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#container-aleatorio-2').show()
  $('#tela-sobre').hide()
  $('#section-eventos').hide()
  $('#container-condominio').hide()
  $('#container-estatisticas').hide()
  $('#containerFluid').hide()
  $('#titulo').text('Mural')
  textoFim.style.display = 'block'

  //alterando url 
  history.replaceState('mural','Mural','/mural');
})

$('#buttonPerfil').on('click', function () {
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#tela-sobre').hide()
  $('#historico-msgs').hide()
  $('#pagina-perfil').show()
  $('#section-eventos').hide()
  $('#containerFluid').hide()
  $('#container-condominio').hide()
  $('#container-estatisticas').hide()
  $('#container-mapa').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#titulo').text('Perfil')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()  
  
  //alterando url 
  history.replaceState('perfil','Perfil','/perfil');
})

// funcao chamar container sobre
$('#buttonSobreSlide').on('click', function () {
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#pagina-perfil').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#historico-msgs').hide()
  $('#tela-sobre').show()
  $('#section-eventos').hide()
  $('#section-eventos').hide()
  $('#container-condominio').hide()
  $('#container-estatisticas').hide()
  $('#containerFluid').hide()
  $('#titulo').text('Sobre')
  textoFim.style.display = 'none'

  //alterando url 
  history.replaceState('sobre','Sobre','/sobre');
})

$('#buttonSobre').on('click', function () {
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#pagina-perfil').hide()
  $('#historico-msgs').hide()
  $('#tela-sobre').show()
  $('#section-eventos').hide()
  $('#containerFluid').hide()
  $('#container-condominio').hide()
  $('#container-estatisticas').hide()
  $('#container-mapa').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#titulo').text('Sobre')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()

  //alterando url 
  history.replaceState('sobre','Sobre','/sobre');
})

$('#buttonHistorico').on('click', function () {
  $('#pagina-perfil').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#historico-msgs').show()
  $('#tela-sobre').hide()
  $('#containerFluid').hide()
  $('#container-condominio').hide()
  $('#section-eventos').hide()
  $('#container-mapa').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#titulo').text('Histórico')
  textoFim.style.display = 'none'

  $('.pagination-nav').show()    

  //alterando url 
  history.replaceState('historico','Historico','/historico');
})

// funcao botao home para voltar para a pagina inicial
$('#buttonNoticia').on('click', function () {
  $('#tela-sobre').hide()
  $('#pagina-perfil').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#container-noticia-full').hide()
  $('#container-noticias').show()
  $('#container-aleatorio').show()
  $('#container-aleatorio-2').hide()
  $('#containerFluid').show()
  $('#container-condominio').hide()
  $('#section-eventos').hide()
  $('#container-estatisticas').hide()
  $('#titulo').text('Notícias')
  textoFim.style.display = 'block'

  //alterando url 
  history.replaceState('noticias','Noticias','/noticias');
})

$('#buttonEstatisticas').on('click', function () {
  $('#tela-sobre').hide()
  $('#pagina-perfil').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#container-noticia-full').hide()
  $('#container-noticias').hide()
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#containerFluid').hide()
  $('#container-condominio').hide()
  $('#section-eventos').hide()
  $('#container-estatisticas').show()
  $('#titulo').text('Estatísticas')
  textoFim.style.display = 'none'

  //alterando url 
  history.replaceState('estatisticas','Estatisticas','/estatisticas');
})

$('#buttonEventos').on('click', function () {
  $('#historico-msgs').hide()
  $('#tela-sobre').hide()
  $('#pagina-perfil').hide()
  $('#container-noticia-full').hide()
  $('#container-noticias').hide()
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#containerFluid').hide()
  $('#section-eventos').show()
  $('#container-mapa').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#container-estatisticas').hide()
  $('#container-condominio').hide()
  $('#titulo').text('Eventos')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()  

  //alterando url 
  history.replaceState('eventos','Eventos','/eventos');
})

$('#buttonCondominio').on('click', function () {
  $('#tela-sobre').hide()
  $('#pagina-perfil').hide()
  $('#container-noticia-full').hide()
  $('#container-noticias').hide()
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#historico-msgs').hide()
  $('#containerFluid').hide()
  $('#section-eventos').hide()
  $('#container-mapa').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#container-estatisticas').hide()
  $('#container-condominio').show()
  $('#titulo').text('Condomínio')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()    

  //alterando url 
  history.replaceState('condominio','Condominio','/condominio');
})

$('#buttonAcompanhe').on('click', function () {
  $('#tela-sobre').hide()
  $('#historico-msgs').hide()
  $('#pagina-perfil').hide()
  $('#section-eventos').hide()
  $('#containerFluid').hide()
  $('#container-condominio').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').hide()
  $('#container-mapa').show()
  iniciarMapa()
  carregaPontos()
  $('#titulo').text('Acompanhe')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()    

  //alterando url 
  history.replaceState('acompanhe','Acompanhe','/acompanhe');
})

$('#buttonMensagens').on('click', function () {
  $('#tela-sobre').hide()
  $('#pagina-perfil').hide()
  $('#container-noticia-full').hide()
  $('#container-noticias').hide()
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#historico-msgs').hide()
  $('#containerFluid').hide()
  $('#section-eventos').hide()
  $('#container-mapa').hide()
  $('#container-estatisticas').hide()
  $('#container-condominio').hide()
  $('#pagina-msgs-mural').show()
  $('#pagina-denuncias-mural').hide()
  
  iniciarMapa()
  carregaPontos()
  $('#titulo').text('Mensagens')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()    

  //alterando url 
  history.replaceState('mensagens','Mensagens','/mensagens');
})

$('#buttonDenuncias').on('click', function () {
  $('#tela-sobre').hide()
  $('#pagina-perfil').hide()
  $('#container-noticia-full').hide()
  $('#container-noticias').hide()
  $('#container-aleatorio').hide()
  $('#container-aleatorio-2').hide()
  $('#historico-msgs').hide()
  $('#containerFluid').hide()
  $('#section-eventos').hide()
  $('#container-mapa').hide()
  $('#container-estatisticas').hide()
  $('#container-condominio').hide()
  $('#pagina-msgs-mural').hide()
  $('#pagina-denuncias-mural').show()
  
  iniciarMapa()
  carregaPontos()
  $('#titulo').text('Denúncias')
  textoFim.style.display = 'none'

  $('.pagination-nav').hide()    

  //alterando url 
  history.replaceState('denuncias','Denuncias','/denuncias');
})
