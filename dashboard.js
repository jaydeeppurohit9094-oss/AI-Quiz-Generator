// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Current Date Display
    // ==========================================
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // ==========================================
    // 2. Sidebar Toggle Logic (Mobile)
    // ==========================================
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    if (menuToggle && sidebar && closeSidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.add('active'));
        closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));
    }

    // ==========================================
    // 3. Theme Toggle (Dark/Light Mode)
    // ==========================================
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    }

    function toggleTheme() {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        if (themeToggle) {
            themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // ==========================================
    // 4. Toast Notification System
    // ==========================================
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Dynamic styling for the toast
        toast.style.padding = '12px 20px';
        toast.style.margin = '10px 0';
        toast.style.borderRadius = '8px';
        toast.style.background = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
        toast.style.color = '#fff';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '8px';
        toast.style.animation = 'slideInRight 0.3s ease forwards';
        
        const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        
        toastContainer.appendChild(toast);

        // Remove toast automatically after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==========================================
    // 5. Upload Modal & File Handling Logic
    // ==========================================
    const uploadModal = document.getElementById('upload-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const btnUploadSidebar = document.getElementById('btn-upload-sidebar');
    const btnUploadHero = document.querySelector('.hero-actions .btn-primary'); // Selects the upload button in hero section
    
    // File elements
    const dropZone = document.getElementById('modal-drop-zone');
    const fileInput = document.getElementById('modal-file-input');
    const btnChooseFile = document.getElementById('modal-btn-choose-file');
    
    // Progress elements
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('progress-bar');
    const uploadPercentage = document.getElementById('upload-percentage');
    const uploadingFileName = document.getElementById('uploading-file-name');
    
    // Info & Action elements
    const fileInfoCard = document.getElementById('file-info-card');
    const btnRemove = document.getElementById('btn-remove');
    const btnGenerate = document.getElementById('btn-generate');

    // 5.1 Open/Close Modal Setup
    function openModal(e) {
        if(e) e.preventDefault(); // Prevent navigating to upload.html
        uploadModal.classList.remove('hidden');
    }

    function closeModal() {
        uploadModal.classList.add('hidden');
    }

    if (btnUploadSidebar) btnUploadSidebar.addEventListener('click', openModal);
    if (btnUploadHero) {
        btnUploadHero.removeAttribute('onclick'); // Remove inline onclick redirect
        btnUploadHero.addEventListener('click', openModal);
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeModal();
    });

    // 5.2 Drag & Drop Handlers
    if (dropZone && fileInput) {
        btnChooseFile.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-active');
            dropZone.style.border = '2px dashed var(--primary)';
            dropZone.style.background = 'rgba(37, 99, 235, 0.05)';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');
            dropZone.style.border = '2px dashed var(--border-color)';
            dropZone.style.background = 'transparent';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');
            dropZone.style.border = '2px dashed var(--border-color)';
            dropZone.style.background = 'transparent';
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    // 5.3 Process the Uploaded File
    function handleFileUpload(file) {
        // Validate File Size (100MB Limit)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            showToast('File is too large. Maximum size is 100MB.', 'error');
            return;
        }

        // Validate File Type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', '.ppt'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        dropZone.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        uploadingFileName.textContent = `Uploading ${file.name}...`;

        // Simulate Upload Progress
        let progress = 0;
        progressBar.style.width = '0%';
        btnGenerate.disabled = true;
        btnRemove.classList.add('hidden');

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 10) + 5; // Increase by 5-15% randomly
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Show completion logic after a tiny delay for smooth animation
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    displayFileInfo(file, fileExtension);
                }, 500);
            }
            
            progressBar.style.width = `${progress}%`;
            uploadPercentage.textContent = `${progress}%`;
        }, 300);
    }

    // 5.4 Display File Details After Upload
    function displayFileInfo(file, extension) {
        fileInfoCard.classList.remove('hidden');
        btnRemove.classList.remove('hidden');
        btnGenerate.disabled = false;

        // Set Details in UI
        document.getElementById('info-name').textContent = file.name;
        document.getElementById('info-size').textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        document.getElementById('info-type').textContent = extension.toUpperCase();
        
        // Format Current Time
        const now = new Date();
        document.getElementById('info-time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Mock pages based on file size for demo purposes
        const mockPages = Math.max(1, Math.floor(file.size / 50000));
        document.getElementById('info-pages').textContent = extension === 'txt' ? 'N/A' : mockPages;
        
        showToast('File uploaded successfully!', 'success');
    }

    // 5.5 Remove File / Reset Modal
    if (btnRemove) {
        btnRemove.addEventListener('click', () => {
            fileInput.value = ''; // Clear input
            fileInfoCard.classList.add('hidden');
            progressContainer.classList.add('hidden');
            dropZone.classList.remove('hidden');
            btnRemove.classList.add('hidden');
            btnGenerate.disabled = true;
            
            progressBar.style.width = '0%';
            uploadPercentage.textContent = '0%';
            
            showToast('File removed.', 'info');
        });
    }

    // 5.6 Generate Quiz Action
    if (btnGenerate) {
        btnGenerate.addEventListener('click', () => {
            btnGenerate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            btnGenerate.disabled = true;
            
            showToast('AI is analyzing your material...', 'info');
            
            // Simulate AI generation time
            setTimeout(() => {
                showToast('Quiz generated successfully!', 'success');
                btnGenerate.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Quiz';
                btnGenerate.disabled = false;
                closeModal();
                
                // You can redirect to quiz view here if needed
                // window.location.href = 'quiz-view.html';
            }, 2500);
        });
    }

});
document.addEventListener("DOMContentLoaded", () => {
    // Select all value elements inside the cards
    const valueElements = document.querySelectorAll('.stat-value');

    // Function to animate the numbers
    const animateCounter = (element) => {
        // Get target number and suffix (%, hrs, etc.) from dataset
        const targetNumber = parseInt(element.getAttribute('data-target'));
        const suffix = element.getAttribute('data-suffix') || '';
        
        let currentNumber = 0;
        
        // Duration and step calculation for smooth animation
        const duration = 1500; // Total animation time in milliseconds
        const frameRate = 30; // Frames per second equivalent speed
        const totalFrames = Math.round(duration / frameRate);
        const increment = targetNumber / totalFrames;

        const counterInterval = setInterval(() => {
            currentNumber += increment;
            
            if (currentNumber >= targetNumber) {
                // Animation complete, set the exact target value
                element.innerText = targetNumber + suffix;
                clearInterval(counterInterval);
            } else {
                // Update text during animation
                element.innerText = Math.ceil(currentNumber) + suffix;
            }
        }, frameRate);
    };

    // Run the animation for each card with a slight stagger delay
    // This perfectly matches the CSS slide-up animation timing
    valueElements.forEach((element, index) => {
        // Delay animation to sync with CSS fade-in
        setTimeout(() => {
            animateCounter(element);
        }, 150 * (index + 1)); 
    });
});