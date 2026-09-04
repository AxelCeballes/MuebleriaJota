document.addEventListener("DOMContentLoaded", () => {
  actualizarCarrito();
  cargarContenido();
  configurarFormulario();
});

const formatoPrecio = (precio) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(precio);

function cargarProductos(simularFallo = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simularFallo) {
        reject(new Error("No se pudo conectar con el catálogo de Hermanos Jota. Intente nuevamente más tarde."));
      } else {
        resolve([...productos]);
      }
    }, 400);
  });
}

async function cargarContenido() {
  const grid = document.querySelector("#product-grid");
  const destacados = document.querySelector("#featured-products");
  const detalle = document.querySelector("#product-detail");

  const mensajeCarga = '<p class="catalog-status catalog-loading" aria-live="polite">Cargando catálogo...</p>';
  if (grid) grid.innerHTML = mensajeCarga;
  if (destacados) destacados.innerHTML = mensajeCarga;
  if (detalle) detalle.innerHTML = '<p class="catalog-status catalog-loading" aria-live="polite">Cargando producto...</p>';

  try {
    const listaProductos = await cargarProductos();

    if (grid) renderProductos(listaProductos, grid);
    if (destacados) renderProductos(listaProductos.filter((producto) => producto.destacado), destacados);
    if (detalle) renderDetalle(listaProductos, detalle);
  } catch (error) {
    console.error("Error al cargar productos:", error);
    const mensajeError = `
      <div class="catalog-status catalog-error" role="alert">
        <p>${error.message || "Ocurrió un error al cargar el catálogo."}</p>
        <button class="btn btn-small" id="btn-retry">Reintentar</button>
      </div>
    `;

    if (grid) {
      grid.innerHTML = mensajeError;
      grid.querySelector("#btn-retry")?.addEventListener("click", () => cargarContenido());
    }
    if (destacados) {
      destacados.innerHTML = mensajeError;
      destacados.querySelector("#btn-retry")?.addEventListener("click", () => cargarContenido());
    }
    if (detalle) {
      detalle.innerHTML = mensajeError;
      detalle.querySelector("#btn-retry")?.addEventListener("click", () => cargarContenido());
    }
  }
}

function renderProductos(lista, contenedor) {
  if (!lista.length) {
    contenedor.innerHTML = "<p>No encontramos productos.</p>";
    return;
  }

  contenedor.innerHTML = lista.map((producto) => `
    <article class="product-card">
      <a href="producto.html?id=${producto.id}">
        <div class="product-image">
          <img src="${producto.imagen}" alt="${producto.nombre}">
        </div>
        <div class="product-info">
          <p class="category">${producto.categoria}</p>
          <h3>${producto.nombre}</h3>
          <p class="price">${formatoPrecio(producto.precio)}</p>
        </div>
      </a>
      <button class="btn btn-small" data-id="${producto.id}">AÑADIR</button>
    </article>
  `).join("");

  contenedor.querySelectorAll("[data-id]").forEach((boton) => {
    boton.addEventListener("click", () => agregarAlCarrito(Number(boton.dataset.id)));
  });

  const buscador = document.querySelector("#search");
  if (buscador && !buscador.dataset.ready) {
    buscador.dataset.ready = "true";
    buscador.addEventListener("input", (evento) => {
      const termino = evento.target.value.toLowerCase().trim();
      const filtrados = lista.filter((producto) =>
        `${producto.nombre} ${producto.categoria} ${producto.descripcion}`
          .toLowerCase()
          .includes(termino)
      );
      renderProductos(filtrados, contenedor);
    });
  }
}

function renderDetalle(lista, contenedor) {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const producto = lista.find((item) => item.id === id);

  if (!producto) {
    contenedor.innerHTML = "<h1>Producto no encontrado</h1><a class='text-link' href='productos.html'>Volver al catálogo →</a>";
    return;
  }

  contenedor.innerHTML = `
    <div class="detail-image">
      <img src="${producto.imagen}" alt="${producto.nombre}">
    </div>
    <div class="detail-content">
      <p class="eyebrow">${producto.categoria}</p>
      <h1>${producto.nombre}</h1>
      <p class="detail-price">${formatoPrecio(producto.precio)}</p>
      <p>${producto.descripcion}</p>
      <h3>Materiales y fabricación</h3>
      <p>${producto.materiales}</p>
      <button id="add-detail" class="btn">AÑADIR AL CARRITO</button>
      <p id="detail-message" class="form-message" aria-live="polite"></p>
    </div>
  `;

  document.querySelector("#add-detail").addEventListener("click", () => {
    agregarAlCarrito(producto.id);
    document.querySelector("#detail-message").textContent = "Producto añadido al carrito.";
  });
}

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carritoHermanosJota")) || [];
}

function agregarAlCarrito(id) {
  const carrito = obtenerCarrito();
  carrito.push(id);
  localStorage.setItem("carritoHermanosJota", JSON.stringify(carrito));
  actualizarCarrito();
}

function actualizarCarrito() {
  const contador = document.querySelector("#cart-count");
  if (contador) contador.textContent = obtenerCarrito().length;
}

function configurarFormulario() {
  const formulario = document.querySelector("#contact-form");
  const mensaje = document.querySelector("#form-message");

  if (!formulario) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    mensaje.textContent = "¡Gracias! Recibimos tu mensaje. Te contactaremos pronto.";
    formulario.reset();
  });
}
