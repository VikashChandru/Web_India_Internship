document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = document.getElementById('submitButton');
    const resetButton = document.getElementById('resetButton'); 
    const successMessage = document.getElementById('successMessage');

    const MAX_PASSWORD_LENGTH = 20;

    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    document.getElementById('resetToken').value = token || '';

   
    newPasswordInput.addEventListener('input', function () {
        if (newPasswordInput.value.length > MAX_PASSWORD_LENGTH) {
            newPasswordInput.value = newPasswordInput.value.slice(0, MAX_PASSWORD_LENGTH);
        }
        validatePasswordStrength();
    });

    confirmPasswordInput.addEventListener('input', function () {
        if (confirmPasswordInput.value.length > MAX_PASSWORD_LENGTH) {
            confirmPasswordInput.value = confirmPasswordInput.value.slice(0, MAX_PASSWORD_LENGTH);
        }
        validatePasswordMatch();
    });

    if (resetButton) {
        resetButton.addEventListener('click', function () {
            form.reset();
            clearErrors();
            clearSuccess();
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (validateForm()) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';

            try {
                await simulatePasswordReset({
                    token: token,
                    newPassword: newPasswordInput.value,
                    confirmPassword: confirmPasswordInput.value
                });

                showSuccess('Password updated successfully! You can now log in with your new password.');
                form.reset();

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } catch (error) {
                console.error('Error:', error);
                showError('newPassword', 'An error occurred. Please try again.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Update Password';
            }
        }
    });

    function validatePasswordStrength() {
        const password = newPasswordInput.value;
        const requirements = {
            length: password.length >= 8 && password.length <= MAX_PASSWORD_LENGTH,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        updateRequirementIndicator('lengthReq', requirements.length);
        updateRequirementIndicator('upperReq', requirements.upper);
        updateRequirementIndicator('lowerReq', requirements.lower);
        updateRequirementIndicator('numberReq', requirements.number);
        updateRequirementIndicator('specialReq', requirements.special);

        return Object.values(requirements).every(Boolean);
    }

    function updateRequirementIndicator(id, isValid) {
        const element = document.getElementById(id);
        if (element) {
            element.className = isValid ? 'valid' : '';
        }
    }

    function validatePasswordMatch() {
        const match = newPasswordInput.value === confirmPasswordInput.value;
        confirmPasswordInput.classList.toggle('error', !match && confirmPasswordInput.value.length > 0);
        return match;
    }

    function validateForm() {
        let isValid = true;
        clearErrors();

        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (newPassword === '') {
            showError('newPassword', 'New Password cannot be empty.');
            isValid = false;
        }

        if (confirmPassword === '') {
            showError('confirmPassword', 'Confirm Password cannot be empty.');
            isValid = false;
        }

        if (newPassword && !validatePasswordStrength()) {
            const msg = newPassword.length > MAX_PASSWORD_LENGTH
                ? `Password must be less than ${MAX_PASSWORD_LENGTH} characters.`
                : 'Password does not meet all requirements.';
            showError('newPassword', msg);
            isValid = false;
        }

        if (newPassword && confirmPassword && !validatePasswordMatch()) {
            showError('confirmPassword', 'Passwords do not match.');
            isValid = false;
        }

        return isValid;
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);

        if (field && errorElement) {
            field.classList.add('error');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        document.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
    }

    function clearSuccess() {
        if (successMessage) {
            successMessage.textContent = '';
            successMessage.style.display = 'none';
        }
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
        }
    }

    function simulatePasswordReset(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Password reset data:', data);
                resolve();
            }, 1500);
        });
    }
});

