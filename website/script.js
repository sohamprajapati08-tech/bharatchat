// ============================================
// BharatChat Landing Page — JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ====== PRELOADER ======
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('loaded');
        }, 2200);
    });
    // Fallback
    setTimeout(() => {
        preloader.classList.add('loaded');
    }, 4000);

    // ====== NAVBAR SCROLL ======
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });

    // ====== MOBILE NAV TOGGLE ======
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // ====== COUNTER ANIMATION ======
    const animateCounters = () => {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-count'));
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();
            const isFloat = target % 1 !== 0;

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = start + (target - start) * easeOut;

                if (isFloat) {
                    counter.textContent = current.toFixed(1);
                } else {
                    counter.textContent = Math.floor(current);
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    if (isFloat) {
                        counter.textContent = target.toFixed(1);
                    } else {
                        counter.textContent = target;
                    }
                }
            };

            requestAnimationFrame(updateCounter);
        });
    };

    // ====== INTERSECTION OBSERVER FOR ANIMATIONS ======
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    // Stats counter observer
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        let counterAnimated = false;
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !counterAnimated) {
                    counterAnimated = true;
                    animateCounters();
                }
            });
        }, observerOptions);
        statsObserver.observe(statsSection);
    }

    // Feature cards animation
    const featureCards = document.querySelectorAll('.feature-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        cardObserver.observe(card);
    });

    // Testimonial cards animation
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const testimonialObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                testimonialObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    testimonialCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        testimonialObserver.observe(card);
    });

    // Security section animation
    const securityContent = document.querySelector('.security-content');
    const securityVisual = document.querySelector('.security-visual');
    
    if (securityContent && securityVisual) {
        const securityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                    securityObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        securityContent.style.opacity = '0';
        securityContent.style.transform = 'translateX(-30px)';
        securityContent.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        
        securityVisual.style.opacity = '0';
        securityVisual.style.transform = 'translateX(30px)';
        securityVisual.style.transition = 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s';

        securityObserver.observe(securityContent);
        securityObserver.observe(securityVisual);
    }

    // ====== SMOOTH SCROLL ======
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = navbar.offsetHeight + 20;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ====== PARALLAX EFFECT ON HERO SHAPES ======
    const shapes = document.querySelectorAll('.shape');
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        shapes.forEach((shape, i) => {
            const speed = (i + 1) * 8;
            shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });

});
