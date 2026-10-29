
"use strict";

// ========================================
// AI Quiz Generator - Profile Management
// ========================================

const API_BASE_URL = "http://127.0.0.1:8000";

let originalProfile = {};
let selectedPhotoFile = null;
let removePhotoRequested = false;

// ---------- DOM Helpers ----------

const getElement = (id) => document.getElementById(id);

function getToken() {
    const keys = [
        "ai_quiz_token",
        "access_token",
        "token",
        "jwt_token"
    ];

    for (const key of keys) {
        const token =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (token) return token;
    }

    return null;
}

function showToast(message, type = "success") {
    const container = getElement("toastContainer");

    if (!container) {
        console.log(message);
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

async function apiRequest(path, options = {}) {
    const token = getToken();

    if (!token) {
        throw new Error(
            "Login token મળ્યો નથી. કૃપા કરીને logout કરીને ફરી login કરો."
        );
    }

    const headers = {
        "Authorization": `Bearer ${token}`,
        ...(options.headers || {})
    };

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const responseText = await response.text();
    let data = {};

    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { detail: responseText };
    }

    if (!response.ok) {
        const detail = Array.isArray(data.detail)
            ? data.detail.map(item => item.msg || "").join(", ")
            : data.detail || data.message;

        if (response.status === 401) {
            throw new Error(
                "Login session પૂરી થઈ ગઈ છે. ફરી login કરો."
            );
        }

        throw new Error(
            detail || `Request failed (${response.status})`
        );
    }

    return data;
}

// ---------- Form Fields ----------

function getFormFields() {
    return {
        name: getElement("fullName"),
        email: getElement("email"),
        college: getElement("college"),
        department: getElement("department"),
        semester: getElement("semester"),
        mobile: getElement("mobile"),
        dob: getElement("dob"),
        enrollment: getElement("enrollment")
    };
}

function getDepartmentValue(value) {
    const select = getElement("department");
    if (!select || !value) return "";

    const normalized = String(value).trim().toLowerCase();

    const aliases = {
        "computer": ["cs", "computer science"],
        "computer science": ["cs", "computer"],
        "cs": ["computer", "computer science"],
        "information technology": ["it"],
        "it": ["information technology"],
        "electronics": ["ec"],
        "ec": ["electronics"]
    };

    const possibleValues = [
        normalized,
        ...(aliases[normalized] || [])
    ];

    for (const option of select.options) {
        const optionValue = option.value.trim().toLowerCase();
        const optionText = option.textContent.trim().toLowerCase();

        if (
            possibleValues.includes(optionValue) ||
            possibleValues.includes(optionText)
        ) {
            return option.value;
        }
    }

    return "";
}

// ---------- Profile Display ----------

function displayProfile(profile) {
    const fields = getFormFields();

    if (fields.name) {
        fields.name.value = profile.name || "";
    }

    if (fields.email) {
        fields.email.value = profile.email || "";
    }

    if (fields.college) {
        fields.college.value = profile.college || "";
    }

    if (fields.department) {
        fields.department.value =
            getDepartmentValue(profile.department || "");
    }

    if (fields.semester) {
        fields.semester.value = profile.semester || "";
    }

    // These fields are not currently supported by the profile API.
    if (fields.mobile) fields.mobile.value = "";
    if (fields.dob) fields.dob.value = "";
    if (fields.enrollment) fields.enrollment.value = "";

    // Update the profile heading.
    const displayName = getElement("profileDisplayName");
    const displayEmail = getElement("profileDisplayEmail");
    const memberSince = getElement("profileMemberSince");

    if (displayName) {
        displayName.textContent = profile.name || "Student";
    }

    if (displayEmail) {
        displayEmail.textContent = profile.email || "";
    }

    if (memberSince) {
        if (profile.created_at) {
            const date = new Date(profile.created_at);

            memberSince.textContent =
                !Number.isNaN(date.getTime())
                    ? date.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                    })
                    : "Not available";
        } else {
            memberSince.textContent = "Not available";
        }
    }

    // Display saved profile photo if the backend provides one.
    if (profile.profile_photo) {
        setAvatar(profile.profile_photo);
    } else {
        setAvatar("");
    }
}

function getFormProfile() {
    const fields = getFormFields();

    return {
        name: fields.name?.value.trim() || "",
        email: fields.email?.value.trim() || "",
        college: fields.college?.value.trim() || "",
        department:
            fields.department?.selectedOptions[0]?.textContent.trim() || "",
        semester: fields.semester?.value || ""
    };
}

function setAvatar(source) {
    const ids = ["mainAvatar", "navAvatar"];

    ids.forEach(id => {
        const element = getElement(id);
        if (!element) return;

        if (element.tagName === "IMG") {
            if (source) {
                element.src = source;
            } else {
                element.removeAttribute("src");
            }
        } else {
            element.style.backgroundImage = source
                ? `url("${source}")`
                : "";

            element.style.backgroundSize = "cover";
            element.style.backgroundPosition = "center";
        }
    });
}

// ---------- Load Profile ----------

async function loadProfile() {
    const fields = getFormFields();

    // Clear hardcoded demo values immediately.
    Object.values(fields).forEach(field => {
        if (field && !field.disabled) {
            field.value = "";
        }
    });

    const displayName = getElement("profileDisplayName");
    const displayEmail = getElement("profileDisplayEmail");
    const memberSince = getElement("profileMemberSince");

    if (displayName) displayName.textContent = "";
    if (displayEmail) displayEmail.textContent = "";
    if (memberSince) memberSince.textContent = "";

    try {
        const data = await apiRequest("/profile/", {
            method: "GET"
        });

        const profile = data.profile || data;

        if (data.message === "No user found" || !profile) {
            throw new Error("Profile data મળ્યો નથી.");
        }

        displayProfile(profile);

        originalProfile = getFormProfile();
        originalProfile.profile_photo = profile.profile_photo || "";

    } catch (error) {
        console.error("Load profile error:", error);
        showToast(error.message || "Profile load થઈ શક્યું નથી.", "error");
    }
}

// ---------- Save Profile ----------

const personalInfoForm = getElement("personalInfoForm");

if (personalInfoForm) {
    personalInfoForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fields = getFormFields();

        if (!fields.name?.value.trim()) {
            showToast("તમારું નામ દાખલ કરો.", "error");
            fields.name?.focus();
            return;
        }

        if (!fields.email?.value.trim()) {
            showToast("તમારો email દાખલ કરો.", "error");
            fields.email?.focus();
            return;
        }

        const submitButton = personalInfoForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const originalButtonText = submitButton
            ? submitButton.textContent
            : "";

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Saving...";
            }

            const payload = getFormProfile();

            const data = await apiRequest("/profile/", {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            const updatedProfile = data.profile || {
                ...payload,
                ...(data.user || {})
            };

            displayProfile(updatedProfile);

            originalProfile = getFormProfile();
            originalProfile.profile_photo =
                updatedProfile.profile_photo || "";

            showToast(
                data.message || "Profile changes saved successfully!"
            );

        } catch (error) {
            console.error("Save profile error:", error);
            showToast(
                error.message || "Profile save થઈ શક્યું નથી.",
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}

// ---------- Reset Form ----------

const resetButton = getElement("resetBtn");

if (resetButton) {
    resetButton.addEventListener("click", function (event) {
        event.preventDefault();

        const fields = getFormFields();

        if (fields.name) fields.name.value = originalProfile.name || "";
        if (fields.email) fields.email.value = originalProfile.email || "";
        if (fields.college) fields.college.value = originalProfile.college || "";
        if (fields.semester) fields.semester.value = originalProfile.semester || "";

        if (fields.department) {
            fields.department.value =
                getDepartmentValue(originalProfile.department || "");
        }

        if (fields.mobile) fields.mobile.value = "";
        if (fields.dob) fields.dob.value = "";
        if (fields.enrollment) fields.enrollment.value = "";

        selectedPhotoFile = null;
        removePhotoRequested = false;

        const fileInput = getElement("fileInput");
        if (fileInput) fileInput.value = "";

        setAvatar(originalProfile.profile_photo || "");

        showToast("Saved information restored.");
    });
}

// ---------- Profile Photo Preview ----------

const fileInput = getElement("fileInput");

if (fileInput) {
    fileInput.addEventListener("change", function () {
        const file = fileInput.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("કૃપા કરીને image file પસંદ કરો.", "error");
            fileInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Photo 5 MB કરતાં નાનો હોવો જોઈએ.", "error");
            fileInput.value = "";
            return;
        }

        selectedPhotoFile = file;
        removePhotoRequested = false;

        const reader = new FileReader();

        reader.onload = function () {
            setAvatar(reader.result);
        };

        reader.readAsDataURL(file);

        showToast("Photo preview updated. Save/upload support is required to keep it after refresh.");
    });
}

const dropZone = getElement("dropZone");

if (dropZone && fileInput) {
    dropZone.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        fileInput.click();
    });

    dropZone.addEventListener("dragover", function (event) {
        event.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", function () {
        dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", function (event) {
        event.preventDefault();
        dropZone.classList.remove("drag-over");

        const file = event.dataTransfer?.files?.[0];
        if (!file) return;

        if (typeof DataTransfer !== "undefined") {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
            fileInput.dispatchEvent(new Event("change"));
        }
    });
}

const removePhotoButton = getElement("removePhotoBtn");

if (removePhotoButton) {
    removePhotoButton.addEventListener("click", function (event) {
        event.preventDefault();

        selectedPhotoFile = null;
        removePhotoRequested = true;

        if (fileInput) fileInput.value = "";

        setAvatar("");

        showToast(
            "Photo preview removed. Permanent removal requires backend support."
        );
    });
}

// ---------- Theme Toggle ----------

const themeToggle = getElement("themeToggle");

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const darkMode = document.body.classList.contains("dark-mode");
        localStorage.setItem("profile_dark_mode", String(darkMode));
    });
}

if (localStorage.getItem("profile_dark_mode") === "true") {
    document.body.classList.add("dark-mode");
}

// ---------- Sidebar ----------

const menuToggle = getElement("menuToggle");
const closeSidebar = getElement("closeSidebar");
const sidebar = getElement("sidebar");

if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
        sidebar.classList.add("active");
    });
}

if (closeSidebar && sidebar) {
    closeSidebar.addEventListener("click", function () {
        sidebar.classList.remove("active");
    });
}

// ---------- Delete Modal ----------

const deleteModal = getElement("deleteModal");
const cancelDelete = getElement("cancelDelete");

if (cancelDelete && deleteModal) {
    cancelDelete.addEventListener("click", function () {
        deleteModal.classList.remove("active");
        deleteModal.style.display = "none";
    });
}

// Account deletion and permanent photo upload require backend endpoints.

// ---------- Initialize ----------

document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
});
