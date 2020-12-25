$(function () {
  $("#login").submit(function (event) {
    event.preventDefault();
    var form = $(this);
    $.ajax({
      type: "POST",
      url: form.attr("action"),
      data: form.serialize(),
      success: function (response) {
        if (response.status) {
          $("#login-message").removeClass("alert alert-warning");
          $("#login-message").addClass("alert alert-success");
          setTimeout(() => {
            window.location = response.route;
          }, 2000);
        } else {
          $("#login-message").removeClass("alert alert-success");
          $("#login-message").addClass("alert alert-warning");
        }
        $("#login-status").text(response.message);
      },
    });
  });
});

$(function () {
  $.validator.setDefaults({
    submitHandler: function () {
      $.ajax({
        url: "/signup",
        method: "POST",
        data: $("#signup").serialize(),
        success: (response) => {
          if (response.otp) {
            $("#otp_validater").modal("show");
            alert("your Otp is " + response.data);
          } else {
            alert("unknown eRROR!");
          }
        },
      });
    },
  });
  $("#signup").validate({
    rules: {
      first_name: {
        required: true,
      },
      last_name: {
        required: true,
      },
      username: {
        required: true,
        remote: {
          url: "/validate_registration",
          type: "POST",
          dataType: "json",
        },
      },
      password: {
        required: true,
      },
      confirm_password: {
        required: true,
        equalTo: "#password",
      },
      mobile: {
        required: true,
        remote: {
          url: "/validate_registration",
          type: "POST",
          dataType: "json",
        },
      },
    },
    messages: {
      first_name: {
        required: "Please enter a first name",
      },
      last_name: {
        required: "Please enter a last name",
      },
      mobile: {
        required: "Please provide a mobile number",
        remote: "mobile number found on database",
      },
      username: {
        required: "username is requierd",
        remote: "username alredy used",
      },
      password: {
        requierd: "password must be required",
      },
      confirm_password: {
        requierd: "password must be required",
        equalTo: "password not match",
      },
    },
    errorElement: "span",
    errorPlacement: function (error, element) {
      error.addClass("invalid-feedback");
      element.closest(".form-group").append(error);
    },
    highlight: function (element, errorClass, validClass) {
      $(element).addClass("is-invalid");
    },
    unhighlight: function (element, errorClass, validClass) {
      $(element).removeClass("is-invalid");
    },
  });
});

function validateOtp() {
  otp = $("#otp").val();
  $("#otp").attr("disabled", "disabled");
  $.ajax({
    url: "/validate_otp",
    data: { otp: otp },
    method: "POST",
    datatype: "JSON",
    success: (response) => {
      if (response.data) {
        $("#otp_validater").modal("hide");
        $(document).Toasts("create", {
          autohide: true,
          class: "bg-info",
          delay: 750,
          title: "Emplyee Creation",
          body: "Employee Created Successfully",
        });
        $("#add_employee").trigger("reset");
      } else {
        $("#otp").removeAttr("disabled", "disabled");
        $("#otp").val("");
        $("#error_text").text("Invalid OTP");
      }
    },
  });
}

$("#store_selector").on("change", function () {
  $.ajax({
    url: "/change_store",
    data: { store: this.value },
    dataType: "JSON",
    method: "POST",
    success: (response) => {
      if (response) {
        location.reload();
      }
    },
  });
});

$(document).ready(function () {
  if (typeof Storage !== "undefined") {
    if (!localStorage.getItem("ShoppingLocation")) {
      setGeostore();
    }
  } else {
    console.log("Local Storage Not Supported");
  }

  $('#save_address').validate({
		rules: {
		    name: 'required',
			address: 'required',
			mobile: {
	        	required: true,
				minlength: 9,
				maxlength: 9,
				number: true,
			},
		    building: 'required',
		    flat: 'required'
		},
		messages: {
		   name: 'This field is required',
		   address: 'This field is required',
		   mobile: 'Enter a valid Mobile Number',
		   building: 'Enter a valid building Number',
		   flat: 'Enter a valid Flat Number'
		},
		submitHandler: function(form) {
		   $.ajax({
				url: '/save_address',
				type: "POST",             
				data: $(form).serialize(),
				dataType : 'json',
				success: function(response) {
					if (response.login){
						if(response.success){
              //toastr.info(response.message);
              messageAlert(response.message, "info")
							$("#add_address").modal('hide');
							location.reload();
						}
						else{
              messageAlert(response.message, "danger")
						}
					}
					else{
						window.location = "/login";
					}
	
				}
			});
		}
    });
});

function setGeostore() {
  getLocation().then((data) => {
    $.ajax({
      method: "POST",
      url: "/geo_locator",
      data: data,
      dataType: "JSON",
      success: (response) => {
        localStorage.setItem("ShoppingLocation", "available");
        $("#store_selector").empty();
        $.each(response.stores, function (val) {
          $("#store_selector").append(
            $("<option></option>")
              .val(response.stores[val]._id)
              .html(
                response.stores[val].storename +
                  "[" +
                  response.stores[val].companyname +
                  "]"
              )
          );
        });
        Swal.fire({
          title:
            '<span class="text-primary"> Your Nearest Store is ' +
            response.stores[0].storename +
            " Do you want to change store to " +
            response.stores[0].storename +
            "? </span>",
          showDenyButton: false,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: `Yes`,
        }).then((result) => {
          if (result.isConfirmed) {
            $.ajax({
              url: "/change_store",
              data: { store: response.stores[0]._id },
              dataType: "JSON",
              method: "POST",
              success: (result) => {
                if (result) {
                  location.reload();
                }
              },
            });
          }
        });
      },
    });
  });
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        resolve(position.coords);
      });
    } else {
      resolve({ latitude: "1", longitude: "1" });
    }
  });
}


// let getCookie = function (name) {
//   var cookieArr = document.cookie.split(";");
//   for (var i = 0; i < cookieArr.length; i++) {
//     var cookiePair = cookieArr[i].split("=");
//     if (name == cookiePair[0].trim()) {
//       return decodeURIComponent(cookiePair[1]);
//     }
//   }
//   return null;
// };

//cart functions
function addTocart(item_id) {
  $.ajax({
    type: "POST",
    data: { id: item_id },
    dataType: "JSON",
    url: "/add-to-cart/",
    success: function (response) {
      if (response.status == 401) {
        loginAlert();
        window.location = "/login";
      }
      updateTotalcart(response.total);
      messageAlert("Adding New Item to cart Successfully", "success")
    },
  });
}

function changeQty(prodID, cartID = null) {
  qty = document.getElementById("cart_qty_" + prodID).value;
  if (qty <= 0 || isNaN(qty)) {
    setTimeout(messageAlert("Enter a Valid Quantity", "warning"), 20000)
    location.reload()
  } else {
    $.ajax({
      type: "post",
      url: "/edit-cart/",
      data: { prodID: prodID, qty: qty, cartID: cartID },
      success: function (response) {
        if (response.status == 401) {
          loginAlert();
          window.location = "/login";
        }
        else{
          if (response.status) {
            updateTotalcart(response.total);
            location.reload();
          }
           else {
            messageAlert("Unknow Error while Editing", "warning")
          }
        }
      },
    });
  }
}

function updateTotalcart(total) {
  $("#simpleCart_total").text(total);
}

function loginAlert(){
  return new Promise((resolve, reject) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: false,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })
    
    Toast.fire({
      icon: 'error',
      title: 'Please Login First'
    })
    
  });
}

function messageAlert(message, type){
  return new Promise((resolve, reject) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: false,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })
    
    Toast.fire({
      icon: type,
      title: message
    })
  });
}