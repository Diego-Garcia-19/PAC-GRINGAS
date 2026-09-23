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

/*
 * Realtime será el sistema principal.
 *
 * Este intervalo NO actualiza constantemente el panel.
 * Solo funciona como respaldo cuando Realtime no está
 * conectado correctamente.
 */

const INTERVALO_RESPALDO = 15000;


/* =========================================================
   4. ESTADO INTERNO
   ========================================================= */

let canalPedidos = null;

let realtimeConectado = false;

let cargandoPedidos = false;

let actualizacionPendiente = false;

let intervaloRespaldo = null;


/* =========================================================
   5. UTILIDADES
   ========================================================= */

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


function numeroSeguro(valor) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;
}


function dinero(valor) {

    return numeroSeguro(valor).toFixed(2);
}


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
   6. ESTADO DE CONEXIÓN
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

        return;
    }


    conexion.textContent =
        mensaje || "🔴 Error de conexión";

    conexion.style.color =
        "#ff3154";
}


/* =========================================================
   7. CARGAR PEDIDOS
   ========================================================= */

async function cargarPedidos() {

    if (!contenedorPedidos) {
        return;
    }


    /*
     * Evita que varias actualizaciones simultáneas
     * hagan múltiples consultas innecesarias.
     */

    if (cargandoPedidos) {

        actualizacionPendiente = true;

        return;
    }


    cargandoPedidos = true;


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


        actualizarEstadoConexion(
            true
        );


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


        /*
         * Una sola escritura del DOM.
         *
         * Esto evita modificar el HTML
         * repetidamente durante el renderizado.
         */

        contenedorPedidos.innerHTML =
            data
                .map(renderizarPedido)
                .join("");


    } catch (error) {

        console.error(
            "❌ Error al cargar pedidos:",
            error
        );


        /*
         * No marcamos Realtime como desconectado
         * simplemente porque falle una consulta.
         * El canal puede seguir funcionando.
         */

        actualizarEstadoConexion(
            false,
            realtimeConectado
                ? "🟡 Error al actualizar"
                : "🔴 Sin conexión"
        );


        /*
         * Solo mostramos el error si todavía
         * no existen pedidos visibles.
         */

        if (
            !contenedorPedidos.children.length ||
            contenedorPedidos.innerHTML.trim() === ""
        ) {

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


    } finally {

        cargandoPedidos = false;


        /*
         * Si llegó otro cambio mientras estábamos
         * cargando, hacemos una actualización adicional.
         */

        if (actualizacionPendiente) {

            actualizacionPendiente = false;

            cargarPedidos();
        }
    }
}


/* =========================================================
   8. RENDERIZAR PEDIDO
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
                    ${escaparHTML(
                        estado
                    )}
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
   9. SUBTOTAL DEL PRODUCTO
   ========================================================= */

function obtenerSubtotalProducto(producto) {

    if (!producto) {
        return 0;
    }


    /*
     * PRIORIDAD ABSOLUTA:
     *
     * Si el subtotal fue guardado cuando
     * se realizó el pedido, utilizamos
     * exactamente ese valor.
     */

    if (
        producto.subtotal !== undefined &&
        producto.subtotal !== null
    ) {

        return numeroSeguro(
            producto.subtotal
        );
    }


    /*
     * COMPATIBILIDAD CON PEDIDOS ANTIGUOS
     */

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


    /*
     * FRESCOS
     */

    if (
        producto.tipo ===
        "fresco"
    ) {

        const precioAplicado =
            numeroSeguro(
                producto.precioAplicado ??
                producto.precio_aplicado ??
                producto.precio
            );

        return precioAplicado * cantidad;
    }


    /*
     * GRINGAS
     */

    return (
        precio +
        extraSalsa +
        extraQueso
    ) * cantidad;
}


/* =========================================================
   10. RENDERIZAR PRODUCTO
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


    let detalles =
        `x${cantidad}`;


    /*
     * SALSAS
     */

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


    /*
     * SALSA EXTRA
     */

    if (
        extraSalsa > 0
    ) {

        detalles +=
            ` · +$${dinero(
                extraSalsa
            )} salsa extra`;
    }


    /*
     * QUESO EXTRA
     */

    if (
        extraQueso > 0
    ) {

        detalles +=
            ` · 🧀 +$${dinero(
                extraQueso
            )}`;
    }


    /*
     * PROMOCIÓN DE FRESCO
     */

    if (
        producto.tipo ===
        "fresco"
    ) {

        const precioAplicado =
            numeroSeguro(
                producto.precioAplicado ??
                producto.precio_aplicado ??
                producto.precio
            );


        if (
            precioAplicado > 0 &&
            precioAplicado < precio
        ) {

            detalles +=
                ` · 🥤 Promo`;
        }
    }


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
   11. CAMBIAR ESTADO
   ========================================================= */

async function manejarCambioEstado(evento) {

    const boton =
        evento.target.closest(
            ".btn-cambiar-estado"
        );


    if (!boton) {
        return;
    }


    /*
     * Evita doble clic.
     */

    if (boton.disabled) {
        return;
    }


    const id =
        numeroSeguro(
            boton.dataset.id
        );


    const estadoActual =
        boton.dataset.estado ||
        "Pendiente";


    if (!id) {

        console.error(
            "❌ ID de pedido inválido."
        );

        return;
    }


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


    const textoOriginal =
        boton.textContent.trim();


    boton.disabled = true;

    boton.textContent =
        "Actualizando...";


    try {

        console.log(
            `🔄 Actualizando pedido #${id}...`
        );


        const {
            data,
            error
        } = await supabaseClient
            .from("pedidos")
            .update({
                estado: nuevoEstado
            })
            .eq("id", id)
            .select();


        if (error) {

            console.error(
                "❌ Supabase rechazó la actualización:",
                error
            );

            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "Supabase no actualizó ningún pedido. Revisa las políticas RLS de la tabla pedidos."
            );
        }


        console.log(
            `✅ Pedido #${id} actualizado a ${nuevoEstado}`
        );


        /*
         * No llamamos cargarPedidos() aquí.
         *
         * Supabase Realtime detectará el UPDATE
         * y actualizará el panel automáticamente.
         *
         * Si Realtime tarda o está desconectado,
         * el sistema de respaldo se encargará.
         */

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
   12. COMPATIBILIDAD
   ========================================================= */

async function cambiarEstado(
    id,
    estadoActual
) {

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


        /*
         * Realtime se encargará de actualizar
         * visualmente el panel.
         */

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
   13. SUPABASE REALTIME
   ========================================================= */

function iniciarRealtime() {

    /*
     * Si ya existe un canal, no creamos otro.
     */

    if (canalPedidos) {

        console.warn(
            "⚠️ El canal Realtime ya está iniciado."
        );

        return;
    }


    console.log(
        "📡 Iniciando Supabase Realtime..."
    );


    canalPedidos =
        supabaseClient
            .channel(
                "admin-pedidos"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "pedidos"
                },
                payload => {

                    console.log(
                        "📡 Cambio detectado en pedidos:",
                        payload.eventType
                    );


                    /*
                     * Esperamos a que Supabase termine
                     * de confirmar el cambio antes de
                     * volver a consultar los pedidos.
                     */

                    cargarPedidos();

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "📡 Estado Realtime:",
                        status
                    );


                    if (
                        status ===
                        "SUBSCRIBED"
                    ) {

                        realtimeConectado =
                            true;


                        actualizarEstadoConexion(
                            true
                        );


                        console.log(
                            "✅ Realtime conectado correctamente."
                        );


                        return;
                    }


                    realtimeConectado =
                        false;


                    if (
                        status ===
                        "CHANNEL_ERROR"
                    ) {

                        actualizarEstadoConexion(
                            false,
                            "🟡 Realtime desconectado"
                        );


                        console.warn(
                            "⚠️ Realtime presentó un error. Se utilizará el respaldo."
                        );


                        return;
                    }


                    if (
                        status ===
                        "TIMED_OUT"
                    ) {

                        actualizarEstadoConexion(
                            false,
                            "🟡 Realtime agotó el tiempo"
                        );


                        console.warn(
                            "⚠️ Realtime agotó el tiempo. Se utilizará el respaldo."
                        );


                        return;
                    }


                    if (
                        status ===
                        "CLOSED"
                    ) {

                        actualizarEstadoConexion(
                            false,
                            "🟡 Realtime cerrado"
                        );


                        console.warn(
                            "⚠️ Canal Realtime cerrado."
                        );
                    }
                }
            );
}


/* =========================================================
   14. RESPALDO DE ACTUALIZACIÓN
   ========================================================= */

function iniciarRespaldo() {

    /*
     * El respaldo consulta cada 15 segundos.
     *
     * Cuando Realtime está funcionando, NO hacemos
     * consultas periódicas.
     *
     * Si Realtime falla, el respaldo mantiene el
     * panel actualizado.
     */

    if (intervaloRespaldo) {
        return;
    }


    intervaloRespaldo =
        setInterval(
            () => {

                if (
                    !realtimeConectado
                ) {

                    console.log(
                        "🔄 Respaldo: comprobando pedidos..."
                    );


                    cargarPedidos();
                }

            },
            INTERVALO_RESPALDO
        );
}


/* =========================================================
   15. DELEGACIÓN DE EVENTOS
   ========================================================= */

if (contenedorPedidos) {

    contenedorPedidos.addEventListener(
        "click",
        manejarCambioEstado
    );
}


/* =========================================================
   16. INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "👻 GRINGA.EXE Admin inicializado."
        );


        /*
         * Primera carga.
         */

        cargarPedidos();


        /*
         * Realtime.
         */

        iniciarRealtime();


        /*
         * Respaldo.
         */

        iniciarRespaldo();

    }
);