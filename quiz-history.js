document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Sidebar Mobile Toggle Logic
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const closeBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');

    if(toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    
    if(closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Close sidebar if user clicks outside of it on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (sidebar && !sidebar.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target) && closeBtn && !closeBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // 3. Button Ripple Effect Logic
    const rippleButtons = document.querySelectorAll('.ripple');
    
    rippleButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-span');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            // Remove span after animation completes
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // 4. Export Button Functionality (Mockup)
    const exportBtn = document.querySelector('.export-btn');
    if(exportBtn) {
        exportBtn.addEventListener('click', () => {
            // Add loading state
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i data-lucide="loader-2" class="icon-sm spin" style="margin-right: 5px;"></i> Exporting...';
            lucide.createIcons(); // Re-initialize the new loader icon
            
            // Simulate API Call / Export Process
            setTimeout(() => {
                exportBtn.innerHTML = originalText;
                lucide.createIcons(); // Re-initialize original icon
                alert('History exported successfully as CSV!');
            }, 1500);
        });
    }

    // 5. Search functionality (Client-side filtering mockup)
    const searchInput = document.querySelector('.search-box input');
    const tableRows = document.querySelectorAll('.history-table tbody tr');

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            tableRows.forEach(row => {
                const quizName = row.querySelector('td:first-child').textContent.toLowerCase();
                if(quizName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // 6. Action Buttons Tooltips/Actions
    const actionBtns = document.querySelectorAll('.btn-icon');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('title');
            const quizName = this.closest('tr').querySelector('td:first-child').textContent;
            console.log(`Action: ${action} triggered for ${quizName}`);
            // Navigation simulation: window.location.href = `/results/${quizId}`
        });
    });
});