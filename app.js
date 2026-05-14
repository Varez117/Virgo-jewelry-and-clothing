/* =====================================================================
   APP.JS - MOTOR PRINCIPAL DE LA TIENDA
   Este archivo es el "cerebro" de tu página web. Aquí conectamos los 
   datos (data.json) con la parte visual (HTML/CSS). Maneja clics, 
   animaciones, el carrito de compras, los filtros y la conexión a WhatsApp.
===================================================================== */

// ==========================================
// 1. VARIABLES DE ESTADO GLOBAL
// ==========================================
let currentTheme = localStorage.getItem("virgoTheme") || "light";
let globalData = null;

// ==========================================
// 2. CONFIGURACIÓN DEL CATÁLOGO DE PRODUCTOS
// ==========================================
let allProducts = [];
let filteredProducts = [];
let itemsPerPage = 12;
let visibleItems = itemsPerPage;
let currentCategory = "Todos";
let currentSort = "Recomendados";
let currentSearch = "";

// ==========================================
// 3. VARIABLES DE INTERFAZ Y CARRITO
// ==========================================
let isMobileMenuOpen = false;
let cart = JSON.parse(localStorage.getItem("virgoCart")) || [];
let isCartOpen = false;
let selectedProductToCart = { id: null, talla: null, color: null };
let carouselInterval = null;

// ==========================================
// 4. ICONOS SVG (Rendimiento Seguro)
// ==========================================
const iconsSVG = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 md:w-7 md:h-7"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 md:w-7 md:h-7"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5 md:w-7 md:h-7"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
  emptyCart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-16 h-16 mb-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0zM12 9L15 6M15 6L18 9M15 6V14" /></svg>`,
};

// ==========================================
// 5. INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
async function initApp() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("No se pudo cargar el JSON");
    globalData = await response.json();
    allProducts = globalData.productsSection.items;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");
    if (categoryParam) currentCategory = categoryParam;

    applyFiltersAndSort(true);
    applyThemeVariables(currentTheme);
    renderNavbar(globalData.navbar);
    renderCartUI();

    if (!checkStoreStatus(globalData.scheduleSection.hoursLogic)) {
      renderClosedModal(globalData.scheduleSection.closedModalData);
      return;
    }

    if (document.getElementById("hero-container")) renderHero(globalData.hero);
    if (document.getElementById("carousel-container")) renderCarousel();
    if (document.getElementById("categories-container"))
      renderCategories(globalData.categoriesSection);
    if (document.getElementById("products-container"))
      renderProductsSection(globalData.productsSection);

    initScrollFeatures();

    if (window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 400);
    }
  } catch (error) {
    console.error("Error inicializando la app:", error);
  }
}

// ==========================================
// 6. FUNCIONES DE EFECTOS Y SCROLL
// ==========================================
function initScrollFeatures() {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    },
    { threshold: 0.1 },
  );

  reveals.forEach((reveal) => observer.observe(reveal));

  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar-container");
    const backToTop = document.getElementById("btn-back-to-top");
    const currentScrollY = window.scrollY;

    if (window.innerWidth <= 768) {
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        navbar.style.transform = "translateY(-100%)";
      } else {
        navbar.style.transform = "translateY(0)";
      }
    } else {
      navbar.style.transform = "translateY(0)";
    }

    lastScrollY = currentScrollY;

    if (currentScrollY > 10) {
      if (navbar) navbar.classList.add("shadow-md");
      if (backToTop) {
        backToTop.classList.remove("opacity-0", "pointer-events-none");
        backToTop.classList.add("opacity-100");
      }
    } else {
      if (navbar) navbar.classList.remove("shadow-md");
      if (backToTop) {
        backToTop.classList.add("opacity-0", "pointer-events-none");
        backToTop.classList.remove("opacity-100");
      }
    }
  });
}

// ==========================================
// 7. LÓGICA DE TIENDA: HORARIOS, CARRITO Y WHATSAPP
// ==========================================
function checkStoreStatus(hoursLogic) {
  const now = new Date();
  const todayRules = hoursLogic[now.getDay().toString()];
  if (todayRules.closed) return false;
  const hour = now.getHours();
  return hour >= todayRules.open && hour < todayRules.close;
}

function updateCartStorage() {
  localStorage.setItem("virgoCart", JSON.stringify(cart));
  renderNavbar(globalData.navbar);
  renderCartUI();
}

function addToCart(product, talla, color) {
  const existingIndex = cart.findIndex(
    (item) =>
      item.id === product.id && item.talla === talla && item.color === color,
  );

  if (existingIndex > -1) {
    cart[existingIndex].cantidad += 1;
  } else {
    cart.push({ ...product, talla, color, cantidad: 1 });
  }

  updateCartStorage();
  closeProductModal();
  toggleCart(true);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartStorage();
}

function updateQuantity(index, delta) {
  cart[index].cantidad += delta;
  if (cart[index].cantidad <= 0) removeFromCart(index);
  else updateCartStorage();
}

function sendOrderToWhatsApp() {
  if (cart.length === 0) return;
  const phone = globalData.config.store.whatsapp;
  let message = "Hola *Virgo*, me gustaría realizar el siguiente pedido:\n\n";
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    message += `*${index + 1}. ${item.nombre}*\n`;
    message += `   - Talla: ${item.talla}\n`;
    message += `   - Color: ${item.color}\n`;
    message += `   - Cantidad: ${item.cantidad}\n`;
    message += `   - Subtotal: $${subtotal.toFixed(2)}\n\n`;
  });

  message += `*Total del pedido: $${total.toFixed(2)}*\n\n`;
  message += "Quedo atento/a a las instrucciones de pago y envío. ¡Gracias!";

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  cart = [];
  updateCartStorage();
  toggleCart(false);
}

// ==========================================
// 8. MODALES INFORMATIVOS (VENTANAS EMERGENTES)
// ==========================================
function openInfoModal(type) {
  const container = document.getElementById("info-modal-container");
  document.body.style.overflow = "hidden";
  let contentHTML = "";

  if (type === "about") {
    const data = globalData.aboutSection;
    contentHTML = `<div class="text-center"><h2 class="text-4xl font-serif text-textMain mb-6">${data.title}</h2><p class="text-textMuted text-lg leading-relaxed">${data.content}</p></div>`;
  } else if (type === "location") {
    const data = globalData.locationSection;
    contentHTML = `<h2 class="text-3xl font-serif text-textMain mb-2 flex items-center gap-2"><span class="text-primary text-2xl">📍</span> ${data.title}</h2><p class="text-textMuted mb-6">${data.address}</p><div class="w-full h-[300px] bg-cardBg border border-borderColor rounded-3xl overflow-hidden relative shadow-inner"><iframe src="${data.mapEmbedUrl}" width="100%" height="100%" style="border:0; filter: ${currentTheme === "dark" ? "invert(90%) hue-rotate(180deg)" : "none"};" allowfullscreen="" loading="lazy" class="absolute inset-0"></iframe></div>`;
  } else if (type === "schedule") {
    const data = globalData.scheduleSection;
    const daysHTML = data.days
      .map(
        (d) =>
          `<div class="flex justify-between py-4 border-b border-borderColor last:border-0"><span class="font-medium text-textMain">${d.day}</span><span class="text-textMuted">${d.hours}</span></div>`,
      )
      .join("");
    contentHTML = `<h2 class="text-3xl font-serif text-textMain mb-6 flex items-center gap-2"><span class="text-primary text-2xl">🕒</span> ${data.title}</h2><div class="flex flex-col">${daysHTML}</div><div class="mt-8 p-4 bg-bgLight rounded-2xl border border-borderColor text-center"><p class="text-sm text-primary font-bold italic">${data.note}</p></div>`;
  }

  container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeInfoModal()"></div>
            <div class="relative bg-cardBg w-full max-w-2xl rounded-3xl p-8 md:p-12 shadow-2xl transition-colors duration-300 max-h-[90vh] overflow-y-auto hide-scrollbar">
                <button onclick="closeInfoModal()" class="absolute top-4 right-4 z-10 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primaryHover text-xl btn-press">×</button>
                ${contentHTML}
                <div class="mt-10 pt-6 border-t border-borderColor flex justify-center md:justify-end">
                    <button onclick="closeInfoModal()" class="px-6 py-2 rounded-full bg-primary text-white hover:bg-primaryHover shadow-md transition-colors w-full md:w-auto font-medium btn-press">Cerrar Ventana</button>
                </div>
            </div>
        </div>
    `;

  isMobileMenuOpen = false;
  renderNavbar(globalData.navbar);
}

function closeInfoModal() {
  document.getElementById("info-modal-container").innerHTML = "";
  document.body.style.overflow = "auto";
}

// ==========================================
// 9. FUNCIONES DE BARRA DE NAVEGACIÓN Y MENÚ MÓVIL
// ==========================================
function toggleMobileMenu() {
  isMobileMenuOpen = !isMobileMenuOpen;
  renderNavbar(globalData.navbar);
}

function handleNavClick() {
  if (isMobileMenuOpen) {
    isMobileMenuOpen = false;
    renderNavbar(globalData.navbar);
  }
}

function toggleCart(forceOpen = null) {
  isCartOpen = forceOpen !== null ? forceOpen : !isCartOpen;
  renderCartUI();
}

function renderNavbar(data) {
  const container = document.getElementById("navbar-container");
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const themeIcon = currentTheme === "light" ? iconsSVG.moon : iconsSVG.sun;

  const linksHTML = data.links
    .map(
      (link) =>
        `<a href="${link.href}" onclick="handleNavClick()" class="block py-4 px-6 border-b border-borderColor last:border-none md:border-none md:inline-block md:py-2 md:px-0 text-textMuted hover:text-primary hover:bg-cardBg md:hover:bg-transparent transition-colors text-lg md:text-lg font-medium btn-press">${link.label}</a>`,
    )
    .join("");

  container.innerHTML = `
        <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 relative">
            <div class="flex justify-between items-center w-full relative z-50 bg-bgLight">
                <a href="index.html" class="flex items-center gap-1.5 md:gap-2 btn-press min-w-0">
                    <img src="${data.logo.iconSrc}" alt="Icono" class="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0">
                    <span class="text-xl sm:text-2xl md:text-4xl font-serif font-bold text-primary italic truncate">${data.logo.text}</span>
                </a>
                
                <nav class="hidden md:flex gap-6 items-center">${linksHTML}</nav>
                
                <div class="flex items-center gap-0.5 md:gap-3 text-textMain shrink-0">
                    <button onclick="toggleTheme()" class="p-1.5 md:p-3 rounded-full hover:bg-cardBg transition-colors border border-transparent text-textMain flex items-center justify-center btn-press">
                        ${themeIcon}
                    </button>
                    <button onclick="toggleCart()" class="relative p-1.5 md:p-3 rounded-full hover:bg-cardBg transition-colors border border-transparent text-textMain flex items-center justify-center btn-press">
                        ${iconsSVG.cart}
                        ${totalItems > 0 ? `<span class="absolute -top-1 -right-1 md:-top-1 md:-right-1 bg-primary text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full">${totalItems}</span>` : ""}
                    </button>
                    
                    <button onclick="toggleMobileMenu()" class="md:hidden flex items-center gap-1 text-[11px] md:text-sm font-medium text-textMuted hover:text-primary border border-borderColor px-2.5 py-1 md:px-4 md:py-2 rounded-full btn-press ml-1">
                        Menú <span class="text-[9px] md:text-xs">▼</span>
                    </button>
                </div>
            </div>
            
            <div class="${isMobileMenuOpen ? "block" : "hidden"} md:hidden absolute top-full left-0 w-full bg-bgLight shadow-2xl border-t border-borderColor transition-all duration-300 z-[90] animate-fade-in origin-top">
                <div class="flex flex-col w-full">
                    ${linksHTML}
                </div>
            </div>
        </div>
    `;
}

function renderCartUI() {
  const container = document.getElementById("cart-container");
  if (!container) return;

  if (!isCartOpen) {
    container.innerHTML = "";
    document.body.style.overflow = "auto";
    return;
  }

  document.body.style.overflow = "hidden";
  const total = cart.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );

  const cartItemsHTML =
    cart.length === 0
      ? `<div class="flex flex-col items-center justify-center h-full text-textMuted opacity-60">
             ${iconsSVG.emptyCart}
             <p>Tu carrito está vacío</p>
           </div>`
      : cart
          .map(
            (item, index) => `
            <div class="flex gap-4 p-4 border-b border-borderColor bg-bgLight relative">
                <img src="${item.referencia_imagen}" class="w-20 h-24 object-cover rounded-md border border-borderColor">
                <div class="flex-grow flex flex-col justify-between pr-6">
                    <div>
                        <h4 class="text-sm font-bold text-textMain line-clamp-1">${item.nombre}</h4>
                        <p class="text-xs text-textMuted mt-1">Talla: ${item.talla} | Color: ${item.color}</p>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex items-center border border-borderColor rounded-md overflow-hidden bg-cardBg">
                            <button onclick="updateQuantity(${index}, -1)" class="px-2 py-1 hover:bg-borderColor text-textMain btn-press">-</button>
                            <span class="px-2 text-sm font-medium text-textMain">${item.cantidad}</span>
                            <button onclick="updateQuantity(${index}, 1)" class="px-2 py-1 hover:bg-borderColor text-textMain btn-press">+</button>
                        </div>
                        <span class="font-bold text-textMain">$${(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="absolute top-4 right-4 text-textMuted hover:text-red-500 transition-colors btn-press">
                    ${iconsSVG.trash}
                </button>
            </div>
        `,
          )
          .join("");

  container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex justify-end animate-fade-in">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="toggleCart(false)"></div>
            <div class="relative w-full max-w-md bg-cardBg h-full flex flex-col shadow-2xl transition-transform transform translate-x-0">
                <div class="flex justify-between items-center p-6 border-b border-borderColor bg-bgLight">
                    <h2 class="text-xl font-serif font-bold text-textMain">Tu Carrito</h2>
                    <button onclick="toggleCart(false)" class="text-textMuted hover:text-primary text-3xl leading-none btn-press">×</button>
                </div>
                <div class="flex-grow overflow-y-auto hide-scrollbar">
                    ${cartItemsHTML}
                </div>
                <div class="p-6 border-t border-borderColor bg-bgLight">
                    <div class="flex justify-between mb-4 text-lg font-bold text-textMain">
                        <span>Total</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    <button ${cart.length === 0 ? "disabled" : ""} onclick="sendOrderToWhatsApp()" class="btn-primary w-full py-3 text-lg btn-press">
                        Continuar con el pedido
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 10. LÓGICA DE LOS CARRUSELES (GENERAL Y MINI)
// ==========================================

// Función manual para cambiar imágenes individualmente en las tarjetas de producto (Con bucle infinito)
window.slideCardImage = function (event, direction) {
  event.stopPropagation();
  const container = event.currentTarget.parentElement.parentElement;
  const slider = container.querySelector(".snap-mandatory");
  if (!slider) return;

  const step = slider.clientWidth;
  const maxScroll = slider.scrollWidth - step;
  let currentScroll = slider.scrollLeft;

  if (direction === 1) {
    // Hacia la derecha (Siguiente)
    if (currentScroll >= maxScroll - 10) {
      // Si está en el final, regresa al principio
      slider.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: step, behavior: "smooth" });
    }
  } else {
    // Hacia la izquierda (Anterior)
    if (currentScroll <= 10) {
      // Si está en el principio, salta a la última imagen
      slider.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: -step, behavior: "smooth" });
    }
  }
};

// Carrusel General de Novedades
window.moveCarousel = function (direction) {
  const track = document.getElementById("slider-track");
  if (!track || track.dataset.animating === "true") return;
  track.dataset.animating = "true";

  const card = track.querySelector(".carousel-item");
  if (!card) return;

  const step = card.offsetWidth + 24;
  const start = track.scrollLeft;
  const end = start + step * direction;
  const duration = 600;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);

    track.scrollLeft = start + (end - start) * ease;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      const totalOriginal = allProducts.filter((p) => p.destacado).length;
      if (track.scrollLeft < step * 0.5) {
        track.scrollLeft += step * totalOriginal;
      } else if (track.scrollLeft > step * (totalOriginal * 2.5)) {
        track.scrollLeft -= step * totalOriginal;
      }
      track.dataset.animating = "false";
    }
  }
  requestAnimationFrame(animate);
};

function renderCarousel() {
  const container = document.getElementById("carousel-container");
  const destacados = allProducts.filter((p) => p.destacado);

  if (destacados.length === 0) {
    container.innerHTML = "";
    return;
  }

  const cardsHTML = destacados
    .map((item) => {
      const imagenes =
        item.imagenes && item.imagenes.length > 0
          ? item.imagenes
          : [item.referencia_imagen];
      const hasMultiple = imagenes.length > 1;
      return `
        <div onclick="openProductModal(${item.id})" class="carousel-item shrink-0 min-w-full w-full md:min-w-0 md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] group cursor-pointer bg-bgLight border border-borderColor rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div class="relative h-80 overflow-hidden bg-cardBg group/mini-slider">
                <div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-full w-full" style="scroll-behavior: smooth;">
                    ${imagenes.map((img) => `<img src="${img}" alt="${item.nombre}" class="w-full h-full object-cover shrink-0 snap-center transition-transform duration-700">`).join("")}
                </div>
                ${
                  hasMultiple
                    ? `
                <div class="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/mini-slider:opacity-100 transition-opacity">
                    <button onclick="slideCardImage(event, -1)" class="w-8 h-8 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-sm shadow-sm bg-bgLight btn-press">◀</button>
                </div>
                <div class="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/mini-slider:opacity-100 transition-opacity">
                    <button onclick="slideCardImage(event, 1)" class="w-8 h-8 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-sm shadow-sm bg-bgLight btn-press">▶</button>
                </div>
                `
                    : ""
                }
                <div class="absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 text-textMain px-3 py-1 rounded-full text-xs font-bold border border-borderColor shadow-sm flex items-center gap-1">
                    ✨ Nuevo
                </div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <p class="text-xs text-primary font-bold uppercase tracking-wider mb-1">${item.categoria}</p>
                    <h4 class="text-xl font-bold text-textMain mb-1 line-clamp-1">${item.nombre}</h4>
                </div>
                <div class="flex justify-between items-center mt-3 pt-4 border-t border-borderColor">
                    <span class="text-xl font-bold text-textMain">$${item.precio.toFixed(2)}</span>
                </div>
            </div>
        </div>
        `;
    })
    .join("");

  container.innerHTML = `
        <div class="mb-10 flex flex-col items-center relative text-center">
            <div>
                <h2 class="text-4xl font-serif text-textMain mb-2">Novedades Exclusivas</h2>
                <p class="text-textMuted">Las últimas tendencias seleccionadas para ti.</p>
            </div>
            
            <div class="flex gap-4 justify-center w-full mt-6">
                <button onclick="moveCarousel(-1)" class="w-12 h-12 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-xl shadow-sm bg-bgLight btn-press">◀</button>
                <button onclick="moveCarousel(1)" class="w-12 h-12 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-xl shadow-sm bg-bgLight btn-press">▶</button>
            </div>
        </div>
        
        <div id="slider-track" class="flex gap-6 overflow-x-auto pb-8 w-full touch-pan-y hide-scrollbar">
            ${cardsHTML}${cardsHTML}${cardsHTML}${cardsHTML}
        </div>
    `;

  setTimeout(() => {
    const track = document.getElementById("slider-track");
    if (!track) return;
    const card = track.querySelector(".carousel-item");
    const step = card.offsetWidth + 24;
    const totalOriginal = destacados.length;

    track.scrollLeft = step * totalOriginal;

    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
      moveCarousel(1);
    }, 3000);

    window.addEventListener("resize", () => {
      const currentCard = track.querySelector(".carousel-item");
      if (!currentCard) return;

      const newStep = currentCard.offsetWidth + 24;
      const closestCardIndex = Math.round(track.scrollLeft / newStep);
      track.scrollLeft = closestCardIndex * newStep;
    });
  }, 300);
}

// ==========================================
// 11. SISTEMA DEL CATÁLOGO COMPLETO
// ==========================================
function updateCatalogState(type, value) {
  if (type === "search") currentSearch = value;
  if (type === "filter") currentCategory = value;
  if (type === "sort") currentSort = value;
  applyFiltersAndSort();
}

function applyFiltersAndSort(isInit = false) {
  let result = [...allProducts];

  if (currentSearch.trim() !== "") {
    const query = currentSearch.toLowerCase();
    result = result.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion.toLowerCase().includes(query),
    );
  }

  if (currentCategory !== "Todos")
    result = result.filter((p) => p.categoria === currentCategory);

  if (currentSort === "Menor Precio")
    result.sort((a, b) => a.precio - b.precio);
  else if (currentSort === "Mayor Precio")
    result.sort((a, b) => b.precio - a.precio);
  else result.sort((a, b) => a.id - b.id);

  filteredProducts = result;
  visibleItems = itemsPerPage;

  if (!isInit && document.getElementById("catalog-grid")) renderProductGrid();
}

function loadMoreItems() {
  visibleItems += itemsPerPage;
  renderProductGrid();
}

function renderProductsSection(data) {
  const container = document.getElementById("products-container");

  const filtersHTML = data.filters
    .map((filter) => {
      const isActive =
        filter === currentCategory
          ? "filter-active"
          : "bg-white dark:bg-gray-800 text-textMuted border border-borderColor hover:border-primary";
      return `<button onclick="updateCatalogState('filter', '${filter}')" class="px-6 py-2 rounded-full text-sm font-medium transition-colors shadow-sm btn-press ${isActive}">${filter}</button>`;
    })
    .join("");

  container.innerHTML = `
        <div class="text-center mb-10 pt-4 transition-colors duration-300">
            <h2 class="text-4xl font-serif text-textMain mb-4">${data.title}</h2>
            <p class="text-textMuted max-w-2xl mx-auto mb-8">${data.subtitle}</p>
            <div class="max-w-md mx-auto mb-8 relative">
                <input type="text" placeholder="Buscar por nombre o detalle..." class="w-full bg-white dark:bg-gray-800 border border-borderColor text-textMain px-5 py-3 rounded-full outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" onkeyup="updateCatalogState('search', this.value)">
                <span class="absolute right-4 top-3 text-textMuted text-xl">⌕</span>
            </div>
            <div class="flex flex-wrap justify-center gap-3 mb-8" id="catalog-filters">${filtersHTML}</div>
            <div class="flex flex-col sm:flex-row justify-between items-center text-sm text-textMuted mb-6 px-2 gap-4">
                <span id="catalog-count">Cargando...</span>
                <select class="border border-borderColor bg-white dark:bg-gray-800 text-textMain px-4 py-2 rounded-lg font-medium cursor-pointer outline-none shadow-sm" onchange="updateCatalogState('sort', this.value)">
                    <option value="Recomendados">Recomendados</option>
                    <option value="Menor Precio">Menor Precio</option>
                    <option value="Mayor Precio">Mayor Precio</option>
                </select>
            </div>
        </div>
        <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        <div id="load-more-container" class="text-center mt-12 hidden">
            <button onclick="loadMoreItems()" class="btn-primary shadow-md btn-press">Ver Más Prendas ▾</button>
        </div>
    `;
  renderProductGrid();
}

function renderProductGrid() {
  const grid = document.getElementById("catalog-grid");
  const countDisplay = document.getElementById("catalog-count");
  const loadMoreContainer = document.getElementById("load-more-container");
  const filtersContainer = document.getElementById("catalog-filters");

  if (filtersContainer) {
    const buttons = filtersContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
      if (btn.innerText === currentCategory)
        btn.className =
          "px-6 py-2 rounded-full text-sm font-medium transition-colors shadow-sm filter-active btn-press";
      else
        btn.className =
          "px-6 py-2 rounded-full text-sm font-medium transition-colors bg-white dark:bg-gray-800 text-textMuted border border-borderColor hover:border-primary shadow-sm btn-press";
    });
  }

  countDisplay.innerText = `Mostrando ${filteredProducts.length} productos`;

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
            <div class="col-span-full text-center py-20 animate-fade-in">
                <div class="text-5xl mb-4">👗</div>
                <h3 class="text-xl font-bold text-textMain mb-2">No encontramos resultados</h3>
                <p class="text-textMuted">Intenta con otra búsqueda o categoría.</p>
            </div>
        `;
    loadMoreContainer.classList.add("hidden");
    return;
  }

  const itemsToShow = filteredProducts.slice(0, visibleItems);

  grid.innerHTML = itemsToShow
    .map((item) => {
      const imagenes =
        item.imagenes && item.imagenes.length > 0
          ? item.imagenes
          : [item.referencia_imagen];
      const hasMultiple = imagenes.length > 1;
      return `
        <div onclick="openProductModal(${item.id})" class="group cursor-pointer bg-bgLight border border-borderColor rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col animate-fade-in">
            <div class="relative h-80 overflow-hidden bg-cardBg group/mini-slider">
                <div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-full w-full" style="scroll-behavior: smooth;">
                    ${imagenes.map((img) => `<img src="${img}" alt="${item.nombre}" class="w-full h-full object-cover shrink-0 snap-center transition-transform duration-700">`).join("")}
                </div>
                ${
                  hasMultiple
                    ? `
                <div class="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/mini-slider:opacity-100 transition-opacity">
                    <button onclick="slideCardImage(event, -1)" class="w-8 h-8 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-sm shadow-sm bg-bgLight btn-press">◀</button>
                </div>
                <div class="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/mini-slider:opacity-100 transition-opacity">
                    <button onclick="slideCardImage(event, 1)" class="w-8 h-8 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-sm shadow-sm bg-bgLight btn-press">▶</button>
                </div>
                `
                    : ""
                }
                <div class="absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 text-textMain px-3 py-1 rounded-full text-xs font-bold border border-borderColor shadow-sm">
                    ${item.tallas.length} Tallas
                </div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <p class="text-xs text-primary font-bold uppercase tracking-wider mb-1">${item.categoria}</p>
                    <h4 class="text-lg font-bold text-textMain mb-1 line-clamp-1">${item.nombre}</h4>
                    <p class="text-sm text-textMuted mb-3 line-clamp-2">${item.descripcion}</p>
                </div>
                <div class="flex justify-between items-center mt-2 pt-3 border-t border-borderColor">
                    <div class="flex gap-1">
                        ${item.colores
                          .slice(0, 3)
                          .map(
                            (c) =>
                              `<span class="w-3 h-3 rounded-full border border-gray-300" style="background-color: ${getColorHex(c)}" title="${c}"></span>`,
                          )
                          .join("")}
                        ${item.colores.length > 3 ? `<span class="text-[10px] text-textMuted">+</span>` : ""}
                    </div>
                    <span class="text-lg font-bold text-textMain">$${item.precio.toFixed(2)}</span>
                </div>
            </div>
        </div>
        `;
    })
    .join("");

  if (visibleItems < filteredProducts.length)
    loadMoreContainer.classList.remove("hidden");
  else loadMoreContainer.classList.add("hidden");

  const container = document.getElementById("products-container");
  if (container) container.classList.add("active");
}

// ==========================================
// 12. SISTEMA DE DETALLE DE PRODUCTO Y COMPRA
// ==========================================
function openProductModal(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  selectedProductToCart = { id: product.id, talla: null, color: null };
  const container = document.getElementById("product-modal-container");
  document.body.style.overflow = "hidden";

  const imagenes =
    product.imagenes && product.imagenes.length > 0
      ? product.imagenes
      : [product.referencia_imagen];
  const hasMultiple = imagenes.length > 1;

  container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeProductModal()"></div>
            <div class="relative bg-bgLight w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                <button onclick="closeProductModal()" class="absolute top-4 right-4 z-10 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primaryHover text-xl btn-press">×</button>
                <div class="w-full md:w-1/2 h-64 md:h-auto bg-cardBg relative group/mini-slider">
                    <div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-full w-full" style="scroll-behavior: smooth;">
                        ${imagenes.map((img) => `<img src="${img}" class="w-full h-full object-cover shrink-0 snap-center">`).join("")}
                    </div>
                    ${
                      hasMultiple
                        ? `
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/mini-slider:opacity-100 transition-opacity">
                        <button onclick="slideCardImage(event, -1)" class="w-10 h-10 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-xl shadow-sm bg-bgLight btn-press">◀</button>
                    </div>
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/mini-slider:opacity-100 transition-opacity">
                        <button onclick="slideCardImage(event, 1)" class="w-10 h-10 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-xl shadow-sm bg-bgLight btn-press">▶</button>
                    </div>
                    `
                        : ""
                    }
                </div>
                <div class="w-full md:w-1/2 p-8 overflow-y-auto hide-scrollbar flex flex-col">
                    <p class="text-xs text-primary font-bold uppercase tracking-wider mb-2">${product.categoria}</p>
                    <h2 class="text-3xl font-serif text-textMain mb-2">${product.nombre}</h2>
                    <p class="text-2xl font-bold text-textMain mb-4">$${product.precio.toFixed(2)}</p>
                    <p class="text-textMuted mb-8">${product.descripcion}</p>
                    
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <span class="font-bold text-textMain text-sm">Selecciona una Talla:</span>
                            <span id="modal-error-talla" class="text-red-500 text-xs hidden">Requerido</span>
                        </div>
                        <div class="flex flex-wrap gap-2" id="modal-tallas">
                            ${product.tallas.map((t) => `<button data-value="${t}" onclick="selectOption('talla', '${t}')" class="selector-btn btn-press px-4 py-2 rounded-md font-medium text-sm">${t}</button>`).join("")}
                        </div>
                    </div>

                    <div class="mb-8">
                        <div class="flex justify-between items-center mb-3">
                            <span class="font-bold text-textMain text-sm">Selecciona un Color:</span>
                            <span id="modal-error-color" class="text-red-500 text-xs hidden">Requerido</span>
                        </div>
                        <div class="flex flex-wrap gap-2" id="modal-colores">
                            ${product.colores.map((c) => `<button data-value="${c}" onclick="selectOption('color', '${c}')" class="selector-btn btn-press px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"><span class="w-3 h-3 rounded-full border border-gray-300 block" style="background-color: ${getColorHex(c)}"></span>${c}</button>`).join("")}
                        </div>
                    </div>

                    <div class="mt-auto pt-6">
                        <button onclick="attemptAddToCart(${product.id})" class="btn-primary w-full py-4 text-lg mb-3 shadow-md hover:shadow-lg btn-press">Añadir al Carrito</button>
                        <button onclick="closeProductModal()" class="w-full py-3 text-textMuted border border-borderColor rounded-full hover:bg-cardBg hover:text-textMain transition-colors font-medium btn-press">
                            Volver al Catálogo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function selectOption(type, value) {
  selectedProductToCart[type] = value;
  const container = document.getElementById(
    type === "talla" ? "modal-tallas" : "modal-colores",
  );
  const buttons = container.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (btn.dataset.value === value) btn.classList.add("selected");
    else btn.classList.remove("selected");
  });
  document.getElementById(`modal-error-${type}`).classList.add("hidden");
}

function attemptAddToCart(productId) {
  const product = allProducts.find((p) => p.id === productId);
  let hasError = false;

  if (!selectedProductToCart.talla) {
    document.getElementById("modal-error-talla").classList.remove("hidden");
    hasError = true;
  }
  if (!selectedProductToCart.color) {
    document.getElementById("modal-error-color").classList.remove("hidden");
    hasError = true;
  }
  if (hasError) return;

  addToCart(product, selectedProductToCart.talla, selectedProductToCart.color);
}

function closeProductModal() {
  document.getElementById("product-modal-container").innerHTML = "";
  document.body.style.overflow = "auto";
}

function getColorHex(colorName) {
  const colors = {
    Blanco: "#ffffff",
    Negro: "#000000",
    "Gris Jaspeado": "#9ca3af",
    "Rosa Claro": "#fbcfe8",
    Lila: "#d8b4fe",
    Mostaza: "#eab308",
    Rojo: "#ef4444",
    Beige: "#f5f5dc",
    "Azul Marino": "#1e3a8a",
    Perla: "#fdf6e3",
    Arena: "#d2b48c",
    "Rojo Vino": "#722f37",
    Multicolor: "linear-gradient(to right, red, yellow, blue)",
    "Azul Esmeralda": "#10b981",
    Plata: "#c0c0c0",
    Coral: "#ff7f50",
    "Lila Suave": "#e9d5ff",
    Crema: "#fffdd0",
    Camel: "#c19a6b",
    "Rosa Empolvado": "#ffc0cb",
    "Azul Pastel": "#bfdbfe",
    "Verde Olivo": "#4b5320",
    "Rojo Cereza": "#de3163",
    "Blanco Roto": "#faf0e6",
    "Azul Claro": "#add8e6",
    "Azul Vintage": "#5c829c",
    "Verde Militar": "#4b5320",
    "Floral Marino": "#1e3a8a",
    "Azul Deslavado": "#7ea6c2",
    "Negro Brillante": "#2a2a2a",
    "Azul Oscuro": "#00008b",
  };
  return colors[colorName] || "#cccccc";
}

// ==========================================
// 13. TEMAS Y SECCIONES ESTATÍCAS DE LA HOME
// ==========================================
function applyThemeVariables(themeType) {
  if (!globalData) return;
  const root = document.documentElement;
  const themeData = globalData.config.theme[themeType];

  root.style.setProperty("--color-primary", themeData.primary);
  root.style.setProperty("--color-primary-hover", themeData.primaryHover);
  root.style.setProperty("--color-bg-light", themeData.bgLight);
  root.style.setProperty("--color-text-main", themeData.textMain);
  root.style.setProperty("--color-text-muted", themeData.textMuted);
  root.style.setProperty("--color-card-bg", themeData.cardBg);
  root.style.setProperty("--color-border", themeData.border);

  if (themeType === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("virgoTheme", currentTheme);
  applyThemeVariables(currentTheme);
  renderNavbar(globalData.navbar);

  if (document.getElementById("hero-container")) renderHero(globalData.hero);
  if (document.getElementById("categories-container"))
    renderCategories(globalData.categoriesSection);
}

function renderClosedModal(data) {
  document.body.style.overflow = "hidden";
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4";
  modal.innerHTML = `
        <div class="bg-cardBg border border-borderColor rounded-3xl p-8 md:p-12 text-center max-w-md w-full shadow-2xl relative overflow-hidden animate-fade-in">
            <div class="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            <div class="w-20 h-20 bg-bgLight rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-borderColor">
                <img src="${data.icon}" alt="Cerrado" class="w-10 h-10">
            </div>
            <h2 class="text-3xl font-serif text-textMain mb-4">${data.title}</h2>
            <p class="text-textMuted mb-8 text-base">${data.message}</p>
        </div>
    `;
  document.body.appendChild(modal);
}

function renderHero(data) {
  const heroBg = currentTheme === "light" ? "bg-[#fff5f6]" : "bg-[#2e1019]";
  document.getElementById("hero-container").innerHTML = `
        <div class="w-full ${heroBg} transition-colors duration-300 py-16 md:py-24 border-b border-borderColor">
            <div class="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
                <div class="md:w-1/2 space-y-6 md:pl-20 lg:pl-32">
                    <h1 class="text-5xl md:text-7xl font-serif text-textMain leading-tight">${data.titleNormal} <br><span class="text-primary italic">${data.titleHighlight}</span></h1>
                    <p class="text-textMuted text-lg max-w-md">${data.description}</p>
                    <a href="catalogo.html" class="btn-primary btn-neon mt-4 inline-flex shadow-md btn-press">${data.buttonText} <span>${data.buttonIcon}</span></a>
                </div>
                <div class="md:w-1/2">
                    <img src="${data.imageSrc}" alt="Colección" class="w-full h-[400px] md:h-[500px] object-cover rounded-2xl shadow-2xl">
                </div>
            </div>
        </div>
    `;
}

function renderCategories(data) {
  const container = document.getElementById("categories-container");
  if (!container) return;

  const orderMap = { Pantalones: 1, Playeras: 2, Blusas: 3, Suéteres: 4 };
  const classMap = {
    Pantalones: "md:col-span-2",
    Playeras: "md:col-span-1",
    Blusas: "md:col-span-1",
    Suéteres: "md:col-span-2",
  };

  const sortedItems = [...data.items].sort(
    (a, b) => orderMap[a.title] - orderMap[b.title],
  );

  const itemsHTML = sortedItems
    .map((item) => {
      const count = allProducts.filter(
        (p) => p.categoria === item.title,
      ).length;
      const gridClass = classMap[item.title] || "md:col-span-1";
      return `
            <a href="catalogo.html?category=${encodeURIComponent(item.title)}" class="${gridClass} relative h-64 md:h-80 rounded-2xl overflow-hidden hover-zoom cursor-pointer shadow-md border border-borderColor block transition-all duration-300 btn-press">
                <img src="${item.imageSrc}" alt="${item.title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/10 transition-opacity"></div>
                <div class="absolute bottom-6 left-6 bg-white dark:bg-gray-800 px-5 py-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
                    <span class="text-black dark:text-white font-bold text-xl leading-tight mb-0.5">${item.title}</span>
                    <span class="text-primary font-bold text-sm">${count} prendas</span>
                </div>
            </a>
        `;
    })
    .join("");

  container.innerHTML = `
        <div class="text-center mb-12 pt-8">
            <h2 class="text-4xl font-serif text-textMain mb-4">${data.title}</h2>
            <p class="text-textMuted max-w-2xl mx-auto">${data.subtitle}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${itemsHTML}
        </div>
    `;
}

// ==========================================
// 14. LISTENER PRINCIPAL
// ==========================================
document.addEventListener("DOMContentLoaded", initApp);
