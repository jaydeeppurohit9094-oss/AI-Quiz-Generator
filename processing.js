document.addEventListener("DOMContentLoaded", () => {
    // Dashboard Elements
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    const generateBtn = document.getElementById('generate-btn');
    const errorMsg = document.getElementById('error-msg');
    const overlay = document.getElementById('processing-overlay'); // તમારું લોડિંગ સ્ક્રીન કન્ટેનર
    
    // Processing UI Elements
    const steps = document.querySelectorAll('.step');
    const stepsList = document.getElementById('steps-list');
    const percentageText = document.getElementById('percentage-text');
    const circleProgress = document.getElementById('circle-progress');
    const linearProgress = document.getElementById('linear-progress');
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');

    let selectedFile = null;
    const totalSteps = steps.length;
    const circleCircumference = 2 * Math.PI * 45;

    // 1. ફાઈલ સિલેક્ટ થાય ત્યારે બટન Enable કરો
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                fileNameDisplay.textContent = `Selected: ${selectedFile.name}`;
                generateBtn.disabled = false; // બટન ચાલુ કર્યું
                errorMsg.textContent = '';
            }
        });
    }

    // 2. "Generate Quiz" બટન પર ક્લિક થાય ત્યારે
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (!selectedFile) return;

            // બટન ડિસેબલ કરો અને લોડિંગ સ્ક્રીન બતાવો
            generateBtn.disabled = true;
            if(overlay) overlay.classList.remove('hidden');

            // એનિમેશન ચાલુ કરો
            if(circleProgress) {
                circleProgress.style.strokeDasharray = circleCircumference;
                circleProgress.style.strokeDashoffset = circleCircumference;
            }
            
            let currentStepIndex = 0;
            
            // દર 1.5 સેકન્ડે સ્ટેપ આગળ વધારવા માટેનું ફંક્શન
            const updateProgress = () => {
                const percentage = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
                
                if(percentageText) percentageText.innerText = percentage;
                if(linearProgress) linearProgress.style.width = `${percentage}%`;
                
                if(circleProgress) {
                    const offset = circleCircumference - (percentage / 100) * circleCircumference;
                    circleProgress.style.strokeDashoffset = offset;
                }

                steps.forEach((step, index) => {
                    if (index < currentStepIndex) {
                        step.classList.remove('pending', 'active');
                        step.classList.add('completed');
                    } else if (index === currentStepIndex) {
                        step.classList.remove('pending', 'completed');
                        step.classList.add('active');
                    }
                });

                if (currentStepIndex > 1 && stepsList) {
                    const scrollAmount = (currentStepIndex - 1) * -36;
                    stepsList.style.transform = `translateY(${scrollAmount}px)`;
                }

                if (currentStepIndex === totalSteps - 1) {
                    clearInterval(processingInterval);
                    finishProcessing();
                } else {
                    currentStepIndex++;
                }
            };

            updateProgress();
            const processingInterval = setInterval(updateProgress, 1500);

            const finishProcessing = () => {
                if(statusTitle) {
                    statusTitle.style.opacity = 0;
                    statusSubtitle.style.opacity = 0;
                    
                    setTimeout(() => {
                        statusTitle.innerText = "Quiz Generated Successfully!";
                        statusTitle.style.background = "linear-gradient(135deg, var(--success-green), #059669)";
                        statusTitle.style.webkitBackgroundClip = "text";
                        statusTitle.style.webkitTextFillColor = "transparent";
                        statusSubtitle.innerText = "Redirecting you to your personalized quiz...";
                        
                        statusTitle.style.opacity = 1;
                        statusSubtitle.style.opacity = 1;
                    }, 500);
                }

                // પ્રોસેસ પૂરી થયા પછી ક્વિઝ પેજ પર રીડાયરેક્ટ
                setTimeout(() => {
                    window.location.href = '/quiz/1'; // અહી તમે સાચો Backend URL સેટ કરી શકો છો
                }, 2500);
            };
        });
    }
});