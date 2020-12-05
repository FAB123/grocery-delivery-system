$(function () {
  $("[data-mask]").inputmask();

  $("input[data-bootstrap-switch]").each(function () {
    $(this).bootstrapSwitch("state", $(this).prop("checked"));
  });

  $.validator.setDefaults({
    submitHandler: function () {
      $.ajax({
        url: "add_store",
        method: "POST",
        data: $("#add_new_store").serialize(),
        datatype: "JSON",
        success: (response) => {
          alert(response.message);
          $(document).Toasts("create", {
            autohide: true,
            class: "bg-info",
            delay: 750,
            title: "Toast Title",
            body: response.message,
          });
        },
      });
      alert("Form successful submitted!");
    },
  });
  $("#add_new_store").validate({
    rules: {
      storename: {
        required: true,
      },
      address: {
        required: true,
        minlength: 10,
      },
      mobile: {
        required: true,
      },
    },
    messages: {
      storename: {
        required: "Please enter a store address",
      },
      address: {
        required: "Please enter a address",
        minlength: "Your address must be at least 10 characters long",
      },
      mobile: {
        required: "Please provide a mobile number",
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
          if (response.otp) {
            $("#otp_validater").modal("show");
            alert("your Otp is "+ response.data)
          } else {
            alert("unknown eRROR!");
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
        remote:{
          url:'/admin/validate_registration',
          type:'POST',
          dataType: 'json',
        }
      },
      password: {
        required: true,
      },
      confirm_password: {
        required: true,
        equalTo: "#password"
      },
      mobile: {
        required: true,
        remote:{
          url:'/admin/validate_registration',
          type:'POST',
          dataType: 'json',
        }
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
        required: "Please provide a mobile number",
        remote: 'mobile number found on database'
      },
      username:{
        required:'username is requierd',
        remote:'username alredy used'
      },
      password:{
        requierd:'password must be required',
      },
      confirm_password:{
        requierd:'password must be required',
        equalTo:'password not match'
      }
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

function validateOtp(){
  otp = $('#otp').val();
  $("#otp").attr("disabled", "disabled");
  $.ajax({
    url:'/admin/validate_otp',
    data:{'otp':otp},
    method:'POST',
    datatype:'JSON',
    success:(response)=>{
       if(response.data){
          $("#otp_validater").modal("hide");
          $(document).Toasts("create", {
            autohide: true,
            class: "bg-info",
            delay: 750,
            title: "Emplyee Creation",
            body: "Employee Created Successfully",
          });
          $('#add_employee').trigger("reset");
       }
       else{
        $("#otp").removeAttr("disabled", "disabled");
        $("#otp").val("");
        $('#error_text').text("Invalid OTP")
       }
    }
  })
  
}

$('input[name="active"]').on('switchChange.bootstrapSwitch', function(event, state) {
  alert($(this).attr('id'));
});