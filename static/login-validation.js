document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const rememberMe = document.getElementById('rememberMe').checked;

      clearErrors();

      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);

      if (isEmailValid && isPasswordValid) {
        console.log('Login data valid, ready for submission:', {
          email,
          password,
          rememberMe
        });
      }
    });

    function validateEmail(email) {
      const emailField = document.getElementById('email');
      const errorElement = document.getElementById('emailError');
      const maxEmailLength = 25;

      if (!email) {
        showError(emailField, errorElement, 'Email is required');
        return false;
      }

      if (email.length > maxEmailLength) {
        showError(emailField, errorElement, `Email must be less than ${maxEmailLength} characters`);
        return false;
      }

      const emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      if (!emailRegex.test(email)) {
        showError(emailField, errorElement, 'Please enter a valid email address');
        return false;
      }

      return true;
    }

    function validatePassword(password) {
      const passwordField = document.getElementById('password');
      const errorElement = document.getElementById('passwordError');
      const maxPasswordLength = 20;

      if (!password) {
        showError(passwordField, errorElement, 'Password is required');
        return false;
      }

      if (password.length < 8) {
        showError(passwordField, errorElement, 'Password must be at least 8 characters');
        return false;
      }

      if (password.length > maxPasswordLength) {
        showError(passwordField, errorElement, `Password must be less than ${maxPasswordLength} characters`);
        return false;
      }

      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
        showError(
          passwordField,
          errorElement,
          'Password must include uppercase, lowercase, number, and special character'
        );
        return false;
      }

      return true;
    }

    function showError(field, errorElement, message) {
      field.classList.add('is-invalid');
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    function clearErrors() {
      document.querySelectorAll('.is-invalid').forEach((el) => {
        el.classList.remove('is-invalid');
      });

      document.querySelectorAll('.error-message').forEach((el) => {
        el.textContent = '';
        el.style.display = 'none';
      });
    }
  
document.addEventListener('DOMContentLoaded', function () {
  const emailField = document.getElementById('email');
  const passwordField = document.getElementById('password');
  const resetButton = document.getElementById('resetBtn'); // Ensure this ID is set in HTML

  const maxEmailLength = 25;
  const maxPasswordLength = 20;

  emailField.addEventListener('input', function () {
    if (this.value.length > maxEmailLength) {
      this.value = this.value.slice(0, maxEmailLength);
    }
  });

  passwordField.addEventListener('input', function () {
    if (this.value.length > maxPasswordLength) {
      this.value = this.value.slice(0, maxPasswordLength);
    }
  });

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      clearErrors(); 
    });
  }
});
