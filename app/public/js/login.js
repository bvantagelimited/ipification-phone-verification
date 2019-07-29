$(document).ready(function(){
  $(".login-block input").on('keyup', function() {
    var value = this.value;
    if(value && value.length > 0){
      $('.login-container').addClass('valid')
    }else{
      $('.login-container').removeClass('valid')
    }
    $('.error-message').html('')
  });

  $('.btn-login').on('click', function(){
    var value = $(".login-block input").val();
    if(value && value.length > 0){
      window.location.href = window.ROOT_URL + '/authentication?phone=' + value;
    }
  })

  var urlParams = new URLSearchParams(window.location.search);
  if(urlParams.has('error')){
    $('.error-message').html(urlParams.get('error'))
  }
})