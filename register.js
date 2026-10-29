
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const button = document.getElementById("registerButton");
  const buttonText = document.getElementById("buttonText");
  const statusMessage = document.getElementById("statusMessage");

  const showMessage = (message, type) => {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.hidden = false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusMessage.hidden = true;

    const password = document.getElementById("password").value;

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }

    // bcrypt normally supports a maximum of 72 password bytes.
    if (new TextEncoder().encode(password).length > 72) {
      showMessage("Password is too long. Please use a shorter password.", "error");
      return;
    }

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      password,
      college: document.getElementById("college").value.trim(),
      semester: document.getElementById("semester").value,
      department: document.getElementById("department").value.trim()
    };

    if (!payload.name) {
      showMessage("Please enter your full name.", "error");
      return;
    }

    button.disabled = true;
    buttonText.textContent = "Creating account...";

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail || data.message || "Registration failed.";
        throw new Error(
          Array.isArray(detail)
            ? detail.map(item => item.msg || "Invalid input").join(", ")
            : detail
        );
      }

      showMessage(
        "Account created successfully! Redirecting to Login...",
        "success"
      );

      form.reset();

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);

      showMessage(
        error.message.includes("Failed to fetch")
          ? "Cannot connect to FastAPI. Check that the backend is running."
          : error.message,
        "error"
      );

    } finally {
      button.disabled = false;
      buttonText.textContent = "Create Account";
    }
  });
});
