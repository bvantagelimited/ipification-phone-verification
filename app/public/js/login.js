$(document).ready(function(){
  $('.btn-login').on('click', function(){
    var state = document.getElementById('state').getAttribute('state');
    var debug = document.getElementById('debug').getAttribute('debug');

    window.location.href = window.ROOT_URL + '/authentication?state=' + state + '&debug=' + debug;
  })

})