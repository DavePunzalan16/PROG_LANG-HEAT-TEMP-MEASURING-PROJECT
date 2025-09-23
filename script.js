
// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase Client
let supabaseClient = null;

// Global State Management
const AppState = {
    isAuthenticated: false,
    currentUser: null,
    cameraStream: null,
    isScanning: false,
    currentDevice: null,
    availableCameras: [],
    scanResults: null,
    notifications: []
};

// DOM Element References
const DOMElements = {
    // Navigation
    navbar: null,
    navMenu: null,
    mobileToggle: null,
    navLinks: null,
    
    // Loading Screen
    loadingScreen: null,
    
    // Buttons
    loginBtn: null,
    registerBtn: null,
    startScanBtn: null,
    captureBtn: null,
    switchCameraBtn: null,
    
    // Modals
    loginModal: null,
    registerModal: null,
    cameraModal: null,
    
    // Forms
    loginForm: null,
    registerForm: null,
    contactForm: null,
    
    // Camera Elements
    cameraFeed: null,
    cameraCanvas: null,
    scanResults: null,
    scanningAnimation: null,
    
    // Toast Notification
    toast: null
};

// Camera Configuration
const CameraConfig = {
    constraints: {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        },
        audio: false
    },
    facingMode: 'user' // 'user' for front camera, 'environment' for back camera
};

// Health Analysis Mock Data (Replace with real AI integration)
const HealthAnalysisData = {
    symptoms: ['Normal', 'Fever', 'Cough', 'Runny Nose', 'Fatigue', 'Headache'],
    temperatureRange: [35.5, 42.0],
    normalTemp: [36.0, 37.5]
};

// ========================================
// INITIALIZATION & SETUP
// ========================================

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Main application initialization
 */
async function initializeApp() {
    try {
        console.log('🚀 Initializing VitalWarrior Application...');
        
        // Initialize Supabase
        await initializeSupabase();
        
        // Cache DOM elements
        cacheDOMElements();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize AOS (Animate On Scroll)
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 100
            });
        }
        
        // Setup navigation
        setupNavigation();
        
        // Setup authentication state
        await setupAuthentication();
        
        // Initialize camera capabilities
        await initializeCameraCapabilities();
        
        // Hide loading screen
        hideLoadingScreen();
        
        console.log('✅ VitalWarrior Application Initialized Successfully!');
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showNotification('Application failed to initialize. Please refresh the page.', 'error');
    }
}

/**
 * Initialize Supabase client
 */
async function initializeSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');
        } else {
            console.warn('⚠️ Supabase not available - running in demo mode');
        }
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
    }
}

/**
 * Cache frequently used DOM elements
 */
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
    DOMElements.contactForm = document.querySelector('.contact-form');
    
    DOMElements.cameraFeed = document.getElementById('cameraFeed');
    DOMElements.cameraCanvas = document.getElementById('cameraCanvas');
    DOMElements.scanResults = document.getElementById('scanResults');
    DOMElements.scanningAnimation = document.getElementById('scanningAnimation');
    
    DOMElements.toast = document.getElementById('toast');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Navigation Events
    if (DOMElements.mobileToggle) {
        DOMElements.mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Smooth scrolling for navigation links
    DOMElements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // Authentication Events
    if (DOMElements.loginBtn) {
        DOMElements.loginBtn.addEventListener('click', () => openModal('login'));
    }
    
    if (DOMElements.registerBtn) {
        DOMElements.registerBtn.addEventListener('click', () => openModal('register'));
    }
    
    // Camera Events
    if (DOMElements.startScanBtn) {
        DOMElements.startScanBtn.addEventListener('click', startHealthScan);
    }
    
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.addEventListener('click', captureAndAnalyze);
    }
    
    if (DOMElements.switchCameraBtn) {
        DOMElements.switchCameraBtn.addEventListener('click', switchCamera);
    }
    
    // Modal Events
    setupModalEventListeners();
    
    // Form Events
    setupFormEventListeners();
    
    // Window Events
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Keyboard Events
    document.addEventListener('keydown', handleKeyPress);
}

/**
 * Setup navigation functionality
 */
function setupNavigation() {
    // Handle scroll-based navbar styling
    handleScroll();
    
    // Set active navigation link based on current section
    updateActiveNavLink();
}

/**
 * Setup authentication state management
 */
async function setupAuthentication() {
    if (!supabaseClient) return;
    
    try {
        // Check for existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            AppState.isAuthenticated = true;
            AppState.currentUser = session.user;
            updateAuthenticationUI();
        }
        
        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' && session) {
                AppState.isAuthenticated = true;
                AppState.currentUser = session.user;
                showNotification('Successfully logged in!', 'success');
            } else if (event === 'SIGNED_OUT') {
                AppState.isAuthenticated = false;
                AppState.currentUser = null;
                showNotification('Successfully logged out!', 'info');
            }
            
            updateAuthenticationUI();
        });
        
    } catch (error) {
        console.error('Authentication setup failed:', error);
    }
}

/**
 * Initialize camera capabilities
 */
async function initializeCameraCapabilities() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.warn('Camera capabilities not supported');
            return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        AppState.availableCameras = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`Found ${AppState.availableCameras.length} camera(s)`);
        
    } catch (error) {
        console.error('Failed to initialize camera capabilities:', error);
    }
}

// ========================================
// LOADING SCREEN MANAGEMENT
// ========================================

/**
 * Hide the loading screen with animation
 */
function hideLoadingScreen() {
    if (DOMElements.loadingScreen) {
        setTimeout(() => {
            DOMElements.loadingScreen.classList.add('hidden');
        }, 1500); // Allow loading animation to complete
    }
}

// ========================================
// NAVIGATION FUNCTIONALITY
// ========================================

/**
 * Toggle mobile navigation menu
 */
function toggleMobileMenu() {
    const navbar = DOMElements.navbar.querySelector('.navbar');
    const navMenu = DOMElements.navMenu;
    const mobileToggle = DOMElements.mobileToggle;
    
    navbar.classList.toggle('mobile-active');
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
}

/**
 * Handle navigation link clicks for smooth scrolling
 */
function handleNavLinkClick(event) {
    event.preventDefault();
    
    const targetId = event.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80; // Account for fixed header
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
        
        // Close mobile menu if open
        const navMenu = DOMElements.navMenu;
        const navbar = DOMElements.navbar.querySelector('.navbar');
        const mobileToggle = DOMElements.mobileToggle;
        
        if (navMenu.classList.contains('active')) {
            navbar.classList.remove('mobile-active');
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
        
        // Update active link
        updateActiveNavLink(targetId);
    }
}

/**
 * Handle scroll events for navbar styling and active link updates
 */
function handleScroll() {
    const scrollY = window.scrollY;
    
    // Update navbar styling
    if (DOMElements.navbar) {
        if (scrollY > 50) {
            DOMElements.navbar.classList.add('scrolled');
        } else {
            DOMElements.navbar.classList.remove('scrolled');
        }
    }
    
    // Update active navigation link based on scroll position
    updateActiveNavLinkOnScroll();
}

/**
 * Update active navigation link
 */
function updateActiveNavLink(targetId = null) {
    DOMElements.navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (targetId && link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

/**
 * Update active navigation link based on scroll position
 */
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

/**
 * Handle window resize events
 */
function handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
        const navbar = DOMElements.navbar?.querySelector('.navbar');
        const navMenu = DOMElements.navMenu;
        const mobileToggle = DOMElements.mobileToggle;
        
        if (navbar) navbar.classList.remove('mobile-active');
        if (navMenu) navMenu.classList.remove('active');
        if (mobileToggle) mobileToggle.classList.remove('active');
    }
}

/**
 * Handle keyboard events
 */
function handleKeyPress(event) {
    // Close modals on Escape key
    if (event.key === 'Escape') {
        closeAllModals();
    }
    
    // Quick access shortcuts
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'l':
                event.preventDefault();
                openModal('login');
                break;
            case 'k':
                event.preventDefault();
                startHealthScan();
                break;
        }
    }
}

// ========================================
// MODAL MANAGEMENT
// ========================================

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    // Login Modal
    if (DOMElements.loginModal) {
        const closeBtn = DOMElements.loginModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal('login'));
        
        DOMElements.loginModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.loginModal) closeModal('login');
        });
    }
    
    // Register Modal
    if (DOMElements.registerModal) {
        const closeBtn = DOMElements.registerModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal('register'));
        
        DOMElements.registerModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.registerModal) closeModal('register');
        });
    }
    
    // Camera Modal
    if (DOMElements.cameraModal) {
        const closeBtn = DOMElements.cameraModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closeCameraModal);
        
        DOMElements.cameraModal.addEventListener('click', (e) => {
            if (e.target === DOMElements.cameraModal) closeCameraModal();
        });
    }
    
    // Modal switching
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

/**
 * Open a modal
 */
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
        
        // Focus first input if available
        const firstInput = modal.querySelector('input[type="text"], input[type="email"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Close a modal
 */
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

/**
 * Close all modals
 */
function closeAllModals() {
    closeModal('login');
    closeModal('register');
    closeCameraModal();
}

/**
 * Close camera modal and stop stream
 */
function closeCameraModal() {
    closeModal('camera');
    stopCameraStream();
}

// ========================================
// FORM HANDLING
// ========================================

/**
 * Setup form event listeners
 */
function setupFormEventListeners() {
    // Login Form
    if (DOMElements.loginForm) {
        DOMElements.loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Register Form
    if (DOMElements.registerForm) {
        DOMElements.registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // Contact Form
    if (DOMElements.contactForm) {
        DOMElements.contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Google OAuth buttons
    const googleLogin = document.getElementById('googleLogin');
    const googleRegister = document.getElementById('googleRegister');
    
    if (googleLogin) {
        googleLogin.addEventListener('click', handleGoogleAuth);
    }
    
    if (googleRegister) {
        googleRegister.addEventListener('click', handleGoogleAuth);
    }
}

/**
 * Handle login form submission
 */
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
        if (supabaseClient) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                showNotification(error.message, 'error');
            } else {
                closeModal('login');
                showNotification('Login successful!', 'success');
            }
        } else {
            // Demo mode
            simulateLogin(email);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

/**
 * Handle register form submission
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const studentId = formData.get('studentId');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation
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
        if (supabaseClient) {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        student_id: studentId,
                        full_name: `${firstName} ${lastName}`
                    }
                }
            });
            
            if (error) {
                showNotification(error.message, 'error');
            } else {
                closeModal('register');
                showNotification('Registration successful! Please check your email for verification.', 'success');
            }
        } else {
            // Demo mode
            simulateRegistration(email, firstName, lastName);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

/**
 * Handle contact form submission
 */
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
        // In a real application, you would send this to your backend
        console.log('Contact form submission:', { name, email, message });
        
        // Simulate successful submission
        event.target.reset();
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        
    } catch (error) {
        console.error('Contact form error:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

/**
 * Handle Google OAuth authentication
 */
async function handleGoogleAuth() {
    try {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) {
                showNotification(error.message, 'error');
            }
        } else {
            showNotification('Google OAuth not available in demo mode.', 'warning');
        }
        
    } catch (error) {
        console.error('Google OAuth error:', error);
        showNotification('Google authentication failed.', 'error');
    }
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate UE student ID format
 */
function validateStudentId(studentId) {
    const studentIdRegex = /^UE-\d{8}$/;
    return studentIdRegex.test(studentId);
}

// ========================================
// CAMERA & SCANNING FUNCTIONALITY
// ========================================

/**
 * Start health scanning process
 */
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

/**
 * Initialize camera stream
 */
async function initializeCameraStream() {
    try {
        // Request camera permissions
        AppState.cameraStream = await navigator.mediaDevices.getUserMedia(CameraConfig.constraints);
        
        if (DOMElements.cameraFeed) {
            DOMElements.cameraFeed.srcObject = AppState.cameraStream;
            
            DOMElements.cameraFeed.onloadedmetadata = () => {
                DOMElements.cameraFeed.play();
                console.log('Camera stream initialized successfully');
            };
        }
        
        // Update UI
        updateCameraUI();
        
    } catch (error) {
        console.error('Camera initialization failed:', error);
        throw new Error('Unable to access camera. Please ensure camera permissions are granted.');
    }
}

/**
 * Stop camera stream
 */
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
    
    // Reset scanning state
    AppState.isScanning = false;
    updateCameraUI();
}

/**
 * Switch between front and back cameras
 */
async function switchCamera() {
    if (AppState.availableCameras.length < 2) {
        showNotification('No additional cameras available.', 'warning');
        return;
    }
    
    try {
        // Stop current stream
        stopCameraStream();
        
        // Toggle facing mode
        CameraConfig.facingMode = CameraConfig.facingMode === 'user' ? 'environment' : 'user';
        CameraConfig.constraints.video.facingMode = CameraConfig.facingMode;
        
        // Restart with new camera
        await initializeCameraStream();
        
        const cameraType = CameraConfig.facingMode === 'user' ? 'Front' : 'Back';
        showNotification(`Switched to ${cameraType} Camera`, 'info');
        
    } catch (error) {
        console.error('Failed to switch camera:', error);
        showNotification('Failed to switch camera.', 'error');
    }
}

/**
 * Capture image and analyze health
 */
async function captureAndAnalyze() {
    if (!AppState.cameraStream || !DOMElements.cameraFeed) {
        showNotification('Camera not initialized.', 'error');
        return;
    }
    
    try {
        AppState.isScanning = true;
        updateCameraUI();
        
        // Capture frame from video
        const imageData = captureFrame();
        
        // Simulate scanning animation
        startScanningAnimation();
        
        // Simulate AI analysis (replace with real implementation)
        const analysisResults = await simulateHealthAnalysis(imageData);
        
        // Display results
        displayAnalysisResults(analysisResults);
        
        // Stop scanning animation
        stopScanningAnimation();
        
    } catch (error) {
        console.error('Analysis failed:', error);
        showNotification('Health analysis failed. Please try again.', 'error');
        stopScanningAnimation();
    }
    
    AppState.isScanning = false;
    updateCameraUI();
}

/**
 * Capture frame from video stream
 */
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

/**
 * Simulate health analysis (replace with real AI implementation)
 */
async function simulateHealthAnalysis(imageData) {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis results
    const temperature = (Math.random() * (38.5 - 36.0) + 36.0).toFixed(1);
    const symptoms = [];
    
    // Randomly determine symptoms based on temperature
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
        studentId: AppState.currentUser?.user_metadata?.student_id || 'UE-12345678',
        temperature: `${temperature}°C`,
        symptoms: symptoms.join(', '),
        status: symptoms.includes('Fever') ? 'warning' : 'healthy',
        timestamp: new Date().toISOString()
    };
}

/**
 * Display analysis results
 */
function displayAnalysisResults(results) {
    AppState.scanResults = results;
    
    // Update UI elements
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
            // Reset classes
            indicator.classList.remove('healthy', 'warning', 'danger');
            
            // Set status
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
    
    // Show results section
    if (DOMElements.scanResults) {
        DOMElements.scanResults.style.display = 'block';
        DOMElements.scanResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Save results to database if authenticated
    if (supabaseClient && AppState.isAuthenticated) {
        saveHealthRecord(results);
    }
}

/**
 * Save health record to database
 */
async function saveHealthRecord(results) {
    try {
        const { data, error } = await supabaseClient
            .from('health_records')
            .insert([{
                user_id: AppState.currentUser.id,
                student_id: results.studentId,
                temperature: results.temperature,
                symptoms: results.symptoms,
                status: results.status,
                created_at: results.timestamp
            }]);
        
        if (error) {
            console.error('Failed to save health record:', error);
        } else {
            console.log('Health record saved successfully');
        }
        
    } catch (error) {
        console.error('Database error:', error);
    }
}

/**
 * Start scanning animation
 */
function startScanningAnimation() {
    if (DOMElements.scanningAnimation) {
        DOMElements.scanningAnimation.style.display = 'block';
    }
    
    // Show progress in capture button
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        DOMElements.captureBtn.disabled = true;
    }
}

/**
 * Stop scanning animation
 */
function stopScanningAnimation() {
    if (DOMElements.scanningAnimation) {
        DOMElements.scanningAnimation.style.display = 'none';
    }
    
    // Restore capture button
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.innerHTML = '<i class="fas fa-camera-retro"></i> Capture & Analyze';
        DOMElements.captureBtn.disabled = false;
    }
}

/**
 * Update camera UI based on state
 */
function updateCameraUI() {
    if (DOMElements.captureBtn) {
        DOMElements.captureBtn.disabled = AppState.isScanning || !AppState.cameraStream;
    }
    
    if (DOMElements.switchCameraBtn) {
        DOMElements.switchCameraBtn.disabled = AppState.isScanning || AppState.availableCameras.length < 2;
    }
}

// ========================================
// AUTHENTICATION UI UPDATES
// ========================================

/**
 * Update UI based on authentication state
 */
function updateAuthenticationUI() {
    if (AppState.isAuthenticated && AppState.currentUser) {
        // Update navigation buttons
        if (DOMElements.loginBtn) {
            DOMElements.loginBtn.innerHTML = `<i class="fas fa-user"></i> <span>${AppState.currentUser.user_metadata?.first_name || 'User'}</span>`;
        }
        
        if (DOMElements.registerBtn) {
            DOMElements.registerBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Logout</span>';
            DOMElements.registerBtn.removeEventListener('click', () => openModal('register'));
            DOMElements.registerBtn.addEventListener('click', handleLogout);
        }
    } else {
        // Reset to default state
        if (DOMElements.loginBtn) {
            DOMElements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Login</span>';
        }
        
        if (DOMElements.registerBtn) {
            DOMElements.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span>Register</span>';
        }
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                showNotification('Logout failed.', 'error');
            }
        } else {
            // Demo mode
            AppState.isAuthenticated = false;
            AppState.currentUser = null;
            updateAuthenticationUI();
            showNotification('Logged out successfully.', 'info');
        }
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed.', 'error');
    }
}

// ========================================
// DEMO MODE SIMULATIONS
// ========================================

/**
 * Simulate login for demo mode
 */
function simulateLogin(email) {
    setTimeout(() => {
        AppState.isAuthenticated = true;
        AppState.currentUser = {
            email: email,
            user_metadata: {
                first_name: 'Demo',
                last_name: 'User',
                student_id: 'UE-12345678'
            }
        };
        updateAuthenticationUI();
        closeModal('login');
        showNotification('Demo login successful!', 'success');
    }, 1000);
}

/**
 * Simulate registration for demo mode
 */
function simulateRegistration(email, firstName, lastName) {
    setTimeout(() => {
        closeModal('register');
        showNotification('Demo registration successful!', 'success');
    }, 1000);
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

/**
 * Show notification toast
 */
function showNotification(message, type = 'info', duration = 5000) {
    if (!DOMElements.toast) return;
    
    // Set notification content
    const messageElement = DOMElements.toast.querySelector('.toast-message');
    const iconElement = DOMElements.toast.querySelector('.toast-icon');
    
    if (messageElement) messageElement.textContent = message;
    
    // Set notification type
    DOMElements.toast.className = `toast ${type}`;
    
    // Set appropriate icon
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
            case 'info':
                iconClass = 'fas fa-info-circle';
                break;
        }
        iconElement.innerHTML = `<i class="${iconClass}"></i>`;
    }
    
    // Show notification
    DOMElements.toast.classList.add('show');
    
    // Setup close button
    const closeBtn = DOMElements.toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.onclick = hideNotification;
    }
    
    // Auto hide after duration
    setTimeout(hideNotification, duration);
}

/**
 * Hide notification toast
 */
function hideNotification() {
    if (DOMElements.toast) {
        DOMElements.toast.classList.remove('show');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Debounce function to limit function calls
 */
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

/**
 * Throttle function to limit function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date for display
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

/**
 * Check if device is mobile
 */
function isMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get device type
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showNotification('Failed to copy to clipboard.', 'error');
    }
}

/**
 * Download file
 */
function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

/**
 * Monitor application performance
 */
function initializePerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
    });
    
    // Monitor memory usage (if available)
    if (performance.memory) {
        const logMemoryUsage = () => {
            const memory = performance.memory;
            console.log(`Memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
        };
        
        setInterval(logMemoryUsage, 30000); // Log every 30 seconds
    }
}

// ========================================
// ERROR HANDLING & LOGGING
// ========================================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    logError('JavaScript Error', event.error.message, event.error.stack);
});

/**
 * Global unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    logError('Promise Rejection', event.reason?.message || 'Unknown error', event.reason?.stack);
});

/**
 * Log error to console and potentially to analytics service
 */
function logError(type, message, stack) {
    const errorData = {
        type,
        message,
        stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    console.error('Error logged:', errorData);
    
    // In a production environment, you would send this to your analytics service
    // Example: analytics.track('error', errorData);
}

// ========================================
// ACCESSIBILITY ENHANCEMENTS
// ========================================

/**
 * Initialize accessibility enhancements
 */
function initializeAccessibility() {
    // Add skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(skipLink.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView();
            }
        });
    }
    
    // Add keyboard navigation for custom elements
    document.addEventListener('keydown', handleAccessibilityKeyPress);
    
    // Announce dynamic content changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
    
    window.announceToScreenReader = (message) => {
        announcer.textContent = message;
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    };
}

/**
 * Handle accessibility keyboard navigation
 */
function handleAccessibilityKeyPress(event) {
    const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(focusableElements).indexOf(currentFocus);
    
    // Tab navigation within modals
    if (event.key === 'Tab') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const modalFocusable = activeModal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (modalFocusable.length > 0) {
                const firstFocusable = modalFocusable[0];
                const lastFocusable = modalFocusable[modalFocusable.length - 1];
                
                if (event.shiftKey) {
                    if (currentFocus === firstFocusable) {
                        event.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (currentFocus === lastFocusable) {
                        event.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }
    }
}

// ========================================
// PROGRESSIVE WEB APP (PWA) FEATURES
// ========================================

/**
 * Initialize PWA features
 */
function initializePWA() {
    // Register service worker if available
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
    
    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });
    
    // Handle app installed
    window.addEventListener('appinstalled', () => {
        console.log('VitalWarrior app installed');
        hideInstallBanner();
    });
}

/**
 * Show install app banner
 */
function showInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
        <div class="install-content">
            <div class="install-icon">
                <i class="fas fa-shield-alt"></i>
            </div>
            <div class="install-text">
                <h4>Install VitalWarrior</h4>
                <p>Add to your home screen for quick access</p>
            </div>
            <div class="install-actions">
                <button class="btn btn-primary" id="install-app">Install</button>
                <button class="btn btn-outline" id="dismiss-install">Maybe Later</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('install-app').addEventListener('click', installApp);
    document.getElementById('dismiss-install').addEventListener('click', hideInstallBanner);
}

/**
 * Install PWA
 */
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    }
    hideInstallBanner();
}

/**
 * Hide install banner
 */
function hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
        banner.remove();
    }
}

// ========================================
// DATA SYNCHRONIZATION
// ========================================

/**
 * Sync data with server when online
 */
function initializeDataSync() {
    // Check online status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial status
    updateConnectionStatus();
}

/**
 * Handle online event
 */
function handleOnline() {
    console.log('Application is online');
    updateConnectionStatus();
    showNotification('Connection restored', 'success', 2000);
    
    // Sync pending data
    syncPendingData();
}

/**
 * Handle offline event
 */
function handleOffline() {
    console.log('Application is offline');
    updateConnectionStatus();
    showNotification('You are offline. Some features may be limited.', 'warning', 3000);
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        if (navigator.onLine) {
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
        } else {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
        }
    }
}

/**
 * Sync pending data when connection is restored
 */
async function syncPendingData() {
    // Get pending data from localStorage
    const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    
    if (pendingData.length === 0) return;
    
    try {
        for (const item of pendingData) {
            // Sync each item
            await syncDataItem(item);
        }
        
        // Clear pending data
        localStorage.removeItem('pendingSync');
        console.log('Data sync completed');
        
    } catch (error) {
        console.error('Data sync failed:', error);
    }
}

/**
 * Sync individual data item
 */
async function syncDataItem(item) {
    if (!supabaseClient) return;
    
    try {
        switch (item.type) {
            case 'health_record':
                await supabaseClient.from('health_records').insert([item.data]);
                break;
            case 'user_profile':
                await supabaseClient.from('profiles').upsert([item.data]);
                break;
            default:
                console.warn('Unknown sync item type:', item.type);
        }
    } catch (error) {
        console.error('Failed to sync item:', error);
        throw error;
    }
}

/**
 * Queue data for offline sync
 */
function queueForSync(type, data) {
    const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    pendingData.push({
        id: generateId(),
        type,
        data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('pendingSync', JSON.stringify(pendingData));
}

// ========================================
// ANALYTICS & TRACKING
// ========================================

/**
 * Initialize analytics tracking
 */
function initializeAnalytics() {
    // Track page views
    trackPageView();
    
    // Track user interactions
    document.addEventListener('click', trackUserInteraction);
    
    // Track performance metrics
    trackPerformanceMetrics();
}

/**
 * Track page view
 */
function trackPageView() {
    const pageData = {
        page: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        deviceType: getDeviceType()
    };
    
    console.log('Page view tracked:', pageData);
    // In production: send to analytics service
}

/**
 * Track user interactions
 */
function trackUserInteraction(event) {
    const target = event.target;
    
    // Only track buttons and links
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        const interactionData = {
            element: target.tagName,
            text: target.textContent.trim().substring(0, 50),
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        };
        
        console.log('Interaction tracked:', interactionData);
        // In production: send to analytics service
    }
}

/**
 * Track performance metrics
 */
function trackPerformanceMetrics() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const metrics = {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
                timestamp: new Date().toISOString()
            };
            
            console.log('Performance metrics:', metrics);
            // In production: send to analytics service
        }, 0);
    });
}

// ========================================
// FEATURE FLAGS & A/B TESTING
// ========================================

/**
 * Initialize feature flags
 */
function initializeFeatureFlags() {
    // Default feature flags
    window.featureFlags = {
        enableAdvancedAnalytics: true,
        enableBiometricAuth: false,
        enableVoiceCommands: false,
        enableDarkMode: true,
        enableNotifications: true
    };
    
    // Override with server-side flags if available
    fetchFeatureFlags();
}

/**
 * Fetch feature flags from server
 */
async function fetchFeatureFlags() {
    try {
        // In production, fetch from your feature flag service
        // const response = await fetch('/api/feature-flags');
        // const flags = await response.json();
        // window.featureFlags = { ...window.featureFlags, ...flags };
        
        console.log('Feature flags loaded:', window.featureFlags);
        
    } catch (error) {
        console.error('Failed to fetch feature flags:', error);
    }
}

/**
 * Check if feature is enabled
 */
function isFeatureEnabled(featureName) {
    return window.featureFlags?.[featureName] === true;
}

// ========================================
// FINAL INITIALIZATION CALL
// ========================================

/**
 * Initialize additional features after main app setup
 */
function initializeAdditionalFeatures() {
    initializePerformanceMonitoring();
    initializeAccessibility();
    initializePWA();
    initializeDataSync();
    initializeAnalytics();
    initializeFeatureFlags();
}

// Call additional features initialization
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeAdditionalFeatures, 1000);
});

// ========================================
// EXPORT FOR MODULE USAGE (if needed)
// ========================================

// For ES6 modules, you can export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        initializeApp,
        showNotification,
        openModal,
        closeModal,
        startHealthScan,
        isFeatureEnabled
    };
}

// ========================================
// GLOBAL API FOR EXTERNAL INTEGRATIONS
// ========================================

/**
 * Global API for VitalWarrior integration
 */
window.VitalWarrior = {
    // Core functions
    init: initializeApp,
    showNotification,
    openModal,
    closeModal,
    
    // Camera functions
    startScan: startHealthScan,
    stopCamera: stopCameraStream,
    
    // Authentication
    login: (credentials) => handleLoginSubmit(credentials),
    logout: handleLogout,
    
    // State access
    getState: () => ({ ...AppState }),
    isAuthenticated: () => AppState.isAuthenticated,
    
    // Feature flags
    isFeatureEnabled,
    
    // Utilities
    isMobile,
    getDeviceType,
    formatDate,
    copyToClipboard
};

console.log('🛡️ VitalWarrior JavaScript Module Loaded Successfully!');
console.log('Global API available at: window.VitalWarrior');
console.log('For integration help, visit: https://docs.vitalwarrior.com');