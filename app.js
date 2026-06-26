document.addEventListener('DOMContentLoaded', () => {
    const positionCards = document.querySelectorAll('.position-card');
    const positionSelect = document.getElementById('position');
    const applicationForm = document.getElementById('applicationForm');
    const cvInput = document.getElementById('cvFile');
    const uploadBox = document.getElementById('uploadBox');
    const uploadTitle = uploadBox.querySelector('.upload-title');
    const uploadInfo = uploadBox.querySelector('.upload-info');
    const successModal = document.getElementById('successModal');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = submitBtn.querySelector('span');

    let base64Cv = null;

    // 1. Position Card Clicks -> Auto Scroll & Select Dropdown
    positionCards.forEach(card => {
        card.addEventListener('click', () => {
            const positionName = card.getAttribute('data-position');
            
            // Set select dropdown value
            if (positionSelect) {
                positionSelect.value = positionName;
                
                // Trigger focus visual animation
                positionSelect.classList.add('active-focus');
                setTimeout(() => {
                    positionSelect.classList.remove('active-focus');
                }, 1500);
            }

            // Smooth scroll to application form section
            const applySection = document.getElementById('apply-now');
            if (applySection) {
                applySection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 2. Custom Upload Box Click & File Selection
    uploadBox.addEventListener('click', () => {
        cvInput.click();
    });

    cvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
            alert('File is too large. Maximum size allowed is 5MB.');
            cvInput.value = '';
            uploadBox.classList.remove('uploaded');
            uploadTitle.textContent = 'With detailed PDF, DOC (Max. 5MB)';
            if (uploadInfo) uploadInfo.textContent = 'PDF, DOCX (Max. 5MB)';
            base64Cv = null;
            return;
        }

        // Convert to Base64
        const reader = new FileReader();
        reader.onload = function(event) {
            base64Cv = event.target.result;
            
            // Visual success state
            uploadBox.classList.add('uploaded');
            uploadTitle.textContent = file.name;
            if (uploadInfo) uploadInfo.textContent = 'File uploaded successfully!';
        };
        reader.onerror = function(err) {
            console.error('File reading error:', err);
            alert('Failed to read the file.');
        };
        reader.readAsDataURL(file);
    });

    // 3. Form Submission via AJAX to Laravel API
    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const candidate_name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const position = positionSelect.value;
        const portfolio = document.getElementById('portfolio').value.trim();
        const bio = document.getElementById('bio').value.trim();

        if (!candidate_name || !email || !phone || !position) {
            alert('Please fill out all required fields.');
            return;
        }

        // Loading UI state
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Submitting...';

        const payload = {
            candidate_name,
            email,
            phone,
            position,
            portfolio: portfolio || null,
            cv: base64Cv || null,
            bio: bio || null
        };

        try {
            const response = await fetch('http://localhost:8000/api/public/recruitment/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 201) {
                // Success modal popup
                successModal.classList.add('active');
                
                // Reset form state
                applicationForm.reset();
                uploadBox.classList.remove('uploaded');
                uploadTitle.textContent = 'With detailed PDF, DOC (Max. 5MB)';
                if (uploadInfo) uploadInfo.textContent = 'PDF, DOCX (Max. 5MB)';
                base64Cv = null;
            } else {
                const errData = await response.json();
                console.error('Error response:', errData);
                alert(`Error submitting application: ${errData.message || 'Server error'}`);
            }
        } catch (error) {
            console.error('Submit connection error:', error);
            alert('Could not reach the server. Please check that the backend service is running.');
        } finally {
            submitBtn.disabled = false;
            submitBtnText.textContent = 'Submit Application';
        }
    });
});

// Success Modal Close Handler
function closeModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('active');
    }
}
