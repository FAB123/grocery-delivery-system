$(function () {
  $("[data-mask]").inputmask();

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
            class: 'bg-info',
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
