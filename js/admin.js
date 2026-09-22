/* =========================================================
   GRINGA.EXE - PANEL ADMINISTRATIVO
   Archivo: js/admin.js
   Función: Gestión de pedidos
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://gbrqwiucxwqzflzxtupf.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jW0Tc-8Ij0klXATVMNBFAQ_z3hOqZTz";

const supabaseClient = window.supabase.createClient(
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
 * Escapa caracteres HTML para evitar que datos
 * introducidos por usuarios sean interpretados como HTML.
 */
function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
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
 * Formatea valores monetarios.
 */
function dinero(valor) {

    return numeroSeguro(valor).toFixed(2);
}


/**
 * Convierte el estado a una clase CSS segura.
 */
function claseEstado(estado) {

    return estado === "Entregado"
        ? "entregado"
        : "pendiente";
}


/**
 * Convierte productos a array.
 *
 * Supabase normalmente devuelve JSON como array,
 * pero esta función también soporta texto JSON.
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
                "Error al interpretar productos:",
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

    if (Number.isNaN(fechaObj.getTime())) {
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


/* =========================================================
   5. CONEXIÓN
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
            .order("id", {
                ascending: false
            });


        /* -------------------------------------------------
           ERROR
           ------------------------------------------------- */

        if (error) {
            throw error;
        }


        /* -------------------------------------------------
           CONEXIÓN CORRECTA
           ------------------------------------------------- */

        actualizarEstadoConexion(true);


        /* -------------------------------------------------
           SIN PEDIDOS
           ------------------------------------------------- */

        if (!data || data.length === 0) {

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
           RENDERIZAR PEDIDOS
           ------------------------------------------------- */

        contenedorPedidos.innerHTML =
            data.map(renderizarPedido).join("");


        /* -------------------------------------------------
           ACTIVAR BOTONES
           ------------------------------------------------- */

        document
            .querySelectorAll(".btn-cambiar-estado")
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
                    ${escaparHTML(error.message)}
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
        obtenerProductos(pedido.productos);

    const estado =
        pedido.estado || "Pendiente";

    const clase =
        claseEstado(estado);

    const numero =
        pedido.numero_pedido !== null &&
        pedido.numero_pedido !== undefined
            ? String(pedido.numero_pedido)
                .padStart(3, "0")
            : String(pedido.id)
                .padStart(3, "0");


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
       INFORMACIÓN DE PAGO
       ----------------------------------------------------- */

    let pagoHTML = `
        <div class="pago">

            💳 Método de pago:
            <strong>
                ${escaparHTML(
                    pedido.metodo_pago || "No especificado"
                )}
            </strong>

    `;


    if (pedido.metodo_pago === "efectivo") {

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


    if (pedido.metodo_pago === "transferencia") {

        pagoHTML += `
            <br>

            🏦 Pago mediante transferencia.
        `;
    }


    pagoHTML += `
        </div>
    `;


    /* -----------------------------------------------------
       HTML COMPLETO
       ----------------------------------------------------- */

    return `
        <article
            class="pedido"
            data-pedido-id="${numeroSeguro(pedido.id)}"
        >

            <div class="pedido-header">

                <div>

                    <div class="numero">
                        #${escaparHTML(numero)}
                    </div>

                    <small style="
                        color:#666;
                        display:block;
                        margin-top:4px;
                    ">
                        ${escaparHTML(
                            formatearFecha(pedido.fecha)
                        )}
                    </small>

                </div>


                <button
                    type="button"
                    class="estado ${clase} btn-cambiar-estado"
                    data-id="${numeroSeguro(pedido.id)}"
                    data-estado="${escaparHTML(estado)}"
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
                    pedido.cliente || "Sin nombre"
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
                    $${dinero(pedido.total)}
                </span>

            </div>


            ${pagoHTML}

        </article>
    `;
}


/* =========================================================
   8. RENDERIZAR PRODUCTO
   ========================================================= */

function renderizarProducto(producto) {

    if (!producto) {
        return "";
    }

    const nombre =
        producto.nombre || "Producto";

    const cantidad =
        numeroSeguro(producto.cantidad);

    const precio =
        numeroSeguro(producto.precio);

    const extraSalsa =
        numeroSeguro(producto.extraSalsa);

    const extraQueso =
        numeroSeguro(producto.extraQueso);


    /* -----------------------------------------------------
       SUBTOTAL
       ----------------------------------------------------- */

    let subtotal =
        (precio + extraSalsa + extraQueso) *
        cantidad;


    /* -----------------------------------------------------
       DETALLES
       ----------------------------------------------------- */

    let detalles = `x${cantidad}`;


    // Salsas
    if (
        Array.isArray(producto.salsas) &&
        producto.salsas.length > 0
    ) {

        detalles +=
            ` · 🌶️ ${producto.salsas
                .map(escaparHTML)
                .join(" + ")}`;
    }


    // Segunda salsa
    if (extraSalsa > 0) {

        detalles +=
            ` · +$${dinero(extraSalsa)} salsa extra`;
    }


    // Extra queso
    if (extraQueso > 0) {

        detalles +=
            ` · 🧀 +$${dinero(extraQueso)}`;
    }


    /* -----------------------------------------------------
       FRESCOS
       ----------------------------------------------------- */

    if (producto.tipo === "fresco") {

        /*
         * El precio mostrado aquí corresponde al precio
         * almacenado inicialmente.
         *
         * El total final del pedido viene directamente
         * de pedido.total.
         */

        subtotal =
            precio * cantidad;
    }


    return `
        <div class="producto">

            <div class="producto-nombre">

                ${escaparHTML(nombre)}

            </div>

            <div class="producto-detalle">

                ${escaparHTML(detalles)}

                <br>

                Subtotal:
                <strong>
                    $${dinero(subtotal)}
                </strong>

            </div>

        </div>
    `;
}


/* =========================================================
   9. CAMBIAR ESTADO
   ========================================================= */

async function manejarCambioEstado(evento) {

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
     * Actualmente utilizamos dos estados:
     *
     * Pendiente <-> Entregado
     *
     * Más adelante podemos ampliar el sistema a:
     * Pendiente -> Preparando -> Listo -> Entregado
     */

    const nuevoEstado =
        estadoActual === "Entregado"
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
   10. FUNCIÓN GLOBAL DE COMPATIBILIDAD
   ========================================================= */

/*
 * Dejamos esta función disponible por si algún elemento
 * antiguo de admin.html todavía utiliza:
 *
 * cambiarEstado(id, estado)
 *
 * Así evitamos que el panel se rompa si queda algún
 * onclick antiguo.
 */

async function cambiarEstado(id, estadoActual) {

    const nuevoEstado =
        estadoActual === "Entregado"
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


    } catch (error) {

        console.error(
            "❌ Error al cambiar estado:",
            error
        );

        alert(
            "❌ No se pudo actualizar el pedido.\n\n" +
            error.message
        );
    }
}


/* =========================================================
   11. ACTUALIZACIÓN AUTOMÁTICA
   ========================================================= */

/*
 * No usamos Realtime todavía.
 *
 * Por ahora el panel consulta Supabase cada 5 segundos.
 * En la siguiente optimización podemos sustituir esto
 * por Supabase Realtime.
 */

setInterval(
    cargarPedidos,
    INTERVALO_ACTUALIZACION
);


/* =========================================================
   12. INICIALIZACIÓN
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