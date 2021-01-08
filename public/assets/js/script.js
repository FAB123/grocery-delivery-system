if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sworker.js").then(registration=>{
    console.log("registerd");
    console.log(registration);
  }).catch(e=>{
    console.log("service worker error" + e)
  })
}
else{
  console.log("Service Worker Not Compatible cuurent browser")
}
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
            window.location = response.userRoute;
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
        messageAlert("User Registration Successfull.");
        location.replace("/login");
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
    if (!sessionStorage.getItem("ShoppingLocation")) {
      setGeostore();
    }
    if (sessionStorage.getItem("Language")) {
      $('#language').val(sessionStorage.getItem("Language"))
    }
  } else {
    console.log("Local Storage Not Supported");
  }

  $("#save_address").validate({
    rules: {
      name: "required",
      address: "required",
      mobile: {
        required: true,
        minlength: 9,
        maxlength: 9,
        number: true,
      },
      building: "required",
      flat: "required",
    },
    messages: {
      name: "This field is required",
      address: "This field is required",
      mobile: "Enter a valid Mobile Number",
      building: "Enter a valid building Number",
      flat: "Enter a valid Flat Number",
    },
    submitHandler: function (form) {
      $.ajax({
        url: "/save_address",
        type: "POST",
        data: $(form).serialize(),
        dataType: "json",
        success: function (response) {
          if (response.login) {
            if (response.success) {
              //toastr.info(response.message);
              messageAlert(response.message, "info");
              $("#add_address").modal("hide");
              location.reload();
            } else {
              messageAlert(response.message, "danger");
            }
          } else {
            window.location = "/login";
          }
        },
      });
    },
  });
});

function deleteAddress(addressId) {
  r = confirm("do you want remove this address?");
  if (r) {
    $.ajax({
      url: "/deleteAddress",
      method: "POST",
      type: "JSON",
      data: { id: addressId },
      success: function (response) {
        if (response.login) {
          if (response.status) {
            messageAlert("Address Removed Successfully", "info");
            location.reload();
          } else {
            messageAlert("Error removing address", "danger");
          }
        } else {
          location.replace("/login");
        }
      },
    });
  }
}

$("#newproductreview").validate({
  rules: {
    comment: "required",
  },
  message: {
    comment: "This field is required",
  },
  submitHandler: function (form) {
    $.ajax({
      url: "/new-product-review",
      type: "POST",
      data: $("#newproductreview").serialize(),
      dataType: "json",
      success: function (response) {
        if (response.login) {
          if (response.status) {
            $('#post-review-box').slideUp(300, function () {
              $('#new-review').focus();
              $('#open-review-box').fadeIn(200);
            });
            messageAlert("Thank You for Review, Have a nice day", "info");
          }
          else {
            messageAlert("Ohh, Some think went Wrong", "Danger")
          }
        } else {
          location.replace("/login");
        }
      },
    });
  },
});

$("#placeorder").validate({
  rules: {
    address: "required",
    paymentMethod: "required",
  },
  message: {
    address: "This field is required",
    paymentMethod: "This field is required",
  },
  submitHandler: function (form) {
    var findAddress = $('input[name=address]:checked', '#placeorder').val()
    if (!findAddress) {
      messageAlert("Shipping Address not Provided, Please update shipping address", "info")
    } else {
      $.ajax({
        url: "/place_order",
        type: "POST",
        data: $("#placeorder").serialize(),
        dataType: "json",
        success: function (response) {
          if (response.login) {
            if (response.storeclosed) {
              messageAlert("Store Closed Now, Please try on Working Hours or try another Store", "warning")
            }
            else {
              if (response.method == "razorPay") {
                var rzp1 = new Razorpay(RazOpt(response.options));
                rzp1.open();
                rzp1.on("payment.failed", function (response) {
                  // alert(response.error.code);
                  // alert(response.error.description);
                  // alert(response.error.source);
                  // alert(response.error.step);
                  // alert(response.error.reason);
                  // alert(response.error.metadata.order_id);
                  // alert(response.error.metadata.payment_id);
                });
              } else if (response.method == "moyasar") {
                // $("#moyasar-pay")
                // .modal({ backdrop: "static" })
                // .find(".modal-body")
                // .load("/moyasar_payment/");
                window.location = "/moyasar_payment/";
              } else if (response.method == "cod") {
                window.location = "/orders";
              } else {
                messageAlert(response.message, "danger");
              }
            }
          } else {
            location.replace("/login");
          }
        },
      });
    }
  },
});

// submit((e) => {
//   e.preventDefault();
//   $.ajax({
//     url: "/place_order",
//     type: "POST",
//     data: $("#placeorder").serialize(),
//     dataType: "json",
//     success: function (response) {
//       alert(response.method)
//       if (response.login) {
//         if (response.method == "razorPay") {
//           var rzp1 = new Razorpay(RazOpt(response.options));
//           rzp1.open();
//           rzp1.on("payment.failed", function (response) {
//             // alert(response.error.code);
//             // alert(response.error.description);
//             // alert(response.error.source);
//             // alert(response.error.step);
//             // alert(response.error.reason);
//             // alert(response.error.metadata.order_id);
//             // alert(response.error.metadata.payment_id);
//           });
//         }
//         else if(response.method == "moyasar"){

//           // $("#moyasar-pay")
//           // .modal({ backdrop: "static" })
//           // .find(".modal-body")
//           // .load("/moyasar_payment/");
//           window.location = "/moyasar_payment/";
//         }
//         else if (response.method == "cod"){
//           window.location = "/orders";
//         }
//         else {
//           messageAlert(response.message, "danger");
//         }
//       } else {
//         location.replace("/login");
//       }
//     },
//   });
// });

function varifyRazorpayPayment(payment) {
  $.ajax({
    url: "/varify-razorpay",
    data: { payment: payment },
    method: "POST",
    success: function (response) {
      if (response.login) {
        if (response.payment) {
          alert("payment success");
          window.location = "/orders";
        } else {
          alert("payment failed");
        }
      } else {
        location.replace("/login");
      }
    },
  });
}

function RazOpt(data) {
  var options = {
    key: data.key_id,
    amount: data.razamount,
    currency: "INR",
    name: "AL Hasib",
    description: "Order Against Order ID: " + data.orderid,
    image: "https://example.com/your_logo",
    order_id: data.orderid,
    handler: function (response) {
      varifyRazorpayPayment(response);
    },
    prefill: {
      name: data.user.first_name + " " + data.user.last_name,
      contact: data.user.mobile,
    },
    notes: {
      address: "Al Hasib Corporate Office",
    },
    theme: {
      color: "#3399cc",
    },
  };
  return options;
}

function setGeostore() {
  getLocation().then((data) => {
    $.ajax({
      method: "POST",
      url: "/geo_locator",
      data: data,
      dataType: "JSON",
      success: (response) => {
        sessionStorage.setItem("ShoppingLocation", "available");
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
      messageAlert("Adding New Item to cart Successfully", "success");
    },
  });
}

function changeQty(prodID, cartID = null) {
  qty = document.getElementById("cart_qty_" + prodID).value;
  if (qty <= 0 || isNaN(qty)) {
    setTimeout(messageAlert("Enter a Valid Quantity", "warning"), 20000);
    location.reload();
  } else {
    $.ajax({
      type: "post",
      url: "/edit-cart/",
      data: { prodID: prodID, qty: qty, cartID: cartID },
      success: function (response) {
        if (response.status == 401) {
          loginAlert();
          window.location = "/login";
        } else {
          if (response.status) {
            updateTotalcart(response.total);
            location.reload();
          } else {
            messageAlert("Unknow Error while Editing", "warning");
          }
        }
      },
    });
  }
}

function updateTotalcart(total) {
  $("#simpleCart_total").text(total);
}

function loginAlert() {
  return new Promise((resolve, reject) => {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: false,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "Please Login First",
    });
  });
}

function clearCart() {
  confirm = confirm("Do you want to Clear Cart?");
  if (confirm) {
    $.ajax({
      url: "/clear_cart",
      method: "POST",
      success: function (response) {
        alert(response);
      },
    });
  }
}

function changeOrderstatus(id, option) {
  console.log(id + option.value);
  let result = confirm("Do you want change status to " + option.value);
  if (result) {
    $.ajax({
      url: "/admin/change_order_status",
      data: { orederId: id, status: option.value },
      dataType: "JSON",
      method: "POST",
      success: function (response) {
        alert("Status Changed!");
        location.reload();
      },
    });
  } else {
    alert("Request Canceled.");
  }
}

function viewCartitems(orederId) {
  console.log(orederId);
  $.ajax({
    url: "/get_ordered_products",
    method: "POST",
    data: { orederId: orederId },
    dataType: "JSON",
    success: function (response) {
      if (response.login) {
        if (response.items) {
          $("#getCode").empty();
          $.each(response.items, function (key, value) {
            $("#getCode").append(
              "<tr class='table-info'><td>" +
              value.item +
              "</td><td>" +
              value.quantity +
              "</td><td>" +
              value.price +
              "</td><td>" +
              value.quantity * value.price +
              "</td></tr>"
            );
          });
          // $('#view-cart').modal('show').find('.modal-body').load('/admin/get_orderd_products');
          $("#view-cart").modal({ backdrop: "static" });
        }
      } else {
        location.reload("/login");
      }
    },
  });
}

function viewStatus(orederId) {
  $("#view-tracks")
    .modal({ backdrop: "static" })
    .find(".modal-body")
    .load("/get_ordered_status/" + orederId);
}

function messageAlert(message, type) {
  return new Promise((resolve, reject) => {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: false,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: type,
      title: message,
    });
  });
}

$('#language').on('change', function () {
  sessionStorage.setItem("Language", this.value);
  location.replace("?lng=" + this.value)
});