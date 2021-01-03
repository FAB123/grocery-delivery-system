$(function () {
  $("[data-mask]").inputmask();

  $("input[data-bootstrap-switch]").each(function () {
    $(this).bootstrapSwitch("state", $(this).prop("checked"));
  });

  $.validator.setDefaults({
    submitHandler: function () {
      $.ajax({
        url: "/admin/add_store",
        method: "POST",
        data: $("#add_new_store").serialize(),
        datatype: "JSON",
        success: (response) => {
          if (response.login) {
            $("#add_new_store").trigger("reset");
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-info",
              delay: 4750,
              title: "New Store Added",
              body: response.message,
            });
          } else {
            location.replace("/admin/login");
          }
        },
      });
    },
  });
  $("#add_new_store").validate({
    rules: {
      storename: {
        required: true,
      },
      companyname: {
        required: true,
      },
      address: {
        required: true,
        minlength: 10,
      },
      telephone: {
        required: true,
        number: true, 
        minlength: 10,
        maxlength: 10,
      },
      username: {
        required: true,
        minlength: 5,
        remote: {
          url: "/admin/validate_registration",
          type: "POST",
          dataType: "json",
        },
      },
      firstname: {
        required: true,
      },
      lastname: {
        required: true,
      },
      pwd: {
        required: true,
        minlength: 8,
      },
      confirm_pwd: {
        required: true,
        equalTo: "#pwd",
      },
      mobile: {
        required: true,
        number: true, 
        minlength: 10,
        maxlength: 10,
        remote: {
          url: "/admin/validate_registration",
          type: "POST",
          dataType: "json",
        },
      },
    },
    messages: {
      storename: {
        required: "Please enter a valid Store address",
      },
      companyname: {
        required: "Please enter a valid Store address",
      },
      address: {
        required: "Please enter a address",
        minlength: "Your address must be at least 10 characters long",
      },
      mobile: {
        required: "Please enter a valid mobile number",
        remote: "Mobile number found on database",
      },
      firstname: {
        required: "First name is required",
      },
      lastname: {
        required: "Last name is required",
      },
      telephone: {
        required: "Telephone is required",
        minlength: "Telephone must be at least 10 characters long",
      },
      username: {
        required: "Username is required",
        remote: "Username already used",
        minlength: "Username at least 5 charector required",
      },
      pwd: {
        required: "Password must be required",
        minlength: "Password at least 8 charector required",
      },
      confirm_pwd: {
        required: "password must be required",
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

$(function () {
  $("[data-mask]").inputmask();

  $("input[data-bootstrap-switch]").each(function () {
    $(this).bootstrapSwitch("state", $(this).prop("checked"));
  });

  $.validator.setDefaults({
    submitHandler: function () {
      $.ajax({
        url: "add_employee",
        method: "POST",
        data: $("#add_employee").serialize(),
        success: (response) => {
          if (response.status) {
            if (response.data) {
              alert("User Created Successfully");
            } else {
              alert("Error Creating User");
            }
          } else {
            alert("Login eRROR!");
            location.replace("/login");
          }
        },
      });
    },
  });
  $("#add_employee").validate({
    rules: {
      firstname: {
        required: true,
      },
      lastname: {
        required: true,
      },
      username: {
        required: true,
        minlength: 5,
        remote: {
          url: "/admin/validate_registration",
          type: "POST",
          dataType: "json",
        },
      },
      password: {
        required: true,
        minlength: 8,
      },
      confirm_password: {
        required: true,
        equalTo: "#password",
      },
      mobile: {
        required: true,
        number: true,
        minlength: 10,
        maxlength: 10,
        remote: {
          url: "/admin/validate_registration",
          type: "POST",
          dataType: "json",
        },
      },
    },
    messages: {
      firstname: {
        required: "Please enter a first name",
      },
      lastname: {
        required: "Please enter a last name",
      },
      mobile: {
        required: "Please enter a valid mobile number",
        remote: "Mobile number found on database",
      },
      username: {
        required: "Username is required",
        remote: "Username already used",
        minlength: "Username at least 5 charector required",
      },
      password: {
        required: "Password must be required",
        minlength: "Password at least 8 charector required",
      },
      confirm_password: {
        required: "password must be required",
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

$('input[name="active"]').on(
  "switchChange.bootstrapSwitch",
  function (event, state) {
    // state = state == 'true' ? true : false
    $.ajax({
      url: "/admin/enable_product",
      type: "POST",
      datatype: "JSON",
      data: { state: state, prodId: $(this).attr("id") },
      success: function (response) {
        if (response.loginError) {
          window.location = "/admin/login";
        } else {
          if (response.status) {
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-info",
              delay: 3550,
              title: "Product Status Changed",
              body: "Product Status uploaded Successfully",
            });
            setTimeout(location.reload(), 3600);
          } else {
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-danger",
              delay: 3550,
              title: "Pdoduct Status Change Error Occuered",
              body: "Error Changing Product Status",
            });
          }
        }
      },
    });
  }
);

$('input[name="employeecontrol"]').on(
  "switchChange.bootstrapSwitch",
  function (event, state) {
    // state = state == 'true' ? true : false
    $.ajax({
      url: "/admin/enable_employee",
      type: "POST",
      datatype: "JSON",
      data: { state: state, employeeId: $(this).attr("id") },
      success: function (response) {
        if (response.loginError) {
          window.location = "/admin/login";
        } else {
          if (response.status) {
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-info",
              delay: 3550,
              title: "Employee Status Changed",
              body: "Employee Status uploaded Successfully",
            });
            setTimeout(location.reload(), 3600);
          } else {
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-danger",
              delay: 3550,
              title: "Employee Status Change Error Occuered",
              body: "Error Changing Employee Status",
            });
          }
        }
      },
    });
  }
);

$('input[name="storecontrol"]').on(
  "switchChange.bootstrapSwitch",
  function (event, state) {
    // state = state == 'true' ? true : false
    $.ajax({
      url: "/admin/enable_store",
      type: "POST",
      datatype: "JSON",
      data: { state: state, storeId: $(this).attr("id") },
      success: function (response) {
        if (response.loginError) {
          window.location = "/admin/login";
        } else {
          if (response.status) {
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-info",
              delay: 3550,
              title: "Store Status Changed",
              body: "Store Status uploaded Successfully",
            });
            setTimeout(location.reload(), 3600);
          } else {
            $(document).Toasts("create", {
              autohide: true,
              class: "bg-danger",
              delay: 3550,
              title: "Store Status Change Error Occuered",
              body: "Error Changing Store Status",
            });
          }
        }
      },
    });
  }
);

function changeImage(event) {
  $("#show_image").attr("src", URL.createObjectURL(event.target.files[0]));
  $("#choosefile").text(event.target.files[0].name);
  $("#show_image").removeAttr("style");
}

function changecarouselImage(event) {
  $("#choosecarouselImage").text(event.target.files[0].name);
}

$("#product_carousel_upload").submit(function (e) {
  e.preventDefault();
  var form = $(this);
  var url = form.attr("action");
  $.ajax({
    type: "POST",
    url: url,
    cache: false,
    contentType: false,
    processData: false,
    data: new FormData(this),
    dataType: "JSON",
    success: function (data) {
      if (data.loginError) {
        window.location = "/admin/login";
      } else {
        if (data.result) {
          $(document).Toasts("create", {
            autohide: true,
            class: "bg-info",
            delay: 1550,
            title: "New carousel Added",
            body: "New carousel image uploaded Successfully",
          });
          $("#product_carousel_upload").trigger("reset");
          $("#choosecarouselImage").text("");
          setTimeout(location.reload(), 1600);
        }
      }
    },
  });
});

function removeProductCarousel(image) {
  $.ajax({
    type: "POST",
    url: "/admin/remove-product-carousel/",
    data: { image: image },
    dataType: "JSON",
    success: function (data) {
      if (data.loginError) {
        window.location = "/admin/login";
      } else {
        if (data.result) {
          $(document).Toasts("create", {
            autohide: true,
            class: "bg-info",
            delay: 1550,
            title: "New carousel Deleted",
            body: "New carousel image Deleted Successfully",
          });
          setTimeout(location.reload(), 1600);
        }
      }
    },
  });
}

function deleteProduct(id) {
  if (confirm("Are you sure you want to Delete?")) {
    $.ajax({
      type: "POST",
      url: "/admin/deleteProduct",
      data: { id: id },
      success: (result) => {
        if (result.loginError) {
          window.location = "/admin/login";
        } else {
          $(document).Toasts("create", {
            autohide: true,
            class: "bg-info",
            delay: 1550,
            title: "Product Deleted",
            body: "Product Deleted Successfully",
          });
          setTimeout(location.reload(), 1600);
        }
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
    url: "/admin/get_ordered_products",
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
        location.reload("/admin/login");
      }
    },
  });
}

function viewStatus(orederId) {
  $("#view-tracks")
    .modal({ backdrop: "static" })
    .find(".modal-body")
    .load("/admin/get_ordered_status/" + orederId);
}

function markFinished(id) {
  let result = confirm("Do you want mark this as Finished");
  if (result) {
    $.ajax({
      url: "/admin/mark_as_finished",
      data: { orederId: id },
      dataType: "JSON",
      method: "POST",
      success: function (response) {
        console.log(response);
        if (response.login) {
          alert("Status Changed!");
          location.reload();
        } else {
          location.replace("/admin/login");
        }
      },
    });
  } else {
    alert("Request Canceled.");
  }
}

function timechecker() {
  var now = getMinutesNow();
  var start = getMinutes("10:00:12 PM");
  var end = getMinutes("17:35:12 AM");
  if (start > end) end += getMinutes("24:00");

  if (now > start && now < end) {
    console.log("now Open");
  } else {
    console.log("Closed");
  }
}

function getMinutesNow() {
  var timeNow = new Date();
  return timeNow.getHours() * 60 + timeNow.getMinutes();
}

function getMinutes(str) {
  var time = str.split(":");
  var format = str.split(" ");
  format[1] == "PM" ? (time[0] = time[0] + 12) : "";
  return time[0] * 60 + time[1] * 1;
}
