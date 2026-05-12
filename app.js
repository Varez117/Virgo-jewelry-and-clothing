/* =====================================================================
   APP.JS - MOTOR PRINCIPAL DE LA TIENDA
   Este archivo es el "cerebro" de tu página web. Aquí conectamos los 
   datos (data.json) con la parte visual (HTML/CSS). Maneja clics, 
   animaciones, el carrito de compras, los filtros y la conexión a WhatsApp.
===================================================================== */

// ==========================================
// 1. VARIABLES DE ESTADO GLOBAL
// Estas variables "recuerdan" información importante mientras el usuario navega.
// ==========================================

// Define si la página está en modo claro ('light') o modo oscuro ('dark').
let currentTheme = "light";

// Aquí guardaremos TODO el contenido del archivo 'data.json' una vez que lo descarguemos.
// Empieza en 'null' porque al cargar la página aún no tenemos los datos.
let globalData = null;

// ==========================================
// 2. CONFIGURACIÓN DEL CATÁLOGO DE PRODUCTOS
// Variables exclusivas para manejar la sección de ropa y filtros.
// ==========================================

// Arreglo que guardará TODOS los productos de la tienda sin ningún filtro aplicado.
let allProducts = [];

// Arreglo que guardará los productos que el usuario está buscando o filtrando en ese momento.
let filteredProducts = [];

// Controla cuántos productos se muestran al principio en la pantalla antes de darle a "Ver más".
let itemsPerPage = 12;

// Controla cuántos productos son visibles actualmente en la cuadrícula (va aumentando de 12 en 12).
let visibleItems = itemsPerPage;

// Guarda la categoría que está seleccionada ("Todos", "Pantalones", "Playeras", etc.).
let currentCategory = "Todos";

// Guarda cómo están ordenados los productos ("Recomendados", "Mayor Precio", "Menor Precio").
let currentSort = "Recomendados";

// Guarda lo que el usuario escribe en la barra de búsqueda (ej. "Blusa roja").
let currentSearch = "";

// ==========================================
// 3. VARIABLES DE INTERFAZ Y CARRITO
// Variables que controlan ventanas emergentes y compras.
// ==========================================

// Booleano (true/false) que dice si el menú de navegación en celulares está abierto o cerrado.
let isMobileMenuOpen = false;

// CARGA DEL CARRITO: Intenta buscar un carrito guardado en el navegador (localStorage) llamado "virgoCart".
// Si lo encuentra, lo convierte a un objeto de JavaScript (JSON.parse).
// Si no encuentra nada (es la primera vez del usuario), crea un arreglo vacío '[]'.
let cart = JSON.parse(localStorage.getItem("virgoCart")) || [];

// Booleano que dice si la ventana lateral del carrito está desplegada o no.
let isCartOpen = false;

// Objeto temporal que guarda la información de la prenda que el usuario está viendo en el modal,
// esperando a que seleccione talla y color antes de añadirla al carrito.
let selectedProductToCart = { id: null, talla: null, color: null };

// ==========================================
// 4. ICONOS SVG (Rendimiento Seguro)
// Guardamos los iconos como código de texto en lugar de imágenes externas.
// Esto hace que la página cargue muchísimo más rápido y no dependa de servidores externos.
// ==========================================
const iconsSVG = {
  // Icono del sol (para modo claro)
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
  // Icono de la luna (para modo oscuro)
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`,
  // Icono de la bolsita de compras
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
  // Icono del bote de basura para eliminar prendas del carrito
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
  // Icono grande para cuando el carrito está vacío
  emptyCart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-16 h-16 mb-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0zM12 9L15 6M15 6L18 9M15 6V14" /></svg>`,
};

// ==========================================
// 5. INICIALIZACIÓN DE LA APLICACIÓN (EL MOTOR DE ARRANQUE)
// ==========================================
// Esta función es 'async' (asíncrona) porque tiene que esperar a que el archivo data.json
// se descargue antes de poder construir la página.
async function initApp() {
  try {
    // 1. Petición para traer los datos.
    const response = await fetch("data.json");

    // Si hay un error (ej. archivo borrado), tira una alerta invisible para los desarrolladores.
    if (!response.ok) throw new Error("No se pudo cargar el JSON");

    // 2. Convierte el texto del archivo en un objeto real de JavaScript.
    globalData = await response.json();

    // 3. Guarda todas las prendas encontradas en la variable global.
    allProducts = globalData.productsSection.items;

    // 4. LECTURA DE LA URL:
    // ¿El usuario entró usando un enlace especial como "catalogo.html?category=Pantalones"?
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");
    // Si existe ese parámetro en la URL, aplicamos ese filtro automáticamente.
    if (categoryParam) currentCategory = categoryParam;

    // 5. Aplicar configuraciones visuales base
    applyFiltersAndSort(true); // Ordena y filtra las prendas inicialmente
    applyThemeVariables(currentTheme); // Aplica los colores claros
    renderNavbar(globalData.navbar); // Construye la barra de navegación de arriba
    renderCartUI(); // Construye el carrito de compras (aunque esté oculto)

    // 6. CONTROL DE HORARIOS:
    // Revisa si la tienda está abierta según el horario del data.json.
    // Si está cerrada, muestra un anuncio bloqueando la pantalla y detiene la carga visual (return).
    if (!checkStoreStatus(globalData.scheduleSection.hoursLogic)) {
      renderClosedModal(globalData.scheduleSection.closedModalData);
      return;
    }

    // 7. RENDERIZADO DE COMPONENTES:
    // Como app.js se usa tanto en index.html como en catalogo.html, revisamos qué "cajas" (divs)
    // existen en la página actual. Si la caja existe, la llenamos con datos.

    // ¿Existe la caja del Hero (El banner principal de inicio)? Píntalo.
    if (document.getElementById("hero-container")) renderHero(globalData.hero);

    // ¿Existe la caja del Carrusel? Píntalo.
    if (document.getElementById("carousel-container")) renderCarousel();

    // ¿Existe la caja de Categorías Destacadas? Píntalo.
    if (document.getElementById("categories-container"))
      renderCategories(globalData.categoriesSection);

    // ¿Existe la caja del Catálogo Completo (en catalogo.html)? Píntalo.
    if (document.getElementById("products-container"))
      renderProductsSection(globalData.productsSection);

    // 8. Activa las animaciones que ocurren cuando el usuario hace scroll hacia abajo.
    initScrollFeatures();

    // 9. CORRECCIÓN DE REDIRECCIÓN A SECCIONES (#hash)
    // Si el usuario da clic en "Novedades" desde el catálogo, la URL se vuelve "index.html#carousel-container".
    // Esto verifica si la URL tiene un símbolo # (hash).
    if (window.location.hash) {
      // Espera 400 milisegundos. ¿Por qué? Para darle tiempo a la página de pintar
      // todas las imágenes y cajas. Si bajamos de inmediato, la página aún mediría 0 pixeles de alto.
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        // Si encuentra la sección (ej. #carousel-container), hace scroll suave hacia ella.
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
  // Busca todos los elementos HTML que tengan la clase ".reveal"
  const reveals = document.querySelectorAll(".reveal");

  // IntersectionObserver es una herramienta de JS que nos avisa cuando un elemento
  // entra al campo de visión del usuario (cuando aparece en la pantalla).
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Si el elemento es visible en un 10% (threshold: 0.1), le agrega la clase 'active'.
        // En CSS, la clase 'active' hace que el elemento aparezca flotando suavemente.
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    },
    { threshold: 0.1 },
  );

  // Le decimos al observador que vigile a cada uno de los elementos ".reveal"
  reveals.forEach((reveal) => observer.observe(reveal));

  // Escuchamos el evento de scroll en toda la ventana
  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar-container");
    const backToTop = document.getElementById("btn-back-to-top");

    // Si el usuario bajó más de 10 pixeles desde arriba...
    if (window.scrollY > 10) {
      // Le ponemos una sombra a la navbar para que parezca que flota
      if (navbar) navbar.classList.add("shadow-md");
      // Hacemos aparecer el botón flotante de "Regresar arriba"
      if (backToTop) {
        backToTop.classList.remove("opacity-0", "pointer-events-none");
        backToTop.classList.add("opacity-100");
      }
    } else {
      // Si el usuario está hasta arriba (menos de 10px), quitamos la sombra y ocultamos el botón.
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

// Función que calcula si la tienda está abierta basándose en el reloj del usuario
function checkStoreStatus(hoursLogic) {
  const now = new Date(); // Obtenemos fecha y hora actuales
  // now.getDay() devuelve un número: 0 es Domingo, 1 es Lunes, etc.
  const todayRules = hoursLogic[now.getDay().toString()];

  // Si en el JSON dice que hoy está cerrado todo el día, devuelve falso.
  if (todayRules.closed) return false;

  // Compara la hora actual (ej. 14 para las 2PM) con las horas de apertura y cierre del JSON.
  const hour = now.getHours();
  return hour >= todayRules.open && hour < todayRules.close;
}

// Guarda el carrito actual en la memoria del navegador para que no se borre si el usuario recarga la página.
function updateCartStorage() {
  localStorage.setItem("virgoCart", JSON.stringify(cart));
  renderNavbar(globalData.navbar); // Actualiza la navbar para cambiar el numerito rojo del carrito
  renderCartUI(); // Re-dibuja el interior del carrito para mostrar los cambios
}

// Agrega un nuevo producto al arreglo del carrito
function addToCart(product, talla, color) {
  // Busca si ese producto EXACTO (mismo ID, misma talla, mismo color) ya está en el carrito.
  const existingIndex = cart.findIndex(
    (item) =>
      item.id === product.id && item.talla === talla && item.color === color,
  );

  // Si ya existe (existingIndex es mayor a -1), solo le suma 1 a la cantidad.
  if (existingIndex > -1) {
    cart[existingIndex].cantidad += 1;
  } else {
    // Si no existe, mete el objeto entero del producto al arreglo, y le añade talla, color y cantidad=1.
    cart.push({ ...product, talla, color, cantidad: 1 });
  }

  // Actualiza memoria, cierra la ventana del producto y abre automáticamente la del carrito.
  updateCartStorage();
  closeProductModal();
  toggleCart(true);
}

// Elimina un producto entero del carrito, sin importar la cantidad
function removeFromCart(index) {
  cart.splice(index, 1); // Quita 1 elemento del arreglo en la posición 'index'
  updateCartStorage();
}

// Sube o baja la cantidad de un producto (los botones + y -)
function updateQuantity(index, delta) {
  cart[index].cantidad += delta; // delta será 1 o -1
  // Si el usuario bajó la cantidad a 0 o menos, elimina el producto del carrito.
  if (cart[index].cantidad <= 0) removeFromCart(index);
  else updateCartStorage(); // Si no, solo guarda los cambios.
}

// Toma todo lo del carrito, lo vuelve texto y te manda a WhatsApp
function sendOrderToWhatsApp() {
  // Previene clics si no hay nada en el carrito
  if (cart.length === 0) return;

  const phone = globalData.config.store.whatsapp; // Saca el número del data.json

  // Construye el mensaje inicial
  let message = "Hola *Virgo*, me gustaría realizar el siguiente pedido:\n\n";
  let total = 0;

  // Recorre cada producto del carrito y lo agrega al mensaje
  cart.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal; // Va sumando el total global
    message += `*${index + 1}. ${item.nombre}*\n`;
    message += `   - Talla: ${item.talla}\n`;
    message += `   - Color: ${item.color}\n`;
    message += `   - Cantidad: ${item.cantidad}\n`;
    message += `   - Subtotal: $${subtotal.toFixed(2)}\n\n`; // toFixed(2) asegura que haya 2 decimales (ej. $250.00)
  });

  message += `*Total del pedido: $${total.toFixed(2)}*\n\n`;
  message += "Quedo atento/a a las instrucciones de pago y envío. ¡Gracias!";

  // Genera el enlace especial de WhatsApp (encodeURIComponent transforma los espacios y saltos de línea a código web)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  // Abre una nueva pestaña hacia WhatsApp
  window.open(url, "_blank");

  // Vacía el carrito del usuario, ya que "teóricamente" ya lo compró, y cierra la ventana.
  cart = [];
  updateCartStorage();
  toggleCart(false);
}

// ==========================================
// 8. MODALES INFORMATIVOS (VENTANAS EMERGENTES)
// ==========================================

// Abre las ventanas de "¿Quiénes somos?", "Ubicación" y "Horario"
function openInfoModal(type) {
  const container = document.getElementById("info-modal-container");

  // Bloquea el scroll del fondo (para que el usuario no baje la página mientras lee la ventana)
  document.body.style.overflow = "hidden";
  let contentHTML = "";

  // Genera el contenido dependiendo de qué botón tocó el usuario. Toda la info viene de 'globalData'.
  if (type === "about") {
    const data = globalData.aboutSection;
    contentHTML = `<div class="text-center"><h2 class="text-4xl font-serif text-textMain mb-6">${data.title}</h2><p class="text-textMuted text-lg leading-relaxed">${data.content}</p></div>`;
  } else if (type === "location") {
    const data = globalData.locationSection;
    contentHTML = `<h2 class="text-3xl font-serif text-textMain mb-2 flex items-center gap-2"><span class="text-primary text-2xl">📍</span> ${data.title}</h2><p class="text-textMuted mb-6">${data.address}</p><div class="w-full h-[300px] bg-cardBg border border-borderColor rounded-3xl overflow-hidden relative shadow-inner"><iframe src="${data.mapEmbedUrl}" width="100%" height="100%" style="border:0; filter: ${currentTheme === "dark" ? "invert(90%) hue-rotate(180deg)" : "none"};" allowfullscreen="" loading="lazy" class="absolute inset-0"></iframe></div>`;
  } else if (type === "schedule") {
    const data = globalData.scheduleSection;
    // Mapea los días y horas para crear las filas
    const daysHTML = data.days
      .map(
        (d) =>
          `<div class="flex justify-between py-4 border-b border-borderColor last:border-0"><span class="font-medium text-textMain">${d.day}</span><span class="text-textMuted">${d.hours}</span></div>`,
      )
      .join("");
    contentHTML = `<h2 class="text-3xl font-serif text-textMain mb-6 flex items-center gap-2"><span class="text-primary text-2xl">🕒</span> ${data.title}</h2><div class="flex flex-col">${daysHTML}</div><div class="mt-8 p-4 bg-bgLight rounded-2xl border border-borderColor text-center"><p class="text-sm text-primary font-bold italic">${data.note}</p></div>`;
  }

  // Inyecta el HTML final dentro del contenedor
  container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeInfoModal()"></div>
            <div class="relative bg-cardBg w-full max-w-2xl rounded-3xl p-8 md:p-12 shadow-2xl transition-colors duration-300 max-h-[90vh] overflow-y-auto hide-scrollbar">
                <button onclick="closeInfoModal()" class="absolute top-4 right-4 z-10 w-8 h-8 bg-bgLight rounded-full flex items-center justify-center text-textMain hover:text-primary shadow-md border border-borderColor">×</button>
                ${contentHTML}
                <div class="mt-10 pt-6 border-t border-borderColor flex justify-center md:justify-end">
                    <button onclick="closeInfoModal()" class="px-6 py-2 rounded-full border border-borderColor text-textMuted hover:text-textMain hover:bg-borderColor transition-colors w-full md:w-auto font-medium">Cerrar Ventana</button>
                </div>
            </div>
        </div>
    `;

  // Cierra el menú móvil por si el usuario abrió esto desde un celular.
  isMobileMenuOpen = false;
  renderNavbar(globalData.navbar);
}

// Vacía el contenedor del modal y devuelve el scroll al cuerpo de la página
function closeInfoModal() {
  document.getElementById("info-modal-container").innerHTML = "";
  document.body.style.overflow = "auto";
}

// ==========================================
// 9. FUNCIONES DE BARRA DE NAVEGACIÓN Y MENÚ MÓVIL
// ==========================================

// Alterna (abre/cierra) el menú desplegable en celulares
function toggleMobileMenu() {
  isMobileMenuOpen = !isMobileMenuOpen; // Si era true, pasa a false. Y viceversa.
  renderNavbar(globalData.navbar); // Vuelve a pintar la navbar para mostrar/ocultar el menú
}

// NUEVO: Función obligatoria para que el menú de celular se esconda al dar clic en un enlace.
// Resuelve el problema donde la pantalla se quedaba atascada al presionar "Novedades".
function handleNavClick() {
  if (isMobileMenuOpen) {
    isMobileMenuOpen = false;
    renderNavbar(globalData.navbar);
  }
}

// Abre o cierra la ventana lateral del carrito de compras
function toggleCart(forceOpen = null) {
  // Si forceOpen tiene un valor, usa ese valor (ej. true para obligar a abrir). Si no, lo alterna.
  isCartOpen = forceOpen !== null ? forceOpen : !isCartOpen;
  renderCartUI();
}

// Dibuja la barra de arriba con el logo, enlaces, botón oscuro y carrito
function renderNavbar(data) {
  const container = document.getElementById("navbar-container");

  // Cuenta cuántos artículos hay en total (sumando la 'cantidad' de cada objeto del arreglo)
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // Elige el icono de sol o luna dependiendo del tema activo
  const themeIcon = currentTheme === "light" ? iconsSVG.moon : iconsSVG.sun;

  // Construye todos los enlaces <a> iterando sobre el JSON
  // IMPORTANTE: Aquí se le inyectó onclick="handleNavClick()" a cada enlace para corregir los móviles.
  const linksHTML = data.links
    .map(
      (link) =>
        `<a href="${link.href}" onclick="handleNavClick()" class="block md:inline-block py-2 text-textMuted hover:text-primary transform hover:-translate-y-1 transition-all duration-300 text-base md:text-sm font-medium">${link.label}</a>`,
    )
    .join("");

  // Inyecta el HTML de la Navbar
  container.innerHTML = `
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center w-full">
                <a href="index.html" class="flex items-center gap-2">
                    <img src="${data.logo.iconSrc}" alt="Icono" class="w-8 h-8 md:w-10 md:h-10">
                    <span class="text-3xl md:text-4xl font-serif font-bold text-primary italic">${data.logo.text}</span>
                </a>
                
                <nav class="hidden md:flex gap-6 items-center">${linksHTML}</nav>
                
                <div class="flex items-center gap-3 text-textMain">
                    <button onclick="toggleTheme()" class="p-2 rounded-full hover:bg-cardBg transition-colors border border-transparent text-textMain flex items-center justify-center">
                        ${themeIcon}
                    </button>
                    <button onclick="toggleCart()" class="relative p-2 rounded-full hover:bg-cardBg transition-colors border border-transparent text-textMain flex items-center justify-center">
                        ${iconsSVG.cart}
                        ${totalItems > 0 ? `<span class="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">${totalItems}</span>` : ""}
                    </button>
                    
                    <button onclick="toggleMobileMenu()" class="md:hidden flex items-center gap-1 text-sm font-medium text-textMuted hover:text-primary border border-borderColor px-3 py-1.5 rounded-full">
                        Menú <span class="text-xs">▼</span>
                    </button>
                </div>
            </div>
            
            <div class="${isMobileMenuOpen ? "block" : "hidden"} md:hidden pt-4 pb-2 border-t border-borderColor mt-4 animate-fade-in">
                ${linksHTML}
            </div>
        </div>
    `;
}

// Dibuja la ventana lateral de "Tu Carrito"
function renderCartUI() {
  const container = document.getElementById("cart-container");
  if (!container) return;

  // Si no debe estar abierto, vacía la caja y restaura el scroll de la página.
  if (!isCartOpen) {
    container.innerHTML = "";
    document.body.style.overflow = "auto";
    return;
  }

  // Si está abierto, bloquea el scroll de la página trasera.
  document.body.style.overflow = "hidden";

  // Suma total en dinero
  const total = cart.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );

  // Genera el HTML de las prendas, o un mensaje vacío si no hay nada.
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
                            <button onclick="updateQuantity(${index}, -1)" class="px-2 py-1 hover:bg-borderColor text-textMain">-</button>
                            <span class="px-2 text-sm font-medium text-textMain">${item.cantidad}</span>
                            <button onclick="updateQuantity(${index}, 1)" class="px-2 py-1 hover:bg-borderColor text-textMain">+</button>
                        </div>
                        <span class="font-bold text-textMain">$${(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="absolute top-4 right-4 text-textMuted hover:text-red-500 transition-colors">
                    ${iconsSVG.trash}
                </button>
            </div>
        `,
          )
          .join("");

  // Inyecta el carrito lateral HTML
  container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex justify-end animate-fade-in">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="toggleCart(false)"></div>
            <div class="relative w-full max-w-md bg-cardBg h-full flex flex-col shadow-2xl transition-transform transform translate-x-0">
                <div class="flex justify-between items-center p-6 border-b border-borderColor bg-bgLight">
                    <h2 class="text-xl font-serif font-bold text-textMain">Tu Carrito</h2>
                    <button onclick="toggleCart(false)" class="text-textMuted hover:text-primary text-2xl leading-none">×</button>
                </div>
                <div class="flex-grow overflow-y-auto hide-scrollbar">
                    ${cartItemsHTML}
                </div>
                <div class="p-6 border-t border-borderColor bg-bgLight">
                    <div class="flex justify-between mb-4 text-lg font-bold text-textMain">
                        <span>Total</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    <button ${cart.length === 0 ? "disabled" : ""} onclick="sendOrderToWhatsApp()" class="btn-primary w-full py-3 text-lg">
                        Continuar con el pedido
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 10. LÓGICA DEL CARRUSEL DE NOVEDADES
// Animación matemática compleja para deslizar suavemente.
// ==========================================

// window.moveCarousel expone esta función al mundo global para poder ser llamada desde los botones en HTML
window.moveCarousel = function (direction) {
  const track = document.getElementById("slider-track");

  // "Semáforo" de seguridad: Si ya se está moviendo, ignora el nuevo clic hasta que termine.
  if (!track || track.dataset.animating === "true") return;
  track.dataset.animating = "true"; // Encendemos el semáforo

  const card = track.querySelector(".carousel-item");
  if (!card) return;

  // Calculamos la distancia exacta que debemos mover. Ancho de la tarjeta + 24 pixeles de espacio de separación.
  const step = card.offsetWidth + 24;
  const start = track.scrollLeft; // Posición actual
  const end = start + step * direction; // Posición destino (+1 mueve a la derecha, -1 a la izquierda)

  // Duración de la animación en milisegundos (600ms hace que se vea premium y muy suave)
  const duration = 600;
  const startTime = performance.now(); // Reloj interno del navegador

  // Función recursiva que el navegador dibuja a 60 cuadros por segundo
  function animate(currentTime) {
    const elapsed = currentTime - startTime; // Tiempo transcurrido
    const progress = Math.min(elapsed / duration, 1); // Porcentaje de 0 a 1

    // Fórmula matemática Easing (easeOutQuart): Hace que empiece rápido y frene lento.
    const ease = 1 - Math.pow(1 - progress, 4);

    // Actualizamos el scroll real basándonos en la fórmula
    track.scrollLeft = start + (end - start) * ease;

    // Si aún no llega al 100% de la animación, pide al navegador otro frame.
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Magia del bucle infinito:
      // El HTML tiene tarjetas clonadas (4 veces el mismo grupo).
      // Cuando llega al final del grupo clonado, lo "teletransportamos" en silencio
      // al principio para que parezca que es infinito.
      const totalOriginal = allProducts.filter((p) => p.destacado).length;
      if (track.scrollLeft < step * 0.5) {
        track.scrollLeft += step * totalOriginal;
      } else if (track.scrollLeft > step * (totalOriginal * 2.5)) {
        track.scrollLeft -= step * totalOriginal;
      }

      // Apagamos el semáforo, el usuario puede dar otro clic.
      track.dataset.animating = "false";
    }
  }
  requestAnimationFrame(animate);
};

// Pinta y construye la sección visual del carrusel.
function renderCarousel() {
  const container = document.getElementById("carousel-container");

  // Filtra SOLO los productos que tienen 'destacado: true' en data.json
  const destacados = allProducts.filter((p) => p.destacado);

  // Si no hay ninguno destacado, borra el contenedor para no dejar un espacio en blanco.
  if (destacados.length === 0) {
    container.innerHTML = "";
    return;
  }

  // Genera el código HTML de CADA tarjeta del carrusel.
  // Nota de diseño responsivo (CSS de Tailwind):
  // w-[82vw] hace que mida el 82% de la pantalla en teléfonos.
  // md:w-[calc(50%-12px)] asegura 2 columnas en tabletas.
  // lg:w-[calc(25%-18px)] asegura 4 columnas exactas en computadora.
  const cardsHTML = destacados
    .map(
      (item) => `
        <div onclick="openProductModal(${item.id})" class="carousel-item flex-none w-[82vw] md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] group cursor-pointer bg-bgLight border border-borderColor rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div class="relative h-80 overflow-hidden bg-cardBg">
                <img src="${item.referencia_imagen}" alt="${item.nombre}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                <div class="absolute top-3 right-3 bg-white dark:bg-gray-800 text-textMain px-3 py-1 rounded-full text-xs font-bold border border-borderColor shadow-sm flex items-center gap-1">
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
    `,
    )
    .join("");

  // Inyecta todo al contenedor.
  // OJO AQUÍ: Pegamos el 'cardsHTML' cuatro veces seguidas para engañar al usuario y crear el efecto "infinito".
  container.innerHTML = `
        <div class="mb-10 flex flex-col items-center relative text-center">
            <div>
                <h2 class="text-4xl font-serif text-textMain mb-2">Novedades Exclusivas</h2>
                <p class="text-textMuted">Las últimas tendencias seleccionadas para ti.</p>
            </div>
            
            <div class="flex gap-4 justify-center w-full mt-6">
                <button onclick="moveCarousel(-1)" class="w-12 h-12 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-xl shadow-sm bg-bgLight">←</button>
                <button onclick="moveCarousel(1)" class="w-12 h-12 rounded-full border border-borderColor flex items-center justify-center text-textMain hover:bg-primary hover:text-white transition-colors text-xl shadow-sm bg-bgLight">→</button>
            </div>
        </div>
        
        <div id="slider-track" class="flex gap-6 overflow-x-hidden pb-8 w-full touch-pan-x">
            ${cardsHTML}${cardsHTML}${cardsHTML}${cardsHTML}
        </div>
    `;

  // Al cargarse, movemos el scroll invisiblemente a la SEGUNDA copia de los datos.
  // Así, si el usuario da clic en "izquierda", no choca con un muro negro, sino que hay tarjetas atrás.
  setTimeout(() => {
    const track = document.getElementById("slider-track");
    if (!track) return;
    const card = track.querySelector(".carousel-item");
    const step = card.offsetWidth + 24;
    const totalOriginal = destacados.length;
    track.scrollLeft = step * totalOriginal;
  }, 50);
}

// ==========================================
// 11. SISTEMA DEL CATÁLOGO COMPLETO (BÚSQUEDAS Y FILTROS)
// ==========================================

// Esta función es llamada desde los botones (Pantalones, Suéteres), la barra de texto o el select de ordenar.
function updateCatalogState(type, value) {
  if (type === "search") currentSearch = value; // Si escribió algo, guarda el texto.
  if (type === "filter") currentCategory = value; // Si dio clic a una categoría, la guarda.
  if (type === "sort") currentSort = value; // Si cambió de "Mayor precio", lo guarda.

  // Ejecuta la ordenación y dibujado de pantalla de acuerdo a los nuevos valores.
  applyFiltersAndSort();
}

// Lógica dura: Toma los 40 productos y los corta y ordena según lo que el usuario pidió.
function applyFiltersAndSort(isInit = false) {
  let result = [...allProducts]; // Copia fresca de todos los productos

  // 1. FILTRO DE TEXTO: ¿Escribió algo?
  if (currentSearch.trim() !== "") {
    const query = currentSearch.toLowerCase();
    // Deja pasar solo los productos que tengan en su nombre o descripción la palabra escrita.
    result = result.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion.toLowerCase().includes(query),
    );
  }

  // 2. FILTRO DE BOTONES: ¿Seleccionó algo distinto a "Todos"?
  if (currentCategory !== "Todos")
    result = result.filter((p) => p.categoria === currentCategory);

  // 3. ORDEN: ¿Acomodamos el precio?
  if (currentSort === "Menor Precio")
    result.sort((a, b) => a.precio - b.precio);
  else if (currentSort === "Mayor Precio")
    result.sort((a, b) => b.precio - a.precio);
  else result.sort((a, b) => a.id - b.id); // "Recomendados" es el orden normal por ID

  // Actualizamos nuestras variables maestras y reseteamos el límite visible a 12 de nuevo.
  filteredProducts = result;
  visibleItems = itemsPerPage;

  // Solo re-dibujamos si NO estamos en el inicio silencioso, y si estamos en la página del catálogo.
  if (!isInit && document.getElementById("catalog-grid")) renderProductGrid();
}

// El botón de "Ver más" simplemente aumenta el límite de 12 a 24, y vuelve a pintar.
function loadMoreItems() {
  visibleItems += itemsPerPage;
  renderProductGrid();
}

// Construye la caja visual del catálogo con sus botones de categoría, barra de búsqueda y selectores.
function renderProductsSection(data) {
  const container = document.getElementById("products-container");

  // Crea los botones ovalados de categorías basándose en el data.json
  const filtersHTML = data.filters
    .map((filter) => {
      // Si este es el botón activo (ej. "Blusas"), le pone una clase para resaltarlo en negro.
      const isActive =
        filter === currentCategory
          ? "filter-active"
          : "bg-cardBg text-textMuted border border-borderColor hover:border-primary";
      return `<button onclick="updateCatalogState('filter', '${filter}')" class="px-6 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${isActive}">${filter}</button>`;
    })
    .join("");

  // Inyecta toda la estructura. Abajo crea una caja vacía con ID "catalog-grid" que se llenará enseguida.
  container.innerHTML = `
        <div class="text-center mb-10 pt-4 transition-colors duration-300">
            <h2 class="text-4xl font-serif text-textMain mb-4">${data.title}</h2>
            <p class="text-textMuted max-w-2xl mx-auto mb-8">${data.subtitle}</p>
            <div class="max-w-md mx-auto mb-8 relative">
                <input type="text" placeholder="Buscar por nombre o detalle..." class="w-full bg-cardBg border border-borderColor text-textMain px-5 py-3 rounded-full outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" onkeyup="updateCatalogState('search', this.value)">
                <span class="absolute right-4 top-3 text-textMuted text-xl">⌕</span>
            </div>
            <div class="flex flex-wrap justify-center gap-3 mb-8" id="catalog-filters">${filtersHTML}</div>
            <div class="flex flex-col sm:flex-row justify-between items-center text-sm text-textMuted mb-6 px-2 gap-4">
                <span id="catalog-count">Cargando...</span>
                <select class="border border-borderColor bg-cardBg text-textMain px-4 py-2 rounded-lg font-medium cursor-pointer outline-none shadow-sm" onchange="updateCatalogState('sort', this.value)">
                    <option value="Recomendados">Recomendados</option>
                    <option value="Menor Precio">Menor Precio</option>
                    <option value="Mayor Precio">Mayor Precio</option>
                </select>
            </div>
        </div>
        <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        <div id="load-more-container" class="text-center mt-12 hidden">
            <button onclick="loadMoreItems()" class="bg-cardBg border border-borderColor text-textMain font-medium px-8 py-3 rounded-full hover:border-primary transition-colors shadow-sm">Ver Más Prendas ▾</button>
        </div>
    `;
  renderProductGrid(); // LLena el "catalog-grid"
}

// LLena la cuadrícula con las prendas filtradas.
function renderProductGrid() {
  const grid = document.getElementById("catalog-grid");
  const countDisplay = document.getElementById("catalog-count");
  const loadMoreContainer = document.getElementById("load-more-container");

  // Pequeña corrección visual en vivo para que los botones de filtros cambien de color
  // cuando uno nuevo se selecciona.
  const filtersContainer = document.getElementById("catalog-filters");
  if (filtersContainer) {
    const buttons = filtersContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
      if (btn.innerText === currentCategory)
        btn.className =
          "px-6 py-2 rounded-full text-sm font-medium transition-colors shadow-sm filter-active";
      else
        btn.className =
          "px-6 py-2 rounded-full text-sm font-medium transition-colors bg-cardBg text-textMuted border border-borderColor hover:border-primary shadow-sm";
    });
  }

  // Actualiza el texto de "Mostrando X productos"
  countDisplay.innerText = `Mostrando ${filteredProducts.length} productos`;

  // Si después del filtro no quedó nada (ej. buscó "Silla"), muestra un mensaje de error amigable.
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

  // "Corta" el arreglo usando slice. Si visibleItems es 12, solo muestra del 0 al 11.
  const itemsToShow = filteredProducts.slice(0, visibleItems);

  // Dibuja las tarjetas de los productos
  grid.innerHTML = itemsToShow
    .map(
      (item) => `
        <div onclick="openProductModal(${item.id})" class="group cursor-pointer bg-bgLight border border-borderColor rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col animate-fade-in">
            <div class="relative h-80 overflow-hidden bg-cardBg">
                <img src="${item.referencia_imagen}" alt="${item.nombre}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                <div class="absolute top-3 right-3 bg-white dark:bg-gray-800 text-textMain px-3 py-1 rounded-full text-xs font-bold border border-borderColor shadow-sm">
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
    `,
    )
    .join("");

  // Si los productos a mostrar son menores al total filtrado, mostramos el botón de "Ver más"
  if (visibleItems < filteredProducts.length)
    loadMoreContainer.classList.remove("hidden");
  else loadMoreContainer.classList.add("hidden"); // Si ya mostró todo, oculta el botón
}

// ==========================================
// 12. SISTEMA DE DETALLE DE PRODUCTO Y COMPRA
// ==========================================

// Al darle clic a una ropa en la tienda, esto abre su ficha completa.
function openProductModal(id) {
  // Busca toda la información de este ID en nuestra base de datos.
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  // Limpia selecciones pasadas del usuario. Obligándolo a elegir de nuevo.
  selectedProductToCart = { id: product.id, talla: null, color: null };
  const container = document.getElementById("product-modal-container");

  // Detiene el scroll trasero.
  document.body.style.overflow = "hidden";

  // Inyecta el modal súper visual que cubre la pantalla
  container.innerHTML = `
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeProductModal()"></div>
            <div class="relative bg-bgLight w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                <button onclick="closeProductModal()" class="absolute top-4 right-4 z-10 w-8 h-8 bg-bgLight rounded-full flex items-center justify-center text-textMain hover:text-primary shadow-md border border-borderColor">×</button>
                <div class="w-full md:w-1/2 h-64 md:h-auto bg-cardBg relative">
                    <img src="${product.referencia_imagen}" class="w-full h-full object-cover">
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
                            ${product.tallas.map((t) => `<button data-value="${t}" onclick="selectOption('talla', '${t}')" class="selector-btn px-4 py-2 rounded-md font-medium text-sm">${t}</button>`).join("")}
                        </div>
                    </div>

                    <div class="mb-8">
                        <div class="flex justify-between items-center mb-3">
                            <span class="font-bold text-textMain text-sm">Selecciona un Color:</span>
                            <span id="modal-error-color" class="text-red-500 text-xs hidden">Requerido</span>
                        </div>
                        <div class="flex flex-wrap gap-2" id="modal-colores">
                            ${product.colores.map((c) => `<button data-value="${c}" onclick="selectOption('color', '${c}')" class="selector-btn px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"><span class="w-3 h-3 rounded-full border border-gray-300 block" style="background-color: ${getColorHex(c)}"></span>${c}</button>`).join("")}
                        </div>
                    </div>

                    <div class="mt-auto pt-6">
                        <button onclick="attemptAddToCart(${product.id})" class="btn-primary w-full py-4 text-lg mb-3 shadow-md hover:shadow-lg">Añadir al Carrito</button>
                        <button onclick="closeProductModal()" class="w-full py-3 text-textMuted border border-borderColor rounded-full hover:bg-cardBg hover:text-textMain transition-colors font-medium">
                            Volver al Catálogo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Resalta en negro el botón (talla o color) que escogió el usuario.
function selectOption(type, value) {
  // Guarda el dato escogido temporalmente
  selectedProductToCart[type] = value;

  // Decide a qué div de botones debe ir a revisar
  const container = document.getElementById(
    type === "talla" ? "modal-tallas" : "modal-colores",
  );

  // Remueve la clase "selected" a todos los botones, y se la pone SOLO al que tiene el valor clickeado.
  const buttons = container.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (btn.dataset.value === value) btn.classList.add("selected");
    else btn.classList.remove("selected");
  });

  // Si eligió una opción, le escondemos el mensaje rojo de "Requerido"
  document.getElementById(`modal-error-${type}`).classList.add("hidden");
}

// Función que valida antes de meter al carrito real
function attemptAddToCart(productId) {
  const product = allProducts.find((p) => p.id === productId);
  let hasError = false;

  // Si olvidó la talla, enciende el texto rojo
  if (!selectedProductToCart.talla) {
    document.getElementById("modal-error-talla").classList.remove("hidden");
    hasError = true;
  }
  // Si olvidó el color, enciende el texto rojo
  if (!selectedProductToCart.color) {
    document.getElementById("modal-error-color").classList.remove("hidden");
    hasError = true;
  }

  // Si falta alguno de los dos, se rinde y no hace nada (return)
  if (hasError) return;

  // Si todo está correcto, invoca la función real pasándole los datos elegidos.
  addToCart(product, selectedProductToCart.talla, selectedProductToCart.color);
}

// Cierra el modal de la prenda y lo destruye.
function closeProductModal() {
  document.getElementById("product-modal-container").innerHTML = "";
  document.body.style.overflow = "auto";
}

// Es el "traductor" de colores. Si le pasas "Rosa Claro", te devuelve un código Hex (#fbcfe8).
// Esto se usa en los círculos de la tienda y del modal.
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
  return colors[colorName] || "#cccccc"; // Si no reconoce el nombre, devuelve gris por defecto
}

// ==========================================
// 13. TEMAS Y SECCIONES ESTATÍCAS DE LA HOME
// ==========================================

// Intercambia las "Variables CSS" en la raíz del documento.
// Cambiar el valor de --color-primary aquí se refleja instantáneamente en toda la tienda.
function applyThemeVariables(themeType) {
  if (!globalData) return;
  const root = document.documentElement;
  // Extraemos los colores del JSON según sea 'light' o 'dark'
  const themeData = globalData.config.theme[themeType];

  root.style.setProperty("--color-primary", themeData.primary);
  root.style.setProperty("--color-primary-hover", themeData.primaryHover);
  root.style.setProperty("--color-bg-light", themeData.bgLight);
  root.style.setProperty("--color-text-main", themeData.textMain);
  root.style.setProperty("--color-text-muted", themeData.textMuted);
  root.style.setProperty("--color-card-bg", themeData.cardBg);
  root.style.setProperty("--color-border", themeData.border);

  // Agrega o quita la clase "dark" en el HTML para activar utilidades oscuras de Tailwind.
  if (themeType === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

// Alternador. Cambia de claro a oscuro y vuelve a pintar elementos afectados.
function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  applyThemeVariables(currentTheme);
  renderNavbar(globalData.navbar);

  // Vuelve a pintar el Hero y Categorías por si tienen sombras o fondos especiales oscuros.
  if (document.getElementById("hero-container")) renderHero(globalData.hero);
  if (document.getElementById("categories-container"))
    renderCategories(globalData.categoriesSection);
}

// Pantalla de bloqueo: Si la tienda no está en horario de atención.
function renderClosedModal(data) {
  document.body.style.overflow = "hidden"; // Detiene al usuario
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
  document.body.appendChild(modal); // Lo pega a la fuerza en el HTML frontal.
}

// Pinta el gran anuncio principal (Hero) de la tienda.
function renderHero(data) {
  // Ajuste sutil de fondo según si estamos en modo claro o modo oscuro.
  const heroBg = currentTheme === "light" ? "bg-[#fff5f6]" : "bg-[#2e1019]";

  document.getElementById("hero-container").innerHTML = `
        <div class="w-full ${heroBg} transition-colors duration-300 py-16 md:py-24 border-b border-borderColor">
            <div class="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
                <div class="md:w-1/2 space-y-6 md:pl-20 lg:pl-32">
                    <h1 class="text-5xl md:text-7xl font-serif text-textMain leading-tight">${data.titleNormal} <br><span class="text-primary italic">${data.titleHighlight}</span></h1>
                    <p class="text-textMuted text-lg max-w-md">${data.description}</p>
                    <a href="catalogo.html" class="btn-primary btn-neon mt-4 inline-flex shadow-md">${data.buttonText} <span>${data.buttonIcon}</span></a>
                </div>
                <div class="md:w-1/2">
                    <img src="${data.imageSrc}" alt="Colección" class="w-full h-[400px] md:h-[500px] object-cover rounded-2xl shadow-2xl">
                </div>
            </div>
        </div>
    `;
}

// Pinta las imágenes cuadriculadas (Las cajas grandes de Blusas, Playeras, etc.)
function renderCategories(data) {
  const container = document.getElementById("categories-container");
  if (!container) return;

  // orderMap decide en qué orden aparecerán para forzar un diseño estético visualmente
  const orderMap = { Pantalones: 1, Playeras: 2, Blusas: 3, Suéteres: 4 };

  // classMap fuerza el tamaño en columnas. Pantalones ocupa 2 espacios, Playeras 1... etc.
  const classMap = {
    Pantalones: "md:col-span-2",
    Playeras: "md:col-span-1",
    Blusas: "md:col-span-1",
    Suéteres: "md:col-span-2",
  };

  // Reordena la lista del JSON usando las matemáticas del mapa de arriba.
  const sortedItems = [...data.items].sort(
    (a, b) => orderMap[a.title] - orderMap[b.title],
  );

  const itemsHTML = sortedItems
    .map((item) => {
      // Cuenta matemáticamente cuántas prendas del JSON coinciden con esta categoría
      const count = allProducts.filter(
        (p) => p.categoria === item.title,
      ).length;

      // Busca la clase para el tamaño, o le da tamaño pequeño por defecto.
      const gridClass = classMap[item.title] || "md:col-span-1";

      return `
            <a href="catalogo.html?category=${encodeURIComponent(item.title)}" class="${gridClass} relative h-64 md:h-80 rounded-2xl overflow-hidden hover-zoom cursor-pointer shadow-md border border-borderColor block transition-all duration-300">
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
// Esto es un candado de seguridad:
// Espera a que TODO el documento HTML termine de cargarse antes de intentar ejecutar 'initApp()'.
document.addEventListener("DOMContentLoaded", initApp);
