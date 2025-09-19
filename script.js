// GLOBAL STATE
const AppState = {
    isAuthenticated: false,
    currentUser: null,
    cameraStream: null,
    isScanning: false,
    availableCameras: [],
    scanResults: null
};

// DOM ELEMENTS
const DOMElements = {
    navbar: null,
    navMenu: null,
    mobileToggle: null,
    navLinks: null,
    loadingScreen: null,
    loginBtn: null,
    registerBtn: null,
    startScanBtn: null,
    captureBtn: null,
    switchCameraBtn: null,
    loginModal: null,
    registerModal: null,
    cameraModal: null,
    loginForm: null,
    registerForm: null,
    cameraFeed: null,
    cameraCanvas: null,
    scanResults: null,
    scanningAnimation: null,
    toast: null
};

// CAMERA CONFIG
const CameraConfig = {
    constraints: {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        },
        audio: false
    },
    facingMode: 'user'
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        console.log('🚀 Initializing VitalWarrior...');
        
        cacheDOMElements();
        setupEventListeners();
        setupNavigation();
        
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 100
            });
        }
        
        await initializeCameraCapabilities();
        hideLoadingScreen();
        
        console.log('✅ VitalWarrior initialized!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showNotification('Application failed to initialize. Please refresh.', 'error');
    }
}

function cacheDOMElements() {
    DOMElements.navbar = document.getElementById('mainHeader');
    DOMElements.navMenu = document.getElementById('navMenu');
    DOMElements.mobileToggle = document.getElementById('mobileToggle');
    DOMElements.navLinks = document.querySelectorAll('.nav-link');
    DOMElements.loadingScreen = document.getElementById('loadingScreen');
    DOMElements.loginBtn = document.getElementById('loginBtn');
    DOMElements.registerBtn = document.getElementById('registerBtn');
    DOMElements.startScanBtn = document.getElementById('startScanBtn');
    DOMElements.captureBtn = document.getElementById('captureBtn');
    DOMElements.switchCameraBtn = document.getElementById('switchCameraBtn');
    DOMElements.loginModal = document.getElementById('loginModal');
    DOMElements.registerModal = document.getElementById('registerModal');
    DOMElements.cameraModal = document.getElementById('cameraModal');
    DOMElements.loginForm = document.getElementById('loginForm');
    DOMElements.registerForm = document.getElementById('registerForm');
    DOMElements.cameraFeed = document.getElementById('cameraFeed');
    DOMElements.cameraCanvas = document.getElementById('cameraCanvas');
    DOMElements.scanResults = document.getElementById('scanResults');
    DOMElements.scanningAnimation = document.getElementById('scanningAnimation');
    DOMElements.toast = document.getElementById('toast');
}

function setupEventListeners() {
    // NAVIGATION
    if (DOMElements.mobileToggle) {
        DOMElements.mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    DOMElements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // AUTH BUTTONS
    if (DOMElements.loginBtn) {
        DOMElements.loginBtn.addEventListener('click', () => openModal('login'));
    }
    
    if (DOMElements.registerBtn) {
        DOMElements.registerBtn.addEventListener('click', () => openModal('register'));
    }
    
    // CAMERA
    if (DOMElements.startScanBtn) {
        DOMElements.startScanBtn.addEventListener('click', startHealthScan);
    }
    
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.addEventListener('click', captureAndAnalyze);
    }
    
    if (DOMElements.switchCameraBtn) {
        DOMElements.switchCameraBtn.addEventListener('click', switchCamera);
    }
    
    // MODALS
    setupModalEventListeners();
    setupFormEventListeners();
    
    // WINDOW EVENTS
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyPress);
}

async function initializeCameraCapabilities() {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) {
            console.warn('Camera not supported');
            return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        AppState.availableCameras = devices.filter(device => device.kind === 'videoinput');
        console.log(`Found ${AppState.availableCameras.length} camera(s)`);
        
    } catch (error) {
        console.error('Camera initialization failed:', error);
    }
}

function hideLoadingScreen() {
    if (DOMElements.loadingScreen) {
        setTimeout(() => {
            DOMElements.loadingScreen.classList.add('hidden');
        }, 1500);
    }
}

// NAVIGATION
function toggleMobileMenu() {
    const navbar = DOMElements.navbar.querySelector('.navbar');
    const navMenu = DOMElements.navMenu;
    const mobileToggle = DOMElements.mobileToggle;
    
    navbar.classList.toggle('mobile-active');
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
}

function handleNavLinkClick(event) {
    event.preventDefault();
    
    const targetId = event.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80;
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
        
        // CLOSE MOBILE MENU
        const navMenu = DOMElements.navMenu;
        const navbar = DOMElements.navbar.querySelector('.navbar');
        const mobileToggle = DOMElements.mobileToggle;
        
        if (navMenu.classList.contains('active')) {
            navbar.classList.remove('mobile-active');
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
        
        updateActiveNavLink(targetId);
    }
}

function handleScroll() {
    const scrollY = window.scrollY;
    
    if (DOMElements.navbar) {
        if (scrollY > 50) {
            DOMElements.navbar.classList.add('scrolled');
        } else {
            DOMElements.navbar.classList.remove('scrolled');
        }
    }
    
    updateActiveNavLinkOnScroll();
}

function updateActiveNavLink(targetId = null) {
    DOMElements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (targetId && link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

function updateActiveNavLinkOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = '#' + section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            DOMElements.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === sectionId) {
                    link.classList.add('active');
                }
            });
        }
    });
}

function setupNavigation() {
    handleScroll();
    updateActiveNavLink();
}

function handleResize() {
    if (window.innerWidth > 768) {
        const navbar = DOMElements.navbar?.querySelector('.navbar');
        const navMenu = DOMElements.navMenu;
        const mobileToggle = DOMElements.mobileToggle;
        
        if (navbar) navbar.classList.remove('mobile-active');
        if (navMenu) navMenu.classList.remove('active');
        if (mobileToggle) mobileToggle.classList.remove('active');
    }
}

function handleKeyPress(event) {
    if (event.key === 'Escape') {
        closeAllModals();
    }
}

// MODALS
function setupModalEventListeners() {
    // LOGIN MODAL
    if (DOMElements.loginModal) {
        const closeBtn = DOMElements.loginModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal('login'));
        
        DOMElements.loginModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.loginModal) closeModal('login');
        });
    }
    
    // REGISTER MODAL
    if (DOMElements.registerModal) {
        const closeBtn = DOMElements.registerModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal('register'));
        
        DOMElements.registerModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.registerModal) closeModal('register');
        });
    }
    
    // CAMERA MODAL
    if (DOMElements.cameraModal) {
        const closeBtn = DOMElements.cameraModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closeCameraModal);
        
        DOMElements.cameraModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.cameraModal) closeCameraModal();
        });
    }
    
    // MODAL SWITCHING
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('login');
            openModal('register');
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('register');
            openModal('login');
        });
    }
}

function openModal(modalType) {
    let modal;
    
    switch (modalType) {
        case 'login':
            modal = DOMElements.loginModal;
            break;
        case 'register':
            modal = DOMElements.registerModal;
            break;
        case 'camera':
            modal = DOMElements.cameraModal;
            break;
        default:
            return;
    }
    
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const firstInput = modal.querySelector('input[type="text"], input[type="email"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalType) {
    let modal;
    
    switch (modalType) {
        case 'login':
            modal = DOMElements.loginModal;
            break;
        case 'register':
            modal = DOMElements.registerModal;
            break;
        case 'camera':
            modal = DOMElements.cameraModal;
            break;
        default:
            return;
    }
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    closeModal('login');
    closeModal('register');
    closeCameraModal();
}

function closeCameraModal() {
    closeModal('camera');
    stopCameraStream();
}

// FORMS
function setupFormEventListeners() {
    if (DOMElements.loginForm) {
        DOMElements.loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    if (DOMElements.registerForm) {
        DOMElements.registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    if (!password || password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    try {
        // SIMULATE LOGIN
        simulateLogin(email);
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const studentId = formData.get('studentId');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (!firstName || !lastName) {
        showNotification('Please enter your full name.', 'error');
        return;
    }
    
    if (!validateStudentId(studentId)) {
        showNotification('Please enter a valid UE student ID (UE-XXXXXXXX).', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    if (!password || password.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }
    
    try {
        simulateRegistration(email, firstName, lastName);
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

async function handleContactSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    if (!name || !validateEmail(email) || !message) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    try {
        console.log('Contact form:', { name, email, message });
        event.target.reset();
        showNotification('Message sent successfully!', 'success');
    } catch (error) {
        console.error('Contact form error:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

// VALIDATION
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateStudentId(studentId) {
    const studentIdRegex = /^UE-\d{8}$/;
    return studentIdRegex.test(studentId);
}

// CAMERA & SCANNING
async function startHealthScan() {
    try {
        openModal('camera');
        await initializeCameraStream();
    } catch (error) {
        console.error('Failed to start health scan:', error);
        showNotification('Failed to access camera. Please check permissions.', 'error');
        closeModal('camera');
    }
}

async function initializeCameraStream() {
    try {
        AppState.cameraStream = await navigator.mediaDevices.getUserMedia(CameraConfig.constraints);
        
        if (DOMElements.cameraFeed) {
            DOMElements.cameraFeed.srcObject = AppState.cameraStream;
            
            DOMElements.cameraFeed.onloadedmetadata = () => {
                DOMElements.cameraFeed.play();
                console.log('Camera stream initialized');
            };
        }
        
        updateCameraUI();
        
    } catch (error) {
        console.error('Camera initialization failed:', error);
        throw new Error('Unable to access camera. Please ensure camera permissions are granted.');
    }
}

function stopCameraStream() {
    if (AppState.cameraStream) {
        AppState.cameraStream.getTracks().forEach(track => {
            track.stop();
        });
        AppState.cameraStream = null;
        
        if (DOMElements.cameraFeed) {
            DOMElements.cameraFeed.srcObject = null;
        }
        
        console.log('Camera stream stopped');
    }
    
    AppState.isScanning = false;
    updateCameraUI();
}

async function switchCamera() {
    if (AppState.availableCameras.length < 2) {
        showNotification('No additional cameras available.', 'warning');
        return;
    }
    
    try {
        stopCameraStream();
        
        CameraConfig.facingMode = CameraConfig.facingMode === 'user' ? 'environment' : 'user';
        CameraConfig.constraints.video.facingMode = CameraConfig.facingMode;
        
        await initializeCameraStream();
        
        const cameraType = CameraConfig.facingMode === 'user' ? 'Front' : 'Back';
        showNotification(`Switched to ${cameraType} Camera`, 'info');
        
    } catch (error) {
        console.error('Failed to switch camera:', error);
        showNotification('Failed to switch camera.', 'error');
    }
}

async function captureAndAnalyze() {
    if (!AppState.cameraStream || !DOMElements.cameraFeed) {
        showNotification('Camera not initialized.', 'error');
        return;
    }
    
    try {
        AppState.isScanning = true;
        updateCameraUI();
        
        const imageData = captureFrame();
        startScanningAnimation();
        
        const analysisResults = await simulateHealthAnalysis(imageData);
        displayAnalysisResults(analysisResults);
        
        stopScanningAnimation();
        
    } catch (error) {
        console.error('Analysis failed:', error);
        showNotification('Health analysis failed. Please try again.', 'error');
        stopScanningAnimation();
    }
    
    AppState.isScanning = false;
    updateCameraUI();
}

function captureFrame() {
    if (!DOMElements.cameraCanvas) {
        DOMElements.cameraCanvas = document.createElement('canvas');
    }
    
    const canvas = DOMElements.cameraCanvas;
    const context = canvas.getContext('2d');
    const video = DOMElements.cameraFeed;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
}

async function simulateHealthAnalysis(imageData) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const temperature = (Math.random() * (38.5 - 36.0) + 36.0).toFixed(1);
    const symptoms = [];
    
    if (parseFloat(temperature) > 37.5) {
        symptoms.push('Fever');
        if (Math.random() > 0.5) symptoms.push('Headache');
        if (Math.random() > 0.7) symptoms.push('Fatigue');
    } else {
        if (Math.random() > 0.8) symptoms.push('Runny Nose');
        if (Math.random() > 0.9) symptoms.push('Cough');
    }
    
    if (symptoms.length === 0) {
        symptoms.push('Normal');
    }
    
    return {
        studentId: AppState.currentUser?.student_id || 'UE-12345678',
        temperature: `${temperature}°C`,
        symptoms: symptoms.join(', '),
        status: symptoms.includes('Fever') ? 'warning' : 'healthy',
        confidence: Math.random() * 0.3 + 0.7,
        timestamp: new Date().toISOString()
    };
}

function displayAnalysisResults(results) {
    AppState.scanResults = results;
    
    const studentIdElement = document.getElementById('studentId');
    const temperatureElement = document.getElementById('temperature');
    const symptomsElement = document.getElementById('symptoms');
    const healthStatusElement = document.getElementById('healthStatus');
    
    if (studentIdElement) studentIdElement.textContent = results.studentId;
    if (temperatureElement) temperatureElement.textContent = results.temperature;
    if (symptomsElement) symptomsElement.textContent = results.symptoms;
    
    if (healthStatusElement) {
        const indicator = healthStatusElement.querySelector('.status-indicator');
        if (indicator) {
            indicator.classList.remove('healthy', 'warning', 'danger');
            indicator.classList.add(results.status);
            
            const statusText = indicator.querySelector('span');
            if (statusText) {
                statusText.textContent = results.status === 'healthy' ? 'Healthy' : 'Needs Attention';
            }
            
            const statusIcon = indicator.querySelector('i');
            if (statusIcon) {
                statusIcon.className = results.status === 'healthy' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
            }
        }
    }
    
    if (DOMElements.scanResults) {
        DOMElements.scanResults.style.display = 'block';
        DOMElements.scanResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function startScanningAnimation() {
    if (DOMElements.scanningAnimation) {
        DOMElements.scanningAnimation.style.display = 'block';
    }
    
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        DOMElements.captureBtn.disabled = true;
    }
}

function stopScanningAnimation() {
    if (DOMElements.scanningAnimation) {
        DOMElements.scanningAnimation.style.display = 'none';
    }
    
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.innerHTML = '<i class="fas fa-camera-retro"></i> Capture & Analyze';
        DOMElements.captureBtn.disabled = false;
    }
}

function updateCameraUI() {
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.disabled = AppState.isScanning || !AppState.cameraStream;
    }
    
    if (DOMElements.switchCameraBtn) {
        DOMElements.switchCameraBtn.disabled = AppState.isScanning || AppState.availableCameras.length < 2;
    }
}

// AUTHENTICATION
function updateAuthenticationUI() {
    if (AppState.isAuthenticated && AppState.currentUser) {
        if (DOMElements.loginBtn) {
            DOMElements.loginBtn.innerHTML = `<i class="fas fa-user"></i> <span>${AppState.currentUser.first_name || 'User'}</span>`;
        }
        
        if (DOMElements.registerBtn) {
            DOMElements.registerBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Logout</span>';
            DOMElements.registerBtn.removeEventListener('click', () => openModal('register'));
            DOMElements.registerBtn.addEventListener('click', handleLogout);
        }
    } else {
        if (DOMElements.loginBtn) {
            DOMElements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Login</span>';
        }
        
        if (DOMElements.registerBtn) {
            DOMElements.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span>Register</span>';
        }
    }
}

async function handleLogout() {
    AppState.isAuthenticated = false;
    AppState.currentUser = null;
    updateAuthenticationUI();
    showNotification('Logged out successfully.', 'info');
}

// DEMO SIMULATIONS
function simulateLogin(email) {
    setTimeout(() => {
        AppState.isAuthenticated = true;
        AppState.currentUser = {
            email: email,
            first_name: 'Demo',
            last_name: 'User',
            student_id: 'UE-12345678'
        };
        updateAuthenticationUI();
        closeModal('login');
        showNotification('Demo login successful!', 'success');
    }, 1000);
}

function simulateRegistration(email, firstName, lastName) {
    setTimeout(() => {
        closeModal('register');
        showNotification('Demo registration successful!', 'success');
    }, 1000);
}

// NOTIFICATIONS
function showNotification(message, type = 'info', duration = 5000) {
    if (!DOMElements.toast) return;
    
    const messageElement = DOMElements.toast.querySelector('.toast-message');
    const iconElement = DOMElements.toast.querySelector('.toast-icon');
    
    if (messageElement) messageElement.textContent = message;
    
    DOMElements.toast.className = `toast ${type}`;
    
    if (iconElement) {
        let iconClass = 'fas fa-info-circle';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                break;
        }
        iconElement.innerHTML = `<i class="${iconClass}"></i>`;
    }
    
    DOMElements.toast.classList.add('show');
    
    const closeBtn = DOMElements.toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.onclick = hideNotification;
    }
    
    setTimeout(hideNotification, duration);
}

function hideNotification() {
    if (DOMElements.toast) {
        DOMElements.toast.classList.remove('show');
    }
}

// UTILITIES
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// GLOBAL API
window.VitalWarrior = {
    init: initializeApp,
    showNotification,
    openModal,
    closeModal,
    startScan: startHealthScan,
    stopCamera: stopCameraStream,
    getState: () => ({ ...AppState }),
    isAuthenticated: () => AppState.isAuthenticated,
    isMobile
};

console.log('🛡️ VitalWarrior loaded successfully!');