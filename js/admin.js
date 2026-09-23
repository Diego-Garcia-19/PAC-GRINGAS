/* =========================================================
   GRINGA.EXE - PANEL ADMINISTRATIVO
   Archivo: js/admin.js
   Función: Gestión de pedidos
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://gbrqwiucxwqzflzxtupf.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jW0Tc-8Ij0klXATVMNBFAQ_z3hOqZTz";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   2. REFERENCIAS DOM
   ========================================================= */

const contenedorPedidos =
    document.getElementById("contenedor-pedidos");

const conexion =
    document.getElementById("conexion");


/* =========================================================
   3. CONFIGURACIÓN
   ========================================================= */

const INTERVALO_ACTUALIZACION = 5000;


/* =========================================================
   4. UTILIDADES
   ========================================================= */

/**
 * Escapa caracteres HTML.
 */
function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/**
 * Convierte un valor en número seguro.
 */
function numeroSeguro(valor) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;
}


/**
 * Formatea dinero.
 */
function dinero(valor) {

    return numeroSeguro(valor).toFixed(2);
}


/**
 * Devuelve la clase CSS según el estado.
 */
function claseEstado(estado) {

    switch (estado) {

        case "Entregado":
            return "entregado";

        case "Preparando":
            return "preparando";

        case "Listo":
            return "listo";

        default:
            return "pendiente";
    }
}


/**
 * Convierte productos almacenados en Supabase
 * a un array válido.
 */
function obtenerProductos(productos) {

    if (Array.isArray(productos)) {
        return productos;
    }

    if (typeof productos === "string") {

        try {

            const resultado =
                JSON.parse(productos);

            return Array.isArray(resultado)
                ? resultado
                : [];

        } catch (error) {

            console.error(
                "❌ Error al interpretar productos:",
                error
            );

            return [];
        }
    }

    return [];
}


/**
 * Formatea la fecha del pedido.
 */
function formatearFecha(fecha) {

    if (!fecha) {
        return "Fecha no disponible";
    }

    const fechaObj =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObj.getTime()
        )
    ) {
        return "Fecha no disponible";
    }

    return fechaObj.toLocaleString(
        "es-SV",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


/**
 * Obtiene el número visual del pedido.
 */
function obtenerNumeroPedido(pedido) {

    if (
        pedido.numero_pedido !== null &&
        pedido.numero_pedido !== undefined
    ) {

        return String(
            pedido.numero_pedido
        ).padStart(3, "0");
    }

    return String(
        pedido.id
    ).padStart(3, "0");
}

/* =========================================================
   SONIDO DE NOTIFICACIÓN
   ========================================================= */

function reproducirSonidoNotificacion() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        const audioContext =
            new AudioContext();

        const oscilador =
            audioContext.createOscillator();

        const ganancia =
            audioContext.createGain();

        oscilador.type = "sine";

        oscilador.frequency.setValueAtTime(
            880,
            audioContext.currentTime
        );

        oscilador.frequency.setValueAtTime(
            1174,
            audioContext.currentTime + 0.12
        );

        ganancia.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.18,
            audioContext.currentTime + 0.02
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.35
        );

        oscilador.connect(ganancia);
        ganancia.connect(audioContext.destination);

        oscilador.start();

        oscilador.stop(
            audioContext.currentTime + 0.35
        );

    } catch (error) {

        console.warn(
            "No se pudo reproducir el sonido:",
            error
        );
    }
}

/* =========================================================
   5. ESTADO DE CONEXIÓN
   ========================================================= */

function actualizarEstadoConexion(
    conectado,
    mensaje = ""
) {

    if (!conexion) {
        return;
    }

    if (conectado) {

        conexion.textContent =
            "🟢 Conectado";

        conexion.style.color =
            "#38ff8b";

    } else {

        conexion.textContent =
            mensaje || "🔴 Error de conexión";

        conexion.style.color =
            "#ff3154";
    }
}


/* =========================================================
   6. CARGAR PEDIDOS
   ========================================================= */

async function cargarPedidos() {

    if (!contenedorPedidos) {
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("pedidos")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        actualizarEstadoConexion(true);


        /* -------------------------------------------------
           SIN PEDIDOS
           ------------------------------------------------- */

        if (
            !data ||
            data.length === 0
        ) {

            contenedorPedidos.innerHTML = `
                <div class="sin-pedidos">

                    <h2>👻 SIN PEDIDOS</h2>

                    <p>
                        Todavía no hay pedidos registrados.
                    </p>

                </div>
            `;

            return;
        }


        /* -------------------------------------------------
           RENDERIZAR
           ------------------------------------------------- */

        contenedorPedidos.innerHTML =
            data
                .map(renderizarPedido)
                .join("");


        /* -------------------------------------------------
           EVENTOS
           ------------------------------------------------- */

        document
            .querySelectorAll(
                ".btn-cambiar-estado"
            )
            .forEach(boton => {

                boton.addEventListener(
                    "click",
                    manejarCambioEstado
                );

            });


    } catch (error) {

        console.error(
            "❌ Error al cargar pedidos:",
            error
        );

        actualizarEstadoConexion(
            false,
            "🔴 Error de conexión"
        );

        contenedorPedidos.innerHTML = `
            <div class="error">

                <strong>
                    ❌ No se pudieron cargar los pedidos.
                </strong>

                <br><br>

                <span>
                    ${escaparHTML(
                        error.message
                    )}
                </span>

            </div>
        `;
    }
}


/* =========================================================
   7. RENDERIZAR PEDIDO
   ========================================================= */

function renderizarPedido(pedido) {

    const productos =
        obtenerProductos(
            pedido.productos
        );

    const estado =
        pedido.estado || "Pendiente";

    const clase =
        claseEstado(estado);

    const numero =
        obtenerNumeroPedido(pedido);


    /* -----------------------------------------------------
       PRODUCTOS
       ----------------------------------------------------- */

    const productosHTML =
        productos.length > 0

            ? productos
                .map(renderizarProducto)
                .join("")

            : `
                <div class="producto">

                    <div class="producto-nombre">
                        Sin productos
                    </div>

                </div>
            `;


    /* -----------------------------------------------------
       PAGO
       ----------------------------------------------------- */

    let pagoHTML = `
        <div class="pago">

            💳 Método de pago:

            <strong>
                ${escaparHTML(
                    pedido.metodo_pago ||
                    "No especificado"
                )}
            </strong>
    `;


    if (
        pedido.metodo_pago ===
        "efectivo"
    ) {

        pagoHTML += `
            <br>

            💵 Efectivo recibido:

            <strong>
                $${dinero(
                    pedido.efectivo_recibido
                )}
            </strong>

            <br>

            💰 Cambio:

            <strong>
                $${dinero(
                    pedido.cambio
                )}
            </strong>
        `;
    }


    if (
        pedido.metodo_pago ===
        "transferencia"
    ) {

        pagoHTML += `
            <br>

            🏦 Pago mediante transferencia.
        `;
    }


    pagoHTML += `
        </div>
    `;


    /* -----------------------------------------------------
       HTML DEL PEDIDO
       ----------------------------------------------------- */

    return `
        <article
            class="pedido"
            data-pedido-id="${numeroSeguro(
                pedido.id
            )}"
        >

            <div class="pedido-header">

                <div>

                    <div class="numero">
                        #${escaparHTML(numero)}
                    </div>

                    <small
                        style="
                            color:#666;
                            display:block;
                            margin-top:4px;
                        "
                    >
                        ${escaparHTML(
                            formatearFecha(
                                pedido.fecha
                            )
                        )}
                    </small>

                </div>


                <button
                    type="button"
                    class="estado ${clase} btn-cambiar-estado"
                    data-id="${numeroSeguro(
                        pedido.id
                    )}"
                    data-estado="${escaparHTML(
                        estado
                    )}"
                >
                    ${escaparHTML(estado)}
                </button>

            </div>


            <div class="cliente">

                👤

                <strong>
                    Cliente:
                </strong>

                ${escaparHTML(
                    pedido.cliente ||
                    "Sin nombre"
                )}

            </div>


            <div class="productos-pedido">

                ${productosHTML}

            </div>


            <div class="total">

                <span>
                    TOTAL
                </span>

                <span>
                    $${dinero(
                        pedido.total
                    )}
                </span>

            </div>


            ${pagoHTML}

        </article>
    `;
}


/* =========================================================
   8. OBTENER SUBTOTAL DEL PRODUCTO
   ========================================================= */

function obtenerSubtotalProducto(producto) {

    if (!producto) {
        return 0;
    }


    /*
     * NUEVO SISTEMA:
     *
     * script.js ahora guarda el subtotal exacto
     * de cada producto.
     *
     * Esto permite conservar correctamente
     * promociones como:
     *
     * 2 frescos → $0.25
     * restantes → $0.35
     */

    if (
        producto.subtotal !== undefined &&
        producto.subtotal !== null
    ) {

        return numeroSeguro(
            producto.subtotal
        );
    }


    /* -----------------------------------------------------
       COMPATIBILIDAD CON PEDIDOS ANTIGUOS
       ----------------------------------------------------- */

    const cantidad =
        Math.max(
            0,
            numeroSeguro(
                producto.cantidad
            )
        );

    const precio =
        numeroSeguro(
            producto.precio
        );

    const extraSalsa =
        numeroSeguro(
            producto.extraSalsa
        );

    const extraQueso =
        numeroSeguro(
            producto.extraQueso
        );


    /* Fresco antiguo */
    if (
        producto.tipo ===
        "fresco"
    ) {

        return precio * cantidad;
    }


    /* Gringa antigua */
    return (
        precio +
        extraSalsa +
        extraQueso
    ) * cantidad;
}


/* =========================================================
   9. RENDERIZAR PRODUCTO
   ========================================================= */

function renderizarProducto(producto) {

    if (!producto) {
        return "";
    }


    const nombre =
        producto.nombre ||
        "Producto";

    const cantidad =
        Math.max(
            0,
            numeroSeguro(
                producto.cantidad
            )
        );

    const precio =
        numeroSeguro(
            producto.precio
        );

    const extraSalsa =
        numeroSeguro(
            producto.extraSalsa
        );

    const extraQueso =
        numeroSeguro(
            producto.extraQueso
        );


    const subtotal =
        obtenerSubtotalProducto(
            producto
        );


    /* -----------------------------------------------------
       DETALLES
       ----------------------------------------------------- */

    let detalles =
        `x${cantidad}`;


    /* -----------------------------------------------------
       SALSAS
       ----------------------------------------------------- */

    if (
        Array.isArray(
            producto.salsas
        ) &&
        producto.salsas.length > 0
    ) {

        detalles +=
            ` · 🌶️ ${producto.salsas
                .map(escaparHTML)
                .join(" + ")}`;
    }


    /* -----------------------------------------------------
       SEGUNDA SALSA
       ----------------------------------------------------- */

    if (
        extraSalsa > 0
    ) {

        detalles +=
            ` · +$${dinero(
                extraSalsa
            )} salsa extra`;
    }


    /* -----------------------------------------------------
       EXTRA QUESO
       ----------------------------------------------------- */

    if (
        extraQueso > 0
    ) {

        detalles +=
            ` · 🧀 +$${dinero(
                extraQueso
            )}`;
    }


    /* -----------------------------------------------------
       PROMOCIÓN DE FRESCOS
       ----------------------------------------------------- */

    if (
        producto.tipo ===
        "fresco"
    ) {

        const precioAplicado =
            numeroSeguro(
                producto.precio_aplicado
            );


        /*
         * Si el pedido nuevo contiene
         * precio_aplicado, mostramos
         * información adicional.
         */

        if (
            precioAplicado > 0 &&
            precioAplicado < precio
        ) {

            detalles +=
                ` · 🥤 Promo`;
        }
    }


    /* -----------------------------------------------------
       HTML
       ----------------------------------------------------- */

    return `
        <div class="producto">

            <div class="producto-nombre">

                ${escaparHTML(
                    nombre
                )}

            </div>

            <div class="producto-detalle">

                ${escaparHTML(
                    detalles
                )}

                <br>

                Subtotal:

                <strong>
                    $${dinero(
                        subtotal
                    )}
                </strong>

            </div>

        </div>
    `;
}


/* =========================================================
   10. CAMBIAR ESTADO
   ========================================================= */

async function manejarCambioEstado(
    evento
) {

    const boton =
        evento.currentTarget;

    const id =
        numeroSeguro(
            boton.dataset.id
        );

    const estadoActual =
        boton.dataset.estado ||
        "Pendiente";


    if (!id) {
        return;
    }


    /*
     * SISTEMA ACTUAL:
     *
     * Pendiente <-> Entregado
     *
     * Posteriormente podemos ampliar
     * a:
     *
     * Pendiente
     *      ↓
     * Preparando
     *      ↓
     * Listo
     *      ↓
     * Entregado
     */

    const nuevoEstado =
        estadoActual ===
        "Entregado"

            ? "Pendiente"

            : "Entregado";


    const confirmar =
        confirm(
            `¿Cambiar el pedido #${String(id)
                .padStart(3, "0")} a "${nuevoEstado}"?`
        );


    if (!confirmar) {
        return;
    }


    boton.disabled = true;

    const textoOriginal =
        boton.textContent;

    boton.textContent =
        "Actualizando...";


    try {

        const {
            error
        } = await supabaseClient
            .from("pedidos")
            .update({
                estado: nuevoEstado
            })
            .eq("id", id);


        if (error) {
            throw error;
        }


        console.log(
            `✅ Pedido #${id} actualizado a ${nuevoEstado}`
        );


        await cargarPedidos();


    } catch (error) {

        console.error(
            "❌ Error al cambiar estado:",
            error
        );

        alert(
            "❌ No se pudo actualizar el estado.\n\n" +
            error.message
        );


        boton.disabled = false;

        boton.textContent =
            textoOriginal;
    }
}


/* =========================================================
   11. COMPATIBILIDAD
   ========================================================= */

/*
 * Se conserva por si una versión anterior
 * de admin.html utiliza:
 *
 * cambiarEstado(id, estado)
 */

async function cambiarEstado(
    id,
    estadoActual
) {

    const nuevoEstado =
        estadoActual ===
        "Entregado"

            ? "Pendiente"

            : "Entregado";


    const confirmar =
        confirm(
            `¿Cambiar el pedido #${String(id)
                .padStart(3, "0")} a "${nuevoEstado}"?`
        );


    if (!confirmar) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from("pedidos")
            .update({
                estado: nuevoEstado
            })
            .eq("id", id);


        if (error) {
            throw error;
        }


        await cargarPedidos();


    if (nuevoEstado === "Entregado") {
    reproducirSonidoNotificacion();
}


/* =========================================================
   12. ACTUALIZACIÓN AUTOMÁTICA
   ========================================================= */

setInterval(
    cargarPedidos,
    INTERVALO_ACTUALIZACION
);


/* =========================================================
   13. INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "👻 GRINGA.EXE Admin inicializado."
        );

        cargarPedidos();

    }
);