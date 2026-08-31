// profile.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Sidebar Toggle Logic (For Mobile)
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    if (menuToggle && sidebar && closeSidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });

        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // 3. Theme Toggle (Dark/Light Mode)
    const themeToggle = document.getElementById('themeToggle');
    const prefDarkMode = document.getElementById('prefDarkMode');
    const body = document.body;

    // Check saved theme in LocalStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (prefDarkMode) prefDarkMode.checked = true;
    }

    function toggleTheme() {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update both toggle button icon and settings switch
        if (prefDarkMode) prefDarkMode.checked = isDark;
        if (themeToggle) {
            themeToggle.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
            lucide.createIcons(); // Re-render icon
        }
    }

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (prefDarkMode) prefDarkMode.addEventListener('change', toggleTheme);


    // 4. Toast Notification System
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Add basic inline styles if profile.css doesn't have them
        toast.style.padding = '12px 20px';
        toast.style.margin = '10px';
        toast.style.borderRadius = '8px';
        toast.style.background = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
        toast.style.color = '#fff';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.animation = 'slideIn 0.3s ease forwards';
        
        toast.innerText = message;
        toastContainer.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }


    // 5. Personal Information Form
    const personalInfoForm = document.getElementById('personalInfoForm');
    const resetBtn = document.getElementById('resetBtn');

    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Here you would normally send data to a server
            showToast('Personal information saved successfully!', 'success');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            personalInfoForm.reset();
            showToast('Form reset to original values.', 'info');
        });
    }


    // 6. Password Visibility Toggle
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i data-lucide="eye-off"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i data-lucide="eye"></i>';
            }
            lucide.createIcons();
        });
    });


    // 7. Password Strength Checker & Validation
    const newPassword = document.getElementById('newPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordForm = document.getElementById('passwordForm');
    const confirmPassword = document.getElementById('confirmPassword');

    if (newPassword) {
        newPassword.addEventListener('input', (e) => {
            const val = e.target.value;
            let strength = 0;
            
            if (val.length >= 8) strength += 1;
            if (val.match(/[a-z]+/)) strength += 1;
            if (val.match(/[A-Z]+/)) strength += 1;
            if (val.match(/[0-9]+/)) strength += 1;
            if (val.match(/[$@#&!]+/)) strength += 1;

            // Update UI based on strength
            if (val.length === 0) {
                strengthBar.style.width = '0';
                strengthBar.style.backgroundColor = 'transparent';
                strengthText.innerText = 'Password Strength';
            } else if (strength <= 2) {
                strengthBar.style.width = '33%';
                strengthBar.style.backgroundColor = '#EF4444'; // Red (Weak)
                strengthText.innerText = 'Weak';
                strengthText.style.color = '#EF4444';
            } else if (strength === 3 || strength === 4) {
                strengthBar.style.width = '66%';
                strengthBar.style.backgroundColor = '#F59E0B'; // Orange (Medium)
                strengthText.innerText = 'Medium';
                strengthText.style.color = '#F59E0B';
            } else {
                strengthBar.style.width = '100%';
                strengthBar.style.backgroundColor = '#10B981'; // Green (Strong)
                strengthText.innerText = 'Strong';
                strengthText.style.color = '#10B981';
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (newPassword.value !== confirmPassword.value) {
                showToast('New passwords do not match!', 'error');
                return;
            }
            showToast('Password updated successfully!', 'success');
            passwordForm.reset();
            if(strengthBar) strengthBar.style.width = '0';
            if(strengthText) {
                strengthText.innerText = 'Password Strength';
                strengthText.style.color = 'inherit';
            }
        });
    }


    // 8. Profile Photo Upload Logic
    const fileInput = document.getElementById('fileInput');
    const mainAvatar = document.getElementById('mainAvatar');
    const navAvatar = document.getElementById('navAvatar');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const dropZone = document.getElementById('dropZone');
    const defaultAvatarUrl = 'https://ui-avatars.com/api/?name=Alex+Carter&background=2563EB&color=fff';

    function handleFile(file) {
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgResult = e.target.result;
                if (mainAvatar) mainAvatar.src = imgResult;
                if (navAvatar) navAvatar.src = imgResult;
                showToast('Profile photo updated successfully!', 'success');
            };
            reader.readAsDataURL(file);
        } else {
            showToast('Please upload a valid JPG or PNG image.', 'error');
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            if (mainAvatar) mainAvatar.src = defaultAvatarUrl;
            if (navAvatar) navAvatar.src = defaultAvatarUrl;
            if (fileInput) fileInput.value = '';
            showToast('Profile photo removed.', 'info');
        });
    }

    // Drag and drop for photo upload
    if (dropZone && fileInput) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.border = '2px dashed var(--primary)';
            dropZone.style.background = 'var(--primary-light)';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.border = '2px dashed var(--border-color)';
            dropZone.style.background = 'transparent';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.border = '2px dashed var(--border-color)';
            dropZone.style.background = 'transparent';
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFile(e.dataTransfer.files[0]);
            }
        });

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }


    // 9. Danger Zone & Modals
    const deleteModal = document.getElementById('deleteModal');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const cancelDelete = document.getElementById('cancelDelete');

    if (deleteAccountBtn && deleteModal) {
        deleteAccountBtn.addEventListener('click', () => {
            deleteModal.style.display = 'flex';
        });
    }

    if (cancelDelete && deleteModal) {
        cancelDelete.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }

    // Global Logout Function
    window.logoutAll = function() {
        showToast('Successfully logged out from all other devices.', 'info');
    };
});