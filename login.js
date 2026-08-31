/**
 * AI Quiz Generator - Student Authentication Module
 * Real FastAPI + MongoDB Authentication
 */

document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const loginForm = document.getElementById("loginForm");

    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");

    const emailGroup = document.getElementById("emailGroup");
    const passwordGroup = document.getElementById("passwordGroup");

    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");

    const rememberMe = document.getElementById("rememberMe");

    const btnTogglePassword = document.getElementById("btnTogglePassword");
    const btnSubmit = document.getElementById("btnSubmit");

    const statusNotification = document.getElementById("statusNotification");

    const btnGoogleLogin = document.getElementById("btnGoogleLogin");
    const btnForgotPassword = document.getElementById("btnForgotPassword");
    const btnCreateAccount = document.getElementById("btnCreateAccount");


    // =========================================================
    // EMAIL REGEX
    // =========================================================

    const EMAIL_REGEX =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


    // =========================================================
    // REMEMBER ME
    // =========================================================

    const initializeRememberedUser = () => {

        const savedEmail =
            localStorage.getItem("ai_quiz_student_email");

        if (savedEmail) {

            emailInput.value = savedEmail;
            rememberMe.checked = true;

        }
    };

    initializeRememberedUser();


    // =========================================================
    // ERROR HANDLING
    // =========================================================

    const setError = (groupElement, errorElement, message) => {

        groupElement.classList.add("invalid");

        errorElement.textContent = message;
    };


    const clearError = (groupElement, errorElement) => {

        groupElement.classList.remove("invalid");

        errorElement.textContent = "";
    };


    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    const validateEmail = () => {

        const value = emailInput.value.trim();

        if (!value) {

            setError(
                emailGroup,
                emailError,
                "Email address is required."
            );

            return false;
        }

        if (!EMAIL_REGEX.test(value)) {

            setError(
                emailGroup,
                emailError,
                "Please enter a valid email address."
            );

            return false;
        }

        clearError(emailGroup, emailError);

        return true;
    };


    // =========================================================
    // PASSWORD VALIDATION
    // =========================================================

    const validatePassword = () => {

        const value = passwordInput.value;

        if (!value) {

            setError(
                passwordGroup,
                passwordError,
                "Password is required."
            );

            return false;
        }

        if (value.length < 6) {

            setError(
                passwordGroup,
                passwordError,
                "Password must be at least 6 characters."
            );

            return false;
        }

        clearError(passwordGroup, passwordError);

        return true;
    };


    // =========================================================
    // PASSWORD SHOW / HIDE
    // =========================================================

    btnTogglePassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        btnTogglePassword.style.opacity =
            isPassword ? "1" : "0.6";

        btnTogglePassword.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );

    });


    // =========================================================
    // REAL-TIME VALIDATION
    // =========================================================

    emailInput.addEventListener("input", () => {

        if (emailGroup.classList.contains("invalid")) {

            validateEmail();

        }

    });


    passwordInput.addEventListener("input", () => {

        if (passwordGroup.classList.contains("invalid")) {

            validatePassword();

        }

    });


    // =========================================================
    // STATUS MESSAGE
    // =========================================================

    const showBannerMessage = (
        message,
        type = "error"
    ) => {

        statusNotification.textContent = message;

        statusNotification.className =
            `status-notification ${type}`;

        statusNotification.hidden = false;

    };


    const hideBannerMessage = () => {

        statusNotification.hidden = true;

        statusNotification.textContent = "";

    };


    // =========================================================
    // REAL FASTAPI LOGIN
    // =========================================================

    const performLogin = async (payload) => {

        const response = await fetch(
            "http://127.0.0.1:8000/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: payload.email,
                    password: payload.password
                })
            }
        );


        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "Unable to connect to backend."
            );

        }


        // Backend rejected login
        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Invalid email or password."
            );

        }


        // Successful login
        return data;

    };


    // =========================================================
    // LOGIN FORM SUBMIT
    // =========================================================

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            hideBannerMessage();


            // Validate fields
            const isEmailValid =
                validateEmail();

            const isPasswordValid =
                validatePassword();


            if (!isEmailValid || !isPasswordValid) {

                return;

            }


            // Loading state
            btnSubmit.disabled = true;

            btnSubmit.classList.add("loading");


            const btnText =
                btnSubmit.querySelector(".btn-text");


            const originalBtnText =
                btnText.textContent;


            btnText.textContent =
                "Signing in...";


            const loginPayload = {

                email: emailInput.value.trim(),

                password: passwordInput.value,

                rememberMe: rememberMe.checked

            };


            try {

                // =============================================
                // REAL BACKEND LOGIN
                // =============================================

                const result =
                    await performLogin(loginPayload);


                // =============================================
                // REMEMBER EMAIL
                // =============================================

                if (rememberMe.checked) {

                    localStorage.setItem(
                        "ai_quiz_student_email",
                        loginPayload.email
                    );

                } else {

                    localStorage.removeItem(
                        "ai_quiz_student_email"
                    );

                }


                // =============================================
                // SAVE JWT TOKEN
                // =============================================

                localStorage.setItem(
                    "ai_quiz_token",
                    result.token
                );


                // =============================================
                // SAVE USER INFORMATION
                // =============================================

                localStorage.setItem(
                    "ai_quiz_user",
                    JSON.stringify(result.user)
                );


                // =============================================
                // SUCCESS MESSAGE
                // =============================================

                showBannerMessage(
                    result.message ||
                    "Login successful.",
                    "success"
                );


                // =============================================
                // REDIRECT TO DASHBOARD
                // =============================================

                setTimeout(() => {

                    window.location.href =
                        "deshboard.html";

                }, 1000);


            } catch (err) {

                // =============================================
                // LOGIN FAILED
                // =============================================

                showBannerMessage(
                    err.message ||
                    "Invalid email or password.",
                    "error"
                );

            } finally {

                btnSubmit.disabled = false;

                btnSubmit.classList.remove("loading");

                btnText.textContent =
                    originalBtnText;

            }

        }
    );


    // =========================================================
    // GOOGLE LOGIN
    // =========================================================

    btnGoogleLogin.addEventListener(
        "click",
        () => {

            showBannerMessage(
                "Google Authentication is not configured yet.",
                "error"
            );

        }
    );


    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    btnForgotPassword.addEventListener(
        "click",
        () => {

            alert(
                "Password recovery will be added later."
            );

        }
    );


    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    btnCreateAccount.addEventListener(
        "click",
        () => {

            alert(
                "Student registration page will be added later."
            );

        }
    );

});