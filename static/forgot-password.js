     document.addEventListener('DOMContentLoaded', function () {
            
            const form = document.getElementById('forgotPasswordForm');
            const emailInput = document.getElementById('email');
            const submitButton = document.getElementById('submitButton');
            const successMessage = document.getElementById('successMessage');
            const securityQuestionGroup = document.getElementById('securityQuestionGroup');
            const securityQuestionSelect = document.getElementById('securityQuestion');
            const securityAnswerInput = document.getElementById('securityAnswer');

            
            const MAX_EMAIL_LENGTH = 25;
            const MIN_ANSWER_LENGTH = 2;
            const RESET_DELAY = 5000;
            emailInput.addEventListener('blur', validateEmailOnBlur);


emailInput.addEventListener('input', function () {
    if (emailInput.value.length > MAX_EMAIL_LENGTH) {
        emailInput.value = emailInput.value.slice(0, MAX_EMAIL_LENGTH);
    }
});


            
            successMessage.style.display = 'none';
            securityQuestionGroup.style.display = 'none';

            emailInput.addEventListener('blur', validateEmailOnBlur);

           
            emailInput.addEventListener('input', function () {
                if (emailInput.value.length > MAX_EMAIL_LENGTH) {
                    emailInput.value = emailInput.value.slice(0, MAX_EMAIL_LENGTH);
                }
            });

            securityAnswerInput.addEventListener('input', clearErrorOnType.bind(null, 'securityAnswer'));
            form.addEventListener('submit', handleFormSubmission);

            // Functions
            function validateEmailOnBlur() {
                const email = emailInput.value.trim();
                clearError('email');

                if (!email) return;

                if (email.length > MAX_EMAIL_LENGTH) {
                    showError('email', `Email must be less than ${MAX_EMAIL_LENGTH} characters`);
                    return;
                }

                if (!validateEmail(email)) {
                    showError('email', 'Please enter a valid email address');
                    return;
                }

                checkEmailExists(email);
            }

            async function handleFormSubmission(e) {
                e.preventDefault();
                clearErrors();

                const email = emailInput.value.trim();
                const question = securityQuestionSelect.value;
                const answer = securityAnswerInput.value.trim();
                let isValid = true;

                if (!email) {
                    showError('email', 'Email is required');
                    isValid = false;
                } else if (email.length > MAX_EMAIL_LENGTH) {
                    showError('email', `Email must be less than ${MAX_EMAIL_LENGTH} characters`);
                    isValid = false;
                } else if (!validateEmail(email)) {
                    showError('email', 'Please enter a valid email address');
                    isValid = false;
                }

                if (securityQuestionGroup.style.display === 'block') {
                    if (!question) {
                        showError('securityQuestion', 'Please select a security question');
                        isValid = false;
                    }

                    if (!answer) {
                        showError('securityAnswer', 'Please answer the security question');
                        isValid = false;
                    } else if (answer.length < MIN_ANSWER_LENGTH) {
                        showError('securityAnswer', `Answer must be at least ${MIN_ANSWER_LENGTH} characters`);
                        isValid = false;
                    }
                }

                if (isValid) {
                    await processPasswordReset(email, question, answer);
                }
            }

            async function checkEmailExists(email) {
                try {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Checking...';

                    const emailExists = await simulateEmailCheck(email);

                    if (emailExists) {
                        securityQuestionGroup.style.display = 'block';
                    } else {
                        securityQuestionGroup.style.display = 'none';
                        showError('email', 'No account found with this email');
                    }
                } catch (error) {
                    console.error('Error checking email:', error);
                    showError('form', 'Error verifying email. Please try again.');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Reset Password';
                }
            }

            async function processPasswordReset(email, question, answer) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner"></span> Processing...';

                try {
                    await simulatePasswordReset(email);
                    showSuccessMessage();
                } catch (error) {
                    console.error('Password reset error:', error);
                    showError('form', 'Failed to process your request. Please try again.');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Reset Password';
                }
            }

            function showSuccessMessage() {
                successMessage.style.display = 'block';
                form.style.display = 'none';

                setTimeout(() => {
                    successMessage.style.display = 'none';
                    form.style.display = 'block';
                    form.reset();
                    securityQuestionGroup.style.display = 'none';
                    clearErrors();
                }, RESET_DELAY);
            }

            function clearErrorOnType(fieldId) {
                const field = document.getElementById(fieldId);
                if (field && field.value.trim().length >= MIN_ANSWER_LENGTH) {
                    clearError(fieldId);
                }
            }
        });

       
        function validateEmail(email) {
            const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return re.test(email);
        }

        function showError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}Error`) || document.getElementById('formError');

            if (field) field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }

        function clearError(fieldId) {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}Error`);

            if (field) field.classList.remove('error');
            if (errorElement) errorElement.style.display = 'none';
        }

        function clearErrors() {
            document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        }

      
        async function simulateEmailCheck(email) {
            return new Promise(resolve => {
                setTimeout(() => resolve(true), 500);
            });
        }

        async function simulatePasswordReset(email) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (Math.random() > 0.9) {
                        reject(new Error('Server timeout'));
                    } else {
                        console.log(`Password reset initiated for: ${email}`);
                        resolve();
                    }
                }, 1500);
            });
        }