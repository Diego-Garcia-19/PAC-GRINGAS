/* =========================================================
   GRINGA.EXE - SISTEMA DE PEDIDOS
   Archivo: js/script.js
   Función: Sistema del cliente
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://gbrqwiucxwqzflzxtupf.supabase.co";
const SUPABASE_KEY = "sb_publishable_jW0Tc-8Ij0klXATVMNBFAQ_z3hOqZTz";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   2. CONFIGURACIÓN DE PRECIOS
   ========================================================= */

const PRECIOS = {
    segundaSalsa: 0.15,
    extraQueso: 0.50,

    frescoIndividual: 0.35,
    frescoConGringa: 0.25,

    cantidadFrescosConDescuento: 2
};


/* =========================================================
   3. ESTADO GLOBAL DEL PEDIDO
   ========================================================= */

let pedido = [];
let gringaSeleccionada = null;
let nombreCliente = "";
let procesandoPedido = false;


/* =========================================================
   4. UTILIDADES
   ========================================================= */

/**
 * Convierte un valor a número y evita NaN.
 */
function numeroSeguro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}


/**
 * Formatea un número como dinero.
 */
function dinero(valor) {
    return numeroSeguro(valor).toFixed(2);
}


/**
 * Muestra la transición de Pac-Man.
 */
function mostrarTransicion(accion = "") {
    const transicion = document.getElementById("pacman-transicion");

    if (!transicion) return;

    transicion.classList.add("activa");

    if (typeof accion === "function") {
        setTimeout(accion, 350);
    }

    setTimeout(() => {
        transicion.classList.remove("activa");
    }, 1900);
}


/**
 * Busca un producto dentro del pedido.
 */
function buscarProducto(nombre, tipo) {
    return pedido.find(
        producto =>
            producto.nombre === nombre &&
            producto.tipo === tipo
    );
}


/* =========================================================
   5. REFERENCIAS DOM
   ========================================================= */

// Modal de salsas
const ventanaSalsas = document.getElementById("ventana-salsas");
const cerrarSalsas = document.getElementById("cerrar-salsas");

const salsaGringaNombre = document.getElementById("salsa-gringa-nombre");
const salsa1 = document.getElementById("salsa-1");
const salsa2 = document.getElementById("salsa-2");

const contenedorSalsa2 = document.getElementById("contenedor-salsa-2");
const agregarSegundaSalsa = document.getElementById("agregar-segunda-salsa");

const mensajeSalsa = document.getElementById("mensaje-salsa");
const precioSalsas = document.getElementById("precio-salsas");

const extraQuesoCheckbox = document.getElementById("extra-queso-checkbox");
const precioQueso = document.getElementById("precio-queso");

const confirmarGringa = document.getElementById("confirmar-gringa");


// Modal del pedido
const ventanaPedido = document.getElementById("ventana-pedido");
const cerrarPedido = document.getElementById("cerrar-pedido");
const listaProductos = document.getElementById("lista-productos");
const ventanaTotal = document.getElementById("ventana-total");
const confirmarPedido = document.getElementById("confirmar-pedido");


// Barra inferior
const cantidadPedido = document.getElementById("cantidad-pedido");
const totalPedido = document.getElementById("total-pedido");
const verPedido = document.getElementById("ver-pedido");


// Checkout
const ventanaCheckout = document.getElementById("ventana-checkout");
const cerrarCheckout = document.getElementById("cerrar-checkout");

const checkoutProductos = document.getElementById("checkout-productos");
const checkoutTotal = document.getElementById("checkout-total");

const botonesMetodoPago = document.querySelectorAll(".metodo-pago-btn");

const pagoEfectivo = document.getElementById("pago-efectivo");
const dineroRecibido = document.getElementById("dinero-recibido");
const cambioPago = document.getElementById("cambio-pago");

const pagoTransferencia = document.getElementById("pago-transferencia");

const finalizarPedido = document.getElementById("finalizar-pedido");


// Confirmación
const ventanaConfirmacion = document.getElementById("ventana-confirmacion");

const numeroPedido = document.getElementById("numero-pedido");
const confirmacionTotal = document.getElementById("confirmacion-total");

const confirmacionEfectivo = document.getElementById("confirmacion-efectivo");
const confirmacionCambio = document.getElementById("confirmacion-cambio");

const detalleEfectivo = document.getElementById("detalle-efectivo");
const detalleCambio = document.getElementById("detalle-cambio");
const detalleTransferencia = document.getElementById("detalle-transferencia");

const cerrarConfirmacion = document.getElementById("cerrar-confirmacion");


/* =========================================================
   6. PRECIOS DE FRESCOS
   ========================================================= */

/**
 * Calcula el precio total de los frescos.
 *
 * Regla:
 * - Sin gringa: todos $0.35
 * - Con gringa:
 *   primeros 2 frescos: $0.25 c/u
 *   desde el tercero: $0.35 c/u
 */
function calcularPrecioFrescos(cantidadFrescos, cantidadGringas) {

    cantidadFrescos = Math.max(
        0,
        Math.floor(numeroSeguro(cantidadFrescos))
    );

    cantidadGringas = Math.max(
        0,
        Math.floor(numeroSeguro(cantidadGringas))
    );

    if (cantidadFrescos === 0) {
        return 0;
    }

    // Sin gringas
    if (cantidadGringas === 0) {
        return cantidadFrescos * PRECIOS.frescoIndividual;
    }

    const frescosConDescuento = Math.min(
        cantidadFrescos,
        PRECIOS.cantidadFrescosConDescuento
    );

    const frescosPrecioNormal =
        cantidadFrescos - frescosConDescuento;

    return (
        frescosConDescuento * PRECIOS.frescoConGringa +
        frescosPrecioNormal * PRECIOS.frescoIndividual
    );
}


/**
 * Cantidad total de gringas.
 */
function obtenerCantidadGringas() {
    return pedido
        .filter(producto => producto.tipo === "gringa")
        .reduce(
            (total, producto) =>
                total + numeroSeguro(producto.cantidad),
            0
        );
}


/**
 * Cantidad total de frescos.
 */
function obtenerCantidadFrescos() {
    return pedido
        .filter(producto => producto.tipo === "fresco")
        .reduce(
            (total, producto) =>
                total + numeroSeguro(producto.cantidad),
            0
        );
}


/* =========================================================
   7. CÁLCULO DE TOTALES
   ========================================================= */

/**
 * Calcula el total de todas las gringas.
 */
function obtenerTotalGringas() {

    return pedido
        .filter(producto => producto.tipo === "gringa")
        .reduce((total, producto) => {

            const precioBase = numeroSeguro(producto.precio);
            const extraSalsa = numeroSeguro(producto.extraSalsa);
            const extraQueso = numeroSeguro(producto.extraQueso);
            const cantidad = numeroSeguro(producto.cantidad);

            const precioUnitario =
                precioBase +
                extraSalsa +
                extraQueso;

            return total + (precioUnitario * cantidad);

        }, 0);
}


/**
 * Calcula el total de los frescos.
 */
function obtenerTotalFrescos() {

    const cantidadFrescos = obtenerCantidadFrescos();
    const cantidadGringas = obtenerCantidadGringas();

    return calcularPrecioFrescos(
        cantidadFrescos,
        cantidadGringas
    );
}


/**
 * Calcula el total completo.
 */
function obtenerTotalPedido() {

    return (
        obtenerTotalGringas() +
        obtenerTotalFrescos()
    );
}


/**
 * Cantidad total de productos.
 */
function obtenerCantidadTotalPedido() {

    return pedido.reduce(
        (total, producto) =>
            total + numeroSeguro(producto.cantidad),
        0
    );
}


/* =========================================================
   8. ACTUALIZAR CARRITO
   ========================================================= */

function actualizarPedido() {

    if (!cantidadPedido || !totalPedido || !listaProductos) {
        return;
    }

    const cantidadTotal = obtenerCantidadTotalPedido();
    const total = obtenerTotalPedido();

    // Barra inferior
    cantidadPedido.textContent = cantidadTotal;
    totalPedido.textContent = `$${dinero(total)}`;

    // Total del modal
    if (ventanaTotal) {
        ventanaTotal.textContent = `$${dinero(total)}`;
    }

    // Pedido vacío
    if (pedido.length === 0) {

        listaProductos.innerHTML = `
            <div class="pedido-vacio">
                <p>👻 Tu carrito está vacío.</p>
                <p>Agrega una gringa para comenzar.</p>
            </div>
        `;

        return;
    }

    listaProductos.innerHTML = pedido
        .map((producto, indice) => {

            const cantidad = numeroSeguro(producto.cantidad);

            let subtotal = 0;
            let detalles = "";

            if (producto.tipo === "gringa") {

                const precioUnitario =
                    numeroSeguro(producto.precio) +
                    numeroSeguro(producto.extraSalsa) +
                    numeroSeguro(producto.extraQueso);

                subtotal = precioUnitario * cantidad;

                if (
                    Array.isArray(producto.salsas) &&
                    producto.salsas.length > 0
                ) {
                    detalles += `
                        <small>
                            🌶️ ${producto.salsas.join(" + ")}
                        </small>
                    `;
                }

                if (numeroSeguro(producto.extraQueso) > 0) {
                    detalles += `
                        <small>
                            🧀 Extra queso +$${dinero(producto.extraQueso)}
                        </small>
                    `;
                }

            } else if (producto.tipo === "fresco") {

                /*
                 * El precio de cada fresco depende de la cantidad
                 * total de frescos y de si existen gringas.
                 *
                 * Se calcula el precio total general y se reparte
                 * proporcionalmente para mostrar el subtotal del item.
                 */

                const cantidadFrescos = obtenerCantidadFrescos();
                const cantidadGringas = obtenerCantidadGringas();

                const totalFrescos = calcularPrecioFrescos(
                    cantidadFrescos,
                    cantidadGringas
                );

                const precioPromedio =
                    cantidadFrescos > 0
                        ? totalFrescos / cantidadFrescos
                        : 0;

                subtotal = precioPromedio * cantidad;

                detalles = `
                    <small>🥤 Fresco</small>
                `;
            }

            return `
                <div class="producto-pedido">

                    <div class="producto-pedido-info">

                        <strong>${producto.nombre}</strong>

                        ${detalles}

                        <span>
                            $${dinero(subtotal)}
                        </span>

                    </div>

                    <div class="controles-cantidad">

                        <button
                            type="button"
                            onclick="disminuirCantidad(${indice})"
                        >
                            −
                        </button>

                        <span>${cantidad}</span>

                        <button
                            type="button"
                            onclick="aumentarCantidad(${indice})"
                        >
                            +
                        </button>

                    </div>

                </div>
            `;

        })
        .join("");
}


/* =========================================================
   9. CONTROL DE CANTIDADES
   ========================================================= */

function aumentarCantidad(indice) {

    if (!pedido[indice]) return;

    pedido[indice].cantidad =
        numeroSeguro(pedido[indice].cantidad) + 1;

    actualizarPedido();
}


function disminuirCantidad(indice) {

    if (!pedido[indice]) return;

    pedido[indice].cantidad =
        numeroSeguro(pedido[indice].cantidad) - 1;

    if (pedido[indice].cantidad <= 0) {
        pedido.splice(indice, 1);
    }

    actualizarPedido();
}


/* =========================================================
   10. CONFIGURACIÓN DE GRINGAS
   ========================================================= */

document.querySelectorAll(".btn-gringa").forEach(boton => {

    boton.addEventListener("click", () => {

        const producto = boton.closest(".producto");

        if (!producto) return;

        const nombre =
            producto.querySelector("h4")?.textContent.trim() ||
            "Gringa";

        const precio =
            numeroSeguro(producto.dataset.precio);

        gringaSeleccionada = {
            nombre,
            precio,
            producto
        };

        // Reiniciar configuración
        if (salsa1) salsa1.value = "";
        if (salsa2) salsa2.value = "";

        if (contenedorSalsa2) {
            contenedorSalsa2.style.display = "none";
        }

        if (agregarSegundaSalsa) {
            agregarSegundaSalsa.style.display = "";
        }

        if (mensajeSalsa) {
            mensajeSalsa.textContent = "";
        }

        if (precioSalsas) {
            precioSalsas.textContent = "$0.00";
        }

        if (extraQuesoCheckbox) {
            extraQuesoCheckbox.checked = false;
        }

        if (precioQueso) {
            precioQueso.textContent = "$0.00";
        }

        if (salsaGringaNombre) {
            salsaGringaNombre.textContent = nombre;
        }

        if (ventanaSalsas) {
            ventanaSalsas.classList.add("activa");
        }

        mostrarTransicion();
    });

});


/* =========================================================
   11. EXTRA QUESO
   ========================================================= */

if (extraQuesoCheckbox) {

    extraQuesoCheckbox.addEventListener("change", () => {

        if (extraQuesoCheckbox.checked) {

            if (precioQueso) {
                precioQueso.textContent =
                    `+$${dinero(PRECIOS.extraQueso)}`;
            }

        } else {

            if (precioQueso) {
                precioQueso.textContent = "$0.00";
            }
        }

    });

}


/* =========================================================
   12. SEGUNDA SALSA
   ========================================================= */

if (agregarSegundaSalsa) {

    agregarSegundaSalsa.addEventListener("click", () => {

        if (!salsa1 || !salsa1.value) {

            if (mensajeSalsa) {
                mensajeSalsa.textContent =
                    "⚠️ Primero selecciona la primera salsa.";
            }

            return;
        }

        if (contenedorSalsa2) {
            contenedorSalsa2.style.display = "block";
        }

        agregarSegundaSalsa.style.display = "none";

        if (precioSalsas) {
            precioSalsas.textContent =
                `+$${dinero(PRECIOS.segundaSalsa)}`;
        }

        if (mensajeSalsa) {
            mensajeSalsa.textContent = "";
        }

    });

}


/* =========================================================
   13. VALIDACIÓN DE SEGUNDA SALSA
   ========================================================= */

if (salsa2) {

    salsa2.addEventListener("change", () => {

        if (
            salsa1 &&
            salsa1.value &&
            salsa2.value &&
            salsa1.value === salsa2.value
        ) {

            salsa2.value = "";

            if (mensajeSalsa) {
                mensajeSalsa.textContent =
                    "⚠️ No puedes seleccionar la misma salsa dos veces.";
            }

            return;
        }

        if (mensajeSalsa) {
            mensajeSalsa.textContent = "";
        }

    });

}


/* =========================================================
   14. CONFIRMAR GRINGA
   ========================================================= */

if (confirmarGringa) {

    confirmarGringa.addEventListener("click", () => {

        if (!gringaSeleccionada) {
            return;
        }

        const salsas = [];

        // Primera salsa
        if (salsa1 && salsa1.value) {
            salsas.push(salsa1.value);
        }

        // Segunda salsa
        if (
            salsa2 &&
            salsa2.value &&
            !salsas.includes(salsa2.value)
        ) {
            salsas.push(salsa2.value);
        }

        // Validación
        if (
            salsa2 &&
            salsa2.value &&
            salsa1 &&
            salsa1.value === salsa2.value
        ) {

            if (mensajeSalsa) {
                mensajeSalsa.textContent =
                    "⚠️ Las salsas deben ser diferentes.";
            }

            return;
        }

        const tieneSegundaSalsa = salsas.length >= 2;

        const extraSalsa =
            tieneSegundaSalsa
                ? PRECIOS.segundaSalsa
                : 0;

        const extraQueso =
            extraQuesoCheckbox?.checked
                ? PRECIOS.extraQueso
                : 0;

        const nuevoProducto = {
            nombre: gringaSeleccionada.nombre,
            precio: gringaSeleccionada.precio,
            cantidad: 1,
            tipo: "gringa",
            salsas,
            extraSalsa,
            extraQueso
        };

        pedido.push(nuevoProducto);

        actualizarPedido();

        gringaSeleccionada = null;

        if (ventanaSalsas) {
            ventanaSalsas.classList.remove("activa");
        }

        mostrarTransicion();

    });

}


/* =========================================================
   15. CERRAR MODAL DE SALSAS
   ========================================================= */

if (cerrarSalsas) {

    cerrarSalsas.addEventListener("click", () => {

        if (ventanaSalsas) {
            ventanaSalsas.classList.remove("activa");
        }

        gringaSeleccionada = null;
    });

}


/* =========================================================
   16. FRESCOS
   ========================================================= */

document.querySelectorAll('.producto[data-tipo="fresco"] button')
    .forEach(boton => {

        boton.addEventListener("click", () => {

            const producto = boton.closest(".producto");

            if (!producto) return;

            const nombre =
                producto.querySelector("h4")?.textContent.trim() ||
                "Fresco";

            const precio =
                numeroSeguro(producto.dataset.precio) ||
                PRECIOS.frescoIndividual;

            const existente =
                buscarProducto(nombre, "fresco");

            if (existente) {

                existente.cantidad =
                    numeroSeguro(existente.cantidad) + 1;

            } else {

                pedido.push({
                    nombre,
                    precio,
                    cantidad: 1,
                    tipo: "fresco"
                });
            }

            actualizarPedido();

            mostrarTransicion();
        });

    });


/* =========================================================
   17. MODAL DEL PEDIDO
   ========================================================= */

if (verPedido) {

    verPedido.addEventListener("click", () => {

        actualizarPedido();

        if (ventanaPedido) {
            ventanaPedido.classList.add("activa");
        }

    });

}


if (cerrarPedido) {

    cerrarPedido.addEventListener("click", () => {

        if (ventanaPedido) {
            ventanaPedido.classList.remove("activa");
        }

    });

}


/* =========================================================
   18. ABRIR CHECKOUT
   ========================================================= */

function abrirCheckout() {

    if (pedido.length === 0) {

        alert("👻 Tu pedido está vacío.");

        return;
    }

    if (!checkoutProductos) {
        return;
    }

    const cantidadFrescos = obtenerCantidadFrescos();
    const cantidadGringas = obtenerCantidadGringas();

    const totalFrescos =
        calcularPrecioFrescos(
            cantidadFrescos,
            cantidadGringas
        );

    checkoutProductos.innerHTML = pedido
        .map(producto => {

            const cantidad =
                numeroSeguro(producto.cantidad);

            let subtotal = 0;
            let detalles = "";

            if (producto.tipo === "gringa") {

                const precioUnitario =
                    numeroSeguro(producto.precio) +
                    numeroSeguro(producto.extraSalsa) +
                    numeroSeguro(producto.extraQueso);

                subtotal =
                    precioUnitario * cantidad;

                if (
                    Array.isArray(producto.salsas) &&
                    producto.salsas.length > 0
                ) {

                    detalles += `
                        <small>
                            🌶️ Salsa:
                            ${producto.salsas.join(" + ")}
                        </small>
                    `;
                }

                if (numeroSeguro(producto.extraQueso) > 0) {

                    detalles += `
                        <small>
                            🧀 Extra queso
                        </small>
                    `;
                }

            } else if (producto.tipo === "fresco") {

                const precioPromedio =
                    cantidadFrescos > 0
                        ? totalFrescos / cantidadFrescos
                        : 0;

                subtotal =
                    precioPromedio * cantidad;

                detalles = `
                    <small>🥤 Fresco</small>
                `;
            }

            return `
                <div class="checkout-producto">

                    <div>
                        <strong>
                            ${producto.nombre}
                        </strong>

                        ${detalles}

                        <span>
                            x${cantidad}
                        </span>
                    </div>

                    <strong>
                        $${dinero(subtotal)}
                    </strong>

                </div>
            `;

        })
        .join("");

    const total = obtenerTotalPedido();

    if (checkoutTotal) {
        checkoutTotal.textContent =
            `$${dinero(total)}`;
    }

    // Reiniciar métodos de pago
    if (pagoEfectivo) {
        pagoEfectivo.style.display = "none";
    }

    if (pagoTransferencia) {
        pagoTransferencia.style.display = "none";
    }

    if (dineroRecibido) {
        dineroRecibido.value = "";
    }

    if (cambioPago) {
        cambioPago.textContent = "";
    }

    if (finalizarPedido) {
        finalizarPedido.disabled = true;
        finalizarPedido.textContent = "FINALIZAR PEDIDO";
    }

    if (ventanaCheckout) {
        ventanaCheckout.classList.add("activa");
    }
}


/* =========================================================
   19. CONFIRMAR NOMBRE DEL CLIENTE
   ========================================================= */

if (confirmarPedido) {

    confirmarPedido.addEventListener("click", () => {

        if (pedido.length === 0) {

            alert("👻 Agrega productos antes de continuar.");

            return;
        }

        const nombre =
            prompt("👤 Ingresa tu nombre:");

        if (!nombre) {
            return;
        }

        nombreCliente = nombre.trim();

        if (!nombreCliente) {
            alert("⚠️ Debes ingresar un nombre.");
            return;
        }

        if (ventanaPedido) {
            ventanaPedido.classList.remove("activa");
        }

        mostrarTransicion(() => {
            abrirCheckout();
        });

    });

}


/* =========================================================
   20. CERRAR CHECKOUT
   ========================================================= */

if (cerrarCheckout) {

    cerrarCheckout.addEventListener("click", () => {

        if (ventanaCheckout) {
            ventanaCheckout.classList.remove("activa");
        }

    });

}


/* =========================================================
   21. MÉTODOS DE PAGO
   ========================================================= */

botonesMetodoPago.forEach(boton => {

    boton.addEventListener("click", () => {

        const metodo =
            boton.dataset.metodo;

        botonesMetodoPago.forEach(btn => {
            btn.classList.remove("activo");
        });

        boton.classList.add("activo");

        if (metodo === "efectivo") {

            if (pagoEfectivo) {
                pagoEfectivo.style.display = "block";
            }

            if (pagoTransferencia) {
                pagoTransferencia.style.display = "none";
            }

            if (finalizarPedido) {
                finalizarPedido.disabled = true;
            }

            setTimeout(() => {

                if (dineroRecibido) {
                    dineroRecibido.focus();
                }

            }, 100);

        }

        else if (metodo === "transferencia") {

            if (pagoEfectivo) {
                pagoEfectivo.style.display = "none";
            }

            if (pagoTransferencia) {
                pagoTransferencia.style.display = "block";
            }

            if (finalizarPedido) {
                finalizarPedido.disabled = false;
            }

        }

    });

});


/* =========================================================
   22. CÁLCULO DEL CAMBIO
   ========================================================= */

if (dineroRecibido) {

    dineroRecibido.addEventListener("input", () => {

        const total =
            obtenerTotalPedido();

        const recibido =
            parseFloat(dineroRecibido.value);

        if (!Number.isFinite(recibido)) {

            if (cambioPago) {
                cambioPago.textContent = "";
            }

            if (finalizarPedido) {
                finalizarPedido.disabled = true;
            }

            return;
        }

        const cambio =
            recibido - total;

        if (cambio < 0) {

            if (cambioPago) {
                cambioPago.textContent =
                    `Faltan $${dinero(Math.abs(cambio))}`;
            }

            if (finalizarPedido) {
                finalizarPedido.disabled = true;
            }

            return;
        }

        if (cambioPago) {
            cambioPago.textContent =
                `Cambio: $${dinero(cambio)}`;
        }

        if (finalizarPedido) {
            finalizarPedido.disabled = false;
        }

    });

}


/* =========================================================
   23. FINALIZAR Y GUARDAR PEDIDO
   ========================================================= */

if (finalizarPedido) {

    finalizarPedido.addEventListener("click", async () => {

        // Protección contra doble clic
        if (procesandoPedido) {
            return;
        }

        if (pedido.length === 0) {

            alert("👻 El pedido está vacío.");

            return;
        }

        if (!nombreCliente) {

            alert("⚠️ No se encontró el nombre del cliente.");

            return;
        }

        const total =
            obtenerTotalPedido();

        let metodoPago = "transferencia";
        let efectivoRecibido = 0;
        let cambio = 0;

        // Detectar si el método activo es efectivo
        const metodoEfectivoVisible =
            pagoEfectivo &&
            getComputedStyle(pagoEfectivo).display !== "none";

        if (metodoEfectivoVisible) {

            metodoPago = "efectivo";

            efectivoRecibido =
                parseFloat(dineroRecibido?.value);

            if (!Number.isFinite(efectivoRecibido)) {

                alert("⚠️ Ingresa la cantidad de efectivo.");

                return;
            }

            if (efectivoRecibido < total) {

                alert(
                    `⚠️ El efectivo no es suficiente.\n\n` +
                    `Total: $${dinero(total)}\n` +
                    `Recibido: $${dinero(efectivoRecibido)}`
                );

                return;
            }

            cambio =
                efectivoRecibido - total;
        }

        // Activar protección
        procesandoPedido = true;

        finalizarPedido.disabled = true;
        finalizarPedido.textContent = "PROCESANDO...";

        // Mostrar datos de confirmación
        if (confirmacionTotal) {
            confirmacionTotal.textContent =
                `$${dinero(total)}`;
        }

        if (metodoPago === "efectivo") {

            if (detalleEfectivo) {
                detalleEfectivo.style.display = "block";
            }

            if (detalleCambio) {
                detalleCambio.style.display = "block";
            }

            if (detalleTransferencia) {
                detalleTransferencia.style.display = "none";
            }

            if (confirmacionEfectivo) {
                confirmacionEfectivo.textContent =
                    `$${dinero(efectivoRecibido)}`;
            }

            if (confirmacionCambio) {
                confirmacionCambio.textContent =
                    `$${dinero(cambio)}`;
            }

        } else {

            if (detalleEfectivo) {
                detalleEfectivo.style.display = "none";
            }

            if (detalleCambio) {
                detalleCambio.style.display = "none";
            }

            if (detalleTransferencia) {
                detalleTransferencia.style.display = "block";
            }
        }

        /*
         * Copia del pedido para evitar que el objeto original
         * cambie mientras se realiza la petición.
         */
        const productosGuardar =
            pedido.map(producto => ({
                ...producto,
                salsas: Array.isArray(producto.salsas)
                    ? [...producto.salsas]
                    : []
            }));

        try {

            const { data, error } =
                await supabaseClient
                    .from("pedidos")
                    .insert([{
                        cliente: nombreCliente,
                        productos: productosGuardar,
                        total: Number(dinero(total)),
                        metodo_pago: metodoPago,
                        efectivo_recibido:
                            Number(dinero(efectivoRecibido)),
                        cambio:
                            Number(dinero(cambio)),
                        estado: "Pendiente"
                    }])
                    .select("numero_pedido")
                    .single();

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error(
                    "Supabase no devolvió información del pedido."
                );
            }

            // Número del pedido
            const numero =
                data.numero_pedido;

            const numeroFormateado =
                String(numero).padStart(3, "0");

            if (numeroPedido) {
                numeroPedido.textContent =
                    `#${numeroFormateado}`;
            }

            // Cerrar checkout
            if (ventanaCheckout) {
                ventanaCheckout.classList.remove("activa");
            }

            // Mostrar confirmación
            mostrarTransicion(() => {

                if (ventanaConfirmacion) {
                    ventanaConfirmacion.classList.add("activa");
                }

            });

            // Limpiar pedido
            pedido = [];
            nombreCliente = "";
            gringaSeleccionada = null;

            // Limpiar pago
            if (dineroRecibido) {
                dineroRecibido.value = "";
            }

            if (cambioPago) {
                cambioPago.textContent = "";
            }

            botonesMetodoPago.forEach(btn => {
                btn.classList.remove("activo");
            });

            if (pagoEfectivo) {
                pagoEfectivo.style.display = "none";
            }

            if (pagoTransferencia) {
                pagoTransferencia.style.display = "none";
            }

            actualizarPedido();

            console.log(
                "✅ Pedido guardado correctamente:",
                numeroFormateado
            );

        } catch (error) {

            console.error(
                "❌ Error al guardar el pedido:",
                error
            );

            alert(
                "❌ No se pudo registrar el pedido.\n\n" +
                "Verifica tu conexión e intenta nuevamente."
            );

            // Permitir volver a intentar
            procesandoPedido = false;

            finalizarPedido.disabled = false;
            finalizarPedido.textContent =
                "FINALIZAR PEDIDO";

            return;
        }

        // Pedido enviado correctamente
        procesandoPedido = false;

        finalizarPedido.disabled = true;
        finalizarPedido.textContent =
            "PEDIDO ENVIADO ✓";

    });

}


/* =========================================================
   24. CERRAR CONFIRMACIÓN
   ========================================================= */

if (cerrarConfirmacion) {

    cerrarConfirmacion.addEventListener("click", () => {

        if (ventanaConfirmacion) {
            ventanaConfirmacion.classList.remove("activa");
        }

    });

}


/* =========================================================
   25. CERRAR MODALES AL HACER CLICK FUERA
   ========================================================= */

[
    ventanaSalsas,
    ventanaPedido,
    ventanaCheckout,
    ventanaConfirmacion
].forEach(modal => {

    if (!modal) return;

    modal.addEventListener("click", evento => {

        if (evento.target === modal) {
            modal.classList.remove("activa");
        }

    });

});


/* =========================================================
   26. INICIALIZACIÓN
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Asegurar que los modales comiencen cerrados
    [
        ventanaSalsas,
        ventanaPedido,
        ventanaCheckout,
        ventanaConfirmacion
    ].forEach(modal => {

        if (modal) {
            modal.classList.remove("activa");
        }

    });

    actualizarPedido();

    console.log(
        "👻 GRINGA.EXE inicializado correctamente."
    );

});


/* =========================================================
   FIN DE SCRIPT.JS
   ========================================================= */