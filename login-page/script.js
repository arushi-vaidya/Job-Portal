// Theme Toggle Functionality
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update toggle button appearance
    updateToggleButton(newTheme);
}

function updateToggleButton(theme) {
    const options = document.querySelectorAll('.toggle-option');
    options.forEach((option, index) => {
        if (theme === 'light' && index === 0) {
            option.style.background = 'var(--accent-primary)';
            option.style.color = 'var(--bg-secondary)';
        } else if (theme === 'dark' && index === 1) {
            option.style.background = 'var(--accent-primary)';
            option.style.color = 'var(--bg-dark)';
        } else {
            option.style.background = 'transparent';
            option.style.color = 'var(--text-secondary)';
        }
    });
}

// Initialize theme on page load
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateToggleButton(savedTheme);
}

// Sticky navbar on scroll
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
function toggleMenu() {
    const navCenter = document.querySelector('.nav-center');
    const navRight = document.querySelector('.nav-right');
    
    if (navCenter) {
        navCenter.style.display = navCenter.style.display === 'flex' ? 'none' : 'flex';
    }
    if (navRight) {
        navRight.style.display = navRight.style.display === 'flex' ? 'none' : 'flex';
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll to section function for Get Started button
function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Animate cards on scroll
    const elementsToAnimate = document.querySelectorAll(
        '.login-card, .service-card, .partner-card, .stat-item'
    );
    
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });
});

// Counter animation for stats
function animateCounter(element, target, duration = 2500) {
    let current = 0;
    const increment = target / (duration / 16);
    const isPercentage = element.textContent.includes('%');
    const hasPlus = element.textContent.includes('+');
    const hasSlash = element.textContent.includes('/');
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        let displayValue = Math.floor(current);
        if (target >= 1000) {
            displayValue = (current / 1000).toFixed(1) + 'K';
        }
        
        if (isPercentage) {
            element.textContent = Math.floor(current) + '%';
        } else if (hasSlash) {
            element.textContent = '24/7';
            clearInterval(timer);
        } else if (hasPlus) {
            element.textContent = displayValue + '+';
        } else {
            element.textContent = displayValue;
        }
    }, 16);
}

// Observe stats for counter animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const statNumber = entry.target.querySelector('.stat-number');
            const text = statNumber.textContent;
            
            if (text.includes('50K')) {
                animateCounter(statNumber, 50000);
            } else if (text.includes('5K')) {
                animateCounter(statNumber, 5000);
            } else if (text.includes('95')) {
                animateCounter(statNumber, 95);
            }
        }
    });
}, { threshold: 0.5 });

// Apply stats observer when DOM is loaded
window.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.stat-item').forEach(stat => {
        statsObserver.observe(stat);
    });
});

// 3D visual mouse follow effect
const visualContainer = document.querySelector('.visual-3d');
if (visualContainer) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
    });

    function animate() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        
        if (visualContainer) {
            visualContainer.style.transform = `translate(${currentX}px, ${currentY}px) rotateX(5deg)`;
        }
        
        requestAnimationFrame(animate);
    }

    animate();
}

// Add ripple effect to cards
document.querySelectorAll('.login-card, .service-card, .partner-card').forEach(card => {
    card.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'radial-gradient(circle, rgba(203, 213, 224, 0.6) 0%, transparent 70%)';
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.pointerEvents = 'none';
        ripple.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
        ripple.style.transform = 'scale(0)';
        ripple.style.opacity = '1';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(2)';
            ripple.style.opacity = '0';
        }, 10);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Parallax effect for layers
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const layers = document.querySelectorAll('.layer');
    
    layers.forEach((layer, index) => {
        const speed = (index + 1) * 0.1;
        if (scrolled < 1000) {
            layer.style.transform = `translateZ(${30 * (index - 1)}px) translateY(${scrolled * speed}px)`;
        }
    });
});

// Add hover tilt effect to cards
document.querySelectorAll('.login-card, .service-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        this.style.transform = `translateY(-12px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
    });
});