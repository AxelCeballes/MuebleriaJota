document.addEventListener("DOMContentLoaded", () => {
  actualizarCarrito();
  cargarContenido();
  configurarFormulario();
  configurarCarrito();
});

const formatoPrecio = (precio) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(precio);

function cargarContenido() {
  const grid = document.querySelector("#product-grid");
  const destacados = document.querySelector("#featured-products");
  const detalle = document.querySelector("#product-detail");
  const carritoContenedor = document.querySelector("#cart-items");

  if (grid) {
    renderProductos(productos, grid);
    configurarBusqueda(grid);
  }
  if (destacados) renderProductos(seleccionarDestacados(productos), destacados);
  if (detalle) renderDetalle(productos, detalle);
  if (carritoContenedor) renderCarrito();
}

function seleccionarDestacados(lista, cantidad = 4) {
  return [...lista]
    .sort(() => Math.random() - 0.5)
    .slice(0, cantidad);
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

}

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function configurarBusqueda(contenedor) {
  const buscador = document.querySelector("#search");
  if (!buscador || buscador.dataset.ready) return;

  buscador.dataset.ready = "true";
  buscador.addEventListener("input", (evento) => {
    const termino = normalizarTexto(evento.target.value.trim());
    const filtrados = productos.filter((producto) =>
      normalizarTexto(`${producto.nombre} ${producto.categoria} ${producto.descripcion}`)
        .includes(termino)
    );

    renderProductos(filtrados, contenedor);
  });
}

function renderDetalle(lista, contenedor) {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const producto = lista.find((item) => item.id === id);

  if (!producto) {
    contenedor.innerHTML = "<h1>Producto no encontrado</h1><a class='text-link' href='productos.html'>Volver al catálogo →</a>";
    return;
  }

  const especificacionesHTML = producto.especificaciones
    ? `
      <dl class="specs-table">
        ${producto.especificaciones.map((especificacion) => `
          <div class="specs-row">
            <dt>${especificacion.label}</dt>
            <dd>${especificacion.value}</dd>
          </div>
        `).join("")}
      </dl>
    `
    : `
      <h3>Materiales y fabricación</h3>
      <p>${producto.materiales}</p>
    `;

  contenedor.innerHTML = `
    <div class="detail-image">
      <img src="${producto.imagen}" alt="${producto.nombre}">
    </div>
    <div class="detail-content">
      <p class="eyebrow">${producto.categoria}</p>
      <h1>${producto.nombre}</h1>
      <p class="detail-price">${formatoPrecio(producto.precio)}</p>
      <p class="detail-description">${producto.descripcion}</p>
      ${especificacionesHTML}
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

function quitarUnidadDelCarrito(id) {
  const carrito = obtenerCarrito();
  const indice = carrito.indexOf(id);
  if (indice !== -1) carrito.splice(indice, 1);
  localStorage.setItem("carritoHermanosJota", JSON.stringify(carrito));
  actualizarCarrito();
}

function eliminarProductoDelCarrito(id) {
  const carrito = obtenerCarrito().filter((item) => item !== id);
  localStorage.setItem("carritoHermanosJota", JSON.stringify(carrito));
  actualizarCarrito();
}

function vaciarCarrito() {
  localStorage.setItem("carritoHermanosJota", JSON.stringify([]));
  actualizarCarrito();
  renderCarrito();
}

function renderCarrito() {
  const contenedor = document.querySelector("#cart-items");
  if (!contenedor) return;

  const totalEl = document.querySelector("#cart-total");
  const countEl = document.querySelector("#cart-summary-count");
  const vaciarBtn = document.querySelector("#cart-clear");
  const carrito = obtenerCarrito();

  if (!carrito.length) {
    contenedor.innerHTML = `
      <div class="cart-empty">
        <p>Tu carrito está vacío.</p>
        <a class="text-link" href="productos.html">Ver catálogo →</a>
      </div>
    `;
    if (totalEl) totalEl.textContent = formatoPrecio(0);
    if (countEl) countEl.textContent = "0";
    if (vaciarBtn) vaciarBtn.disabled = true;
    return;
  }

  const cantidades = carrito.reduce((acumulado, id) => {
    acumulado[id] = (acumulado[id] || 0) + 1;
    return acumulado;
  }, {});

  const items = Object.keys(cantidades)
    .map((idString) => {
      const id = Number(idString);
      return { producto: productos.find((item) => item.id === id), cantidad: cantidades[id] };
    })
    .filter((item) => item.producto);

  contenedor.innerHTML = items.map(({ producto, cantidad }) => `
    <article class="cart-item" data-id="${producto.id}">
      <div class="cart-item-image">
        <img src="${producto.imagen}" alt="${producto.nombre}">
      </div>
      <div class="cart-item-info">
        <p class="category">${producto.categoria}</p>
        <h3>${producto.nombre}</h3>
        <p class="price">${formatoPrecio(producto.precio)}</p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-action="restar" data-id="${producto.id}" aria-label="Quitar una unidad de ${producto.nombre}">−</button>
        <span>${cantidad}</span>
        <button class="qty-btn" data-action="sumar" data-id="${producto.id}" aria-label="Agregar una unidad de ${producto.nombre}">+</button>
      </div>
      <p class="cart-item-subtotal">${formatoPrecio(producto.precio * cantidad)}</p>
      <button class="cart-item-remove" data-id="${producto.id}" aria-label="Eliminar ${producto.nombre} del carrito">Eliminar</button>
    </article>
  `).join("");

  const total = items.reduce((suma, { producto, cantidad }) => suma + producto.precio * cantidad, 0);

  if (totalEl) totalEl.textContent = formatoPrecio(total);
  if (countEl) countEl.textContent = carrito.length;
  if (vaciarBtn) vaciarBtn.disabled = false;

  contenedor.querySelectorAll("[data-action='sumar']").forEach((boton) => {
    boton.addEventListener("click", () => {
      agregarAlCarrito(Number(boton.dataset.id));
      renderCarrito();
    });
  });

  contenedor.querySelectorAll("[data-action='restar']").forEach((boton) => {
    boton.addEventListener("click", () => {
      quitarUnidadDelCarrito(Number(boton.dataset.id));
      renderCarrito();
    });
  });

  contenedor.querySelectorAll(".cart-item-remove").forEach((boton) => {
    boton.addEventListener("click", () => {
      eliminarProductoDelCarrito(Number(boton.dataset.id));
      renderCarrito();
    });
  });
}

function configurarCarrito() {
  const vaciarBtn = document.querySelector("#cart-clear");
  if (!vaciarBtn) return;

  vaciarBtn.addEventListener("click", () => {
    vaciarCarrito();
    const mensaje = document.querySelector("#cart-message");
    if (mensaje) mensaje.textContent = "Carrito vaciado.";
  });
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
