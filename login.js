/**
 * AI Quiz Generator - Student Authentication Module
 * FastAPI + MongoDB Authentication
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

    // Optional elements: the page can work without them.
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
        try {
            const savedEmail = localStorage.getItem("ai_quiz_student_email");

            if (savedEmail && emailInput) {
                emailInput.value = savedEmail;

                if (rememberMe) {
                    rememberMe.checked = true;
                }
            }
        } catch (error) {
            console.warn("Unable to load remembered email.", error);
        }
    };

    initializeRememberedUser();

    // =========================================================
    // ERROR HANDLING
    // =========================================================

    const setError = (groupElement, errorElement, message) => {
        if (groupElement) {
            groupElement.classList.add("invalid");
        }

        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    const clearError = (groupElement, errorElement) => {
        if (groupElement) {
            groupElement.classList.remove("invalid");
        }

        if (errorElement) {
            errorElement.textContent = "";
        }
    };

    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    const validateEmail = () => {
        if (!emailInput) {
            return false;
        }

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
        if (!passwordInput) {
            return false;
        }

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

    if (btnTogglePassword && passwordInput) {
        btnTogglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            btnTogglePassword.style.opacity = isPassword ? "1" : "0.6";

            btnTogglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    }

    // =========================================================
    // REAL-TIME VALIDATION
    // =========================================================

    if (emailInput) {
        emailInput.addEventListener("input", () => {
            if (emailGroup && emailGroup.classList.contains("invalid")) {
                validateEmail();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            if (
                passwordGroup &&
                passwordGroup.classList.contains("invalid")
            ) {
                validatePassword();
            }
        });
    }

    // =========================================================
    // STATUS MESSAGE
    // =========================================================

    const showBannerMessage = (message, type = "error") => {
        if (!statusNotification) {
            // Fallback if the notification element is absent.
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        statusNotification.textContent = message;
        statusNotification.className = `status-notification ${type}`;
        statusNotification.hidden = false;
    };

    const hideBannerMessage = () => {
        if (!statusNotification) {
            return;
        }

        statusNotification.hidden = true;
        statusNotification.textContent = "";
    };

    // =========================================================
    // FASTAPI LOGIN REQUEST
    // =========================================================

    const performLogin = async (payload) => {
        let response;

        try {
            response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: payload.email,
                    password: payload.password
                })
            });
        } catch (error) {
            throw new Error(
                "Cannot connect to the backend. Check that FastAPI is running at http://127.0.0.1:8000."
            );
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "The backend returned an invalid response. Please check FastAPI."
            );
        }

        if (!response.ok) {
            const detail = data.detail || data.message;

            const errorMessage = Array.isArray(detail)
                ? detail.map((item) => item.msg || JSON.stringify(item)).join(", ")
                : typeof detail === "string"
                    ? detail
                    : "Invalid email or password.";

            throw new Error(errorMessage);
        }

        return data;
    };

    // =========================================================
    // LOGIN FORM SUBMIT
    // =========================================================

    if (!loginForm) {
        console.error('Login form with id="loginForm" was not found.');
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideBannerMessage();

        // Validate before making a backend request.
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        if (!btnSubmit) {
            showBannerMessage("Login button was not found. Check login.html.");
            return;
        }

        // Loading state.
        btnSubmit.disabled = true;
        btnSubmit.classList.add("loading");

        const btnText = btnSubmit.querySelector(".btn-text");
        const originalBtnText = btnText
            ? btnText.textContent
            : "Sign In";

        if (btnText) {
            btnText.textContent = "Signing in...";
        }

        const loginPayload = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        try {
            // Authenticate using the FastAPI backend.
            const result = await performLogin(loginPayload);

            // Save or remove remembered email.
            try {
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem(
                        "ai_quiz_student_email",
                        loginPayload.email
                    );
                } else {
                    localStorage.removeItem("ai_quiz_student_email");
                }

                // Save token only if the backend returned one.
                const token = result.access_token || result.token;

                if (token) {
                    localStorage.setItem("ai_quiz_token", token);
                }

                // Save user details if provided by the backend.
                if (result.user) {
                    localStorage.setItem(
                        "ai_quiz_user",
                        JSON.stringify(result.user)
                    );
                }
            } catch (storageError) {
                console.warn(
                    "Login succeeded, but browser storage could not be updated.",
                    storageError
                );
            }

            showBannerMessage(
                result.message || "Login successful. Opening dashboard...",
                "success"
            );

            // Redirect after successful authentication.
            window.setTimeout(() => {
                window.location.href = "deshboard.html";
            }, 1000);

        } catch (err) {
            console.error("Login error:", err);

            showBannerMessage(
                err.message || "Login failed. Please try again.",
                "error"
            );

        } finally {
            // Always restore the button, even if login fails.
            btnSubmit.disabled = false;
            btnSubmit.classList.remove("loading");

            if (btnText) {
                btnText.textContent = originalBtnText;
            }
        }
    });

    // =========================================================
    // GOOGLE LOGIN
    // =========================================================

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", () => {
            showBannerMessage(
                "Google Authentication is not configured yet.",
                "error"
            );
        });
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener("click", () => {
            alert("Password recovery will be added later.");
        });
    }

    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    if (btnCreateAccount) {
        btnCreateAccount.addEventListener("click", () => {
            alert("Student registration page will be added later.");
        });
    }
});
/**
 * AI Quiz Generator - Student Authentication Module
 * FastAPI + MongoDB Authentication
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

    // Optional elements: the page can work without them.
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
        try {
            const savedEmail = localStorage.getItem("ai_quiz_student_email");

            if (savedEmail && emailInput) {
                emailInput.value = savedEmail;

                if (rememberMe) {
                    rememberMe.checked = true;
                }
            }
        } catch (error) {
            console.warn("Unable to load remembered email.", error);
        }
    };

    initializeRememberedUser();

    // =========================================================
    // ERROR HANDLING
    // =========================================================

    const setError = (groupElement, errorElement, message) => {
        if (groupElement) {
            groupElement.classList.add("invalid");
        }

        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    const clearError = (groupElement, errorElement) => {
        if (groupElement) {
            groupElement.classList.remove("invalid");
        }

        if (errorElement) {
            errorElement.textContent = "";
        }
    };

    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    const validateEmail = () => {
        if (!emailInput) {
            return false;
        }

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
        if (!passwordInput) {
            return false;
        }

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

    if (btnTogglePassword && passwordInput) {
        btnTogglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            btnTogglePassword.style.opacity = isPassword ? "1" : "0.6";

            btnTogglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    }

    // =========================================================
    // REAL-TIME VALIDATION
    // =========================================================

    if (emailInput) {
        emailInput.addEventListener("input", () => {
            if (emailGroup && emailGroup.classList.contains("invalid")) {
                validateEmail();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            if (
                passwordGroup &&
                passwordGroup.classList.contains("invalid")
            ) {
                validatePassword();
            }
        });
    }

    // =========================================================
    // STATUS MESSAGE
    // =========================================================

    const showBannerMessage = (message, type = "error") => {
        if (!statusNotification) {
            // Fallback if the notification element is absent.
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        statusNotification.textContent = message;
        statusNotification.className = `status-notification ${type}`;
        statusNotification.hidden = false;
    };

    const hideBannerMessage = () => {
        if (!statusNotification) {
            return;
        }

        statusNotification.hidden = true;
        statusNotification.textContent = "";
    };

    // =========================================================
    // FASTAPI LOGIN REQUEST
    // =========================================================

    const performLogin = async (payload) => {
        let response;

        try {
            response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: payload.email,
                    password: payload.password
                })
            });
        } catch (error) {
            throw new Error(
                "Cannot connect to the backend. Check that FastAPI is running at http://127.0.0.1:8000."
            );
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "The backend returned an invalid response. Please check FastAPI."
            );
        }

        if (!response.ok) {
            const detail = data.detail || data.message;

            const errorMessage = Array.isArray(detail)
                ? detail.map((item) => item.msg || JSON.stringify(item)).join(", ")
                : typeof detail === "string"
                    ? detail
                    : "Invalid email or password.";

            throw new Error(errorMessage);
        }

        return data;
    };

    // =========================================================
    // LOGIN FORM SUBMIT
    // =========================================================

    if (!loginForm) {
        console.error('Login form with id="loginForm" was not found.');
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideBannerMessage();

        // Validate before making a backend request.
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        if (!btnSubmit) {
            showBannerMessage("Login button was not found. Check login.html.");
            return;
        }

        // Loading state.
        btnSubmit.disabled = true;
        btnSubmit.classList.add("loading");

        const btnText = btnSubmit.querySelector(".btn-text");
        const originalBtnText = btnText
            ? btnText.textContent
            : "Sign In";

        if (btnText) {
            btnText.textContent = "Signing in...";
        }

        const loginPayload = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        try {
            // Authenticate using the FastAPI backend.
            const result = await performLogin(loginPayload);

            // Save or remove remembered email.
            try {
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem(
                        "ai_quiz_student_email",
                        loginPayload.email
                    );
                } else {
                    localStorage.removeItem("ai_quiz_student_email");
                }

                // Save token only if the backend returned one.
                const token = result.access_token || result.token;

                if (token) {
                    localStorage.setItem("ai_quiz_token", token);
                }

                // Save user details if provided by the backend.
                if (result.user) {
                    localStorage.setItem(
                        "ai_quiz_user",
                        JSON.stringify(result.user)
                    );
                }
            } catch (storageError) {
                console.warn(
                    "Login succeeded, but browser storage could not be updated.",
                    storageError
                );
            }

            showBannerMessage(
                result.message || "Login successful. Opening dashboard...",
                "success"
            );

            // Redirect after successful authentication.
            window.setTimeout(() => {
                window.location.href = "deshboard.html";
            }, 1000);

        } catch (err) {
            console.error("Login error:", err);

            showBannerMessage(
                err.message || "Login failed. Please try again.",
                "error"
            );

        } finally {
            // Always restore the button, even if login fails.
            btnSubmit.disabled = false;
            btnSubmit.classList.remove("loading");

            if (btnText) {
                btnText.textContent = originalBtnText;
            }
        }
    });

    // =========================================================
    // GOOGLE LOGIN
    // =========================================================

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", () => {
            showBannerMessage(
                "Google Authentication is not configured yet.",
                "error"
            );
        });
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener("click", () => {
            alert("Password recovery will be added later.");
        });
    }

    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    if (btnCreateAccount) {
        btnCreateAccount.addEventListener("click", () => {
            alert("Student registration page will be added later.");
        });
    }
});
/**
 * AI Quiz Generator - Student Authentication Module
 * FastAPI + MongoDB Authentication
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

    // Optional elements: the page can work without them.
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
        try {
            const savedEmail = localStorage.getItem("ai_quiz_student_email");

            if (savedEmail && emailInput) {
                emailInput.value = savedEmail;

                if (rememberMe) {
                    rememberMe.checked = true;
                }
            }
        } catch (error) {
            console.warn("Unable to load remembered email.", error);
        }
    };

    initializeRememberedUser();

    // =========================================================
    // ERROR HANDLING
    // =========================================================

    const setError = (groupElement, errorElement, message) => {
        if (groupElement) {
            groupElement.classList.add("invalid");
        }

        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    const clearError = (groupElement, errorElement) => {
        if (groupElement) {
            groupElement.classList.remove("invalid");
        }

        if (errorElement) {
            errorElement.textContent = "";
        }
    };

    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    const validateEmail = () => {
        if (!emailInput) {
            return false;
        }

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
        if (!passwordInput) {
            return false;
        }

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

    if (btnTogglePassword && passwordInput) {
        btnTogglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            btnTogglePassword.style.opacity = isPassword ? "1" : "0.6";

            btnTogglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    }

    // =========================================================
    // REAL-TIME VALIDATION
    // =========================================================

    if (emailInput) {
        emailInput.addEventListener("input", () => {
            if (emailGroup && emailGroup.classList.contains("invalid")) {
                validateEmail();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            if (
                passwordGroup &&
                passwordGroup.classList.contains("invalid")
            ) {
                validatePassword();
            }
        });
    }

    // =========================================================
    // STATUS MESSAGE
    // =========================================================

    const showBannerMessage = (message, type = "error") => {
        if (!statusNotification) {
            // Fallback if the notification element is absent.
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        statusNotification.textContent = message;
        statusNotification.className = `status-notification ${type}`;
        statusNotification.hidden = false;
    };

    const hideBannerMessage = () => {
        if (!statusNotification) {
            return;
        }

        statusNotification.hidden = true;
        statusNotification.textContent = "";
    };

    // =========================================================
    // FASTAPI LOGIN REQUEST
    // =========================================================

    const performLogin = async (payload) => {
        let response;

        try {
            response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: payload.email,
                    password: payload.password
                })
            });
        } catch (error) {
            throw new Error(
                "Cannot connect to the backend. Check that FastAPI is running at http://127.0.0.1:8000."
            );
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "The backend returned an invalid response. Please check FastAPI."
            );
        }

        if (!response.ok) {
            const detail = data.detail || data.message;

            const errorMessage = Array.isArray(detail)
                ? detail.map((item) => item.msg || JSON.stringify(item)).join(", ")
                : typeof detail === "string"
                    ? detail
                    : "Invalid email or password.";

            throw new Error(errorMessage);
        }

        return data;
    };

    // =========================================================
    // LOGIN FORM SUBMIT
    // =========================================================

    if (!loginForm) {
        console.error('Login form with id="loginForm" was not found.');
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideBannerMessage();

        // Validate before making a backend request.
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        if (!btnSubmit) {
            showBannerMessage("Login button was not found. Check login.html.");
            return;
        }

        // Loading state.
        btnSubmit.disabled = true;
        btnSubmit.classList.add("loading");

        const btnText = btnSubmit.querySelector(".btn-text");
        const originalBtnText = btnText
            ? btnText.textContent
            : "Sign In";

        if (btnText) {
            btnText.textContent = "Signing in...";
        }

        const loginPayload = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        try {
            // Authenticate using the FastAPI backend.
            const result = await performLogin(loginPayload);

            // Save or remove remembered email.
            try {
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem(
                        "ai_quiz_student_email",
                        loginPayload.email
                    );
                } else {
                    localStorage.removeItem("ai_quiz_student_email");
                }

                // Save token only if the backend returned one.
                const token = result.access_token || result.token;

                if (token) {
                    localStorage.setItem("ai_quiz_token", token);
                }

                // Save user details if provided by the backend.
                if (result.user) {
                    localStorage.setItem(
                        "ai_quiz_user",
                        JSON.stringify(result.user)
                    );
                }
            } catch (storageError) {
                console.warn(
                    "Login succeeded, but browser storage could not be updated.",
                    storageError
                );
            }

            showBannerMessage(
                result.message || "Login successful. Opening dashboard...",
                "success"
            );

            // Redirect after successful authentication.
            window.setTimeout(() => {
                window.location.href = "deshboard.html";
            }, 1000);

        } catch (err) {
            console.error("Login error:", err);

            showBannerMessage(
                err.message || "Login failed. Please try again.",
                "error"
            );

        } finally {
            // Always restore the button, even if login fails.
            btnSubmit.disabled = false;
            btnSubmit.classList.remove("loading");

            if (btnText) {
                btnText.textContent = originalBtnText;
            }
        }
    });

    // =========================================================
    // GOOGLE LOGIN
    // =========================================================

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", () => {
            showBannerMessage(
                "Google Authentication is not configured yet.",
                "error"
            );
        });
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener("click", () => {
            alert("Password recovery will be added later.");
        });
    }

    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    if (btnCreateAccount) {
        btnCreateAccount.addEventListener("click", () => {
            alert("Student registration page will be added later.");
        });
    }
});
/**
 * AI Quiz Generator - Student Authentication Module
 * FastAPI + MongoDB Authentication
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

    // Optional elements: the page can work without them.
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
        try {
            const savedEmail = localStorage.getItem("ai_quiz_student_email");

            if (savedEmail && emailInput) {
                emailInput.value = savedEmail;

                if (rememberMe) {
                    rememberMe.checked = true;
                }
            }
        } catch (error) {
            console.warn("Unable to load remembered email.", error);
        }
    };

    initializeRememberedUser();

    // =========================================================
    // ERROR HANDLING
    // =========================================================

    const setError = (groupElement, errorElement, message) => {
        if (groupElement) {
            groupElement.classList.add("invalid");
        }

        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    const clearError = (groupElement, errorElement) => {
        if (groupElement) {
            groupElement.classList.remove("invalid");
        }

        if (errorElement) {
            errorElement.textContent = "";
        }
    };

    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    const validateEmail = () => {
        if (!emailInput) {
            return false;
        }

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
        if (!passwordInput) {
            return false;
        }

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

    if (btnTogglePassword && passwordInput) {
        btnTogglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            btnTogglePassword.style.opacity = isPassword ? "1" : "0.6";

            btnTogglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    }

    // =========================================================
    // REAL-TIME VALIDATION
    // =========================================================

    if (emailInput) {
        emailInput.addEventListener("input", () => {
            if (emailGroup && emailGroup.classList.contains("invalid")) {
                validateEmail();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            if (
                passwordGroup &&
                passwordGroup.classList.contains("invalid")
            ) {
                validatePassword();
            }
        });
    }

    // =========================================================
    // STATUS MESSAGE
    // =========================================================

    const showBannerMessage = (message, type = "error") => {
        if (!statusNotification) {
            // Fallback if the notification element is absent.
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        statusNotification.textContent = message;
        statusNotification.className = `status-notification ${type}`;
        statusNotification.hidden = false;
    };

    const hideBannerMessage = () => {
        if (!statusNotification) {
            return;
        }

        statusNotification.hidden = true;
        statusNotification.textContent = "";
    };

    // =========================================================
    // FASTAPI LOGIN REQUEST
    // =========================================================

    const performLogin = async (payload) => {
        let response;

        try {
            response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: payload.email,
                    password: payload.password
                })
            });
        } catch (error) {
            throw new Error(
                "Cannot connect to the backend. Check that FastAPI is running at http://127.0.0.1:8000."
            );
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "The backend returned an invalid response. Please check FastAPI."
            );
        }

        if (!response.ok) {
            const detail = data.detail || data.message;

            const errorMessage = Array.isArray(detail)
                ? detail.map((item) => item.msg || JSON.stringify(item)).join(", ")
                : typeof detail === "string"
                    ? detail
                    : "Invalid email or password.";

            throw new Error(errorMessage);
        }

        return data;
    };

    // =========================================================
    // LOGIN FORM SUBMIT
    // =========================================================

    if (!loginForm) {
        console.error('Login form with id="loginForm" was not found.');
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideBannerMessage();

        // Validate before making a backend request.
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        if (!btnSubmit) {
            showBannerMessage("Login button was not found. Check login.html.");
            return;
        }

        // Loading state.
        btnSubmit.disabled = true;
        btnSubmit.classList.add("loading");

        const btnText = btnSubmit.querySelector(".btn-text");
        const originalBtnText = btnText
            ? btnText.textContent
            : "Sign In";

        if (btnText) {
            btnText.textContent = "Signing in...";
        }

        const loginPayload = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        try {
            // Authenticate using the FastAPI backend.
            const result = await performLogin(loginPayload);

            // Save or remove remembered email.
            try {
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem(
                        "ai_quiz_student_email",
                        loginPayload.email
                    );
                } else {
                    localStorage.removeItem("ai_quiz_student_email");
                }

                // Save token only if the backend returned one.
                const token = result.access_token || result.token;

                if (token) {
                    localStorage.setItem("ai_quiz_token", token);
                }

                // Save user details if provided by the backend.
                if (result.user) {
                    localStorage.setItem(
                        "ai_quiz_user",
                        JSON.stringify(result.user)
                    );
                }
            } catch (storageError) {
                console.warn(
                    "Login succeeded, but browser storage could not be updated.",
                    storageError
                );
            }

            showBannerMessage(
                result.message || "Login successful. Opening dashboard...",
                "success"
            );

            // Redirect after successful authentication.
            window.setTimeout(() => {
                window.location.href = "deshboard.html";
            }, 1000);

        } catch (err) {
            console.error("Login error:", err);

            showBannerMessage(
                err.message || "Login failed. Please try again.",
                "error"
            );

        } finally {
            // Always restore the button, even if login fails.
            btnSubmit.disabled = false;
            btnSubmit.classList.remove("loading");

            if (btnText) {
                btnText.textContent = originalBtnText;
            }
        }
    });

    // =========================================================
    // GOOGLE LOGIN
    // =========================================================

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", () => {
            showBannerMessage(
                "Google Authentication is not configured yet.",
                "error"
            );
        });
    }

    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener("click", () => {
            alert("Password recovery will be added later.");
        });
    }

    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

});
