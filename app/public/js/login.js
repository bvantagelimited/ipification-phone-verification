$(document).ready(function(){
  $(".login-block input").keypress(function (e) {
    //if the letter is not digit then display error and don't type anything
    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
       //display error message
      return false;
   }
  });

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
    var state = document.getElementById('state').getAttribute('state');
    var value = $(".login-block input").val();
    var debug = document.getElementById('debug').getAttribute('debug');

    if(value && value.length > 0){
      window.location.href = window.ROOT_URL + '/authentication?phone=' + value + '&state=' + state + '&debug=' + debug;
    }
  })

})