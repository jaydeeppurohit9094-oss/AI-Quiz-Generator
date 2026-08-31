// Get Elements
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const progressPercent = document.getElementById('progressPercent');

const valName = document.getElementById('valName');
const valStatus = document.getElementById('valStatus');
const valSize = document.getElementById('valSize');
const valTime = document.getElementById('valTime');
const valType = document.getElementById('valType');

const btnRemove = document.getElementById('btnRemove');
const btnGenerate = document.getElementById('btnGenerate');
const btnClose = document.getElementById('btnClose'); // New Close Button

let uploadInterval;

// 1. File Selection Logic
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  
  if (file) {
    valName.textContent = file.name;
    valSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    valType.textContent = file.name.split('.').pop().toUpperCase();
    
    const now = new Date();
    valTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    valStatus.textContent = 'Uploading...';
    valStatus.classList.remove('success');
    progressLabel.textContent = 'Uploading file...';
    
    simulateUpload();
  }
});

// 2. Simulate Upload Progress
function simulateUpload() {
  let progress = 0;
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  clearInterval(uploadInterval); 
  
  uploadInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5; 
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(uploadInterval);
      
      valStatus.textContent = 'Uploaded Successfully';
      valStatus.classList.add('success');
      progressLabel.textContent = 'Upload Complete';
    }
    
    progressBar.style.width = progress + '%';
    progressPercent.textContent = progress + '%';
  }, 300);
}

// 3. Remove File Logic
btnRemove.addEventListener('click', function() {
  fileInput.value = ''; 
  clearInterval(uploadInterval); 
  
  valName.textContent = '--';
  valSize.textContent = '--';
  valType.textContent = '--';
  valTime.textContent = '--';
  
  valStatus.textContent = 'Waiting for file...';
  valStatus.classList.remove('success');
  
  progressLabel.textContent = 'Waiting for file...';
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
});

// 4. Generate Quiz Logic
btnGenerate.addEventListener('click', function() {
  if (valStatus.textContent === 'Uploaded Successfully') {
    alert('Success! Generating Quiz for: ' + valName.textContent);
  } else {
    alert('Error: Please upload a file completely before generating a quiz.');
  }
});

// 5. Close/Cancel Button Logic (Redirects to Dashboard)
btnClose.addEventListener('click', function() {
  // અહીં ફાઈલનું નામ તમારા ડેશબોર્ડ પેજના નામ પ્રમાણે રાખી શકો છો.
  window.location.href = 'deshboard.html'; 
});
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Lucide Icons
    // (Make sure <script src="https://unpkg.com/lucide@latest"></script> is in your HTML)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Sidebar DOM Elements
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeSidebar');
    
    // Note: Assuming you have a menu button in your navbar to open this sidebar
    // with the ID 'sidebarToggleBtn'
    const toggleBtn = document.getElementById('sidebarToggleBtn');

    // 3. Open Sidebar Logic
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the click from immediately bubbling to document
            sidebar.classList.add('open');
        });
    }

    // 4. Close Sidebar Logic (Using the 'X' button inside sidebar)
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // 5. Close Sidebar when clicking outside of it on mobile
    document.addEventListener('click', (e) => {
        // Only run this logic on tablet/mobile screens where the sidebar is fixed
        if (window.innerWidth <= 1024 && sidebar) {
            // If the click is NOT inside the sidebar, close it
            if (!sidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

});