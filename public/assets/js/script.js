
  $(function() {
    $('#login').submit(function(event) {
      event.preventDefault(); 
      var form = $(this);
      $.ajax({
        type: 'POST',
        url: form.attr('action'),
        data: form.serialize(),
        success: function(response){
          if(response.status){
            $('#login-message').removeClass("alert alert-warning");
            $('#login-message').addClass("alert alert-success");
            setTimeout(() => {
              window.location = response.route;
            }, 2000);
          }
          else{
            $('#login-message').removeClass("alert alert-success");
            $('#login-message').addClass("alert alert-warning");
          }
          $('#login-status').text(response.message);
        }
      })
    });
  });

function carouselDelete(image){
  $.ajax({
    type:'POST',
    url:'/carouselDelete/image',
    success: function(response){
      alert("itsis")
    }
  })
}

function addTocart(item_id){
  $.ajax({
    type:'get',
    url:'/add-to-cart/'+item_id,
    success: function(response){
      if(response.status==321){
        alert("Login Error Please Login ")
        window.location = 'login'
      }
      alert(response.result)
    }
  })
}

function changeQty(prodID, cartID = null){
  qty = document.getElementById('cart_qty_'+prodID).value
  if(qty<=0){
    alert("Enter a vald Quantity")
  }
  else{
    $.ajax({
      type:'post',
      url:'/edit-cart/',
      data:{'prodID':prodID, 'qty':qty, 'cartID':cartID},
      success: function(response){
        if(response.status){
          window.location.reload
        }
        else{
          alert('error editiong item')
        }
      }
    })
  }
}