/* =========================================================
   GRINGA.EXE - ADMIN
   Archivo: js/admin.js
   Función: Administración de pedidos
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
    document.getElementById(
        "contenedor-pedidos"
    );

const conexion =
    document.getElementById(
        "conexion"
    );


/* =========================================================
   3. CONFIGURACIÓN
   ========================================================= */

const INTERVALO_RESPALDO = 15000;


/* =========================================================
   4. ESTADO DEL ADMIN
   ========================================================= */

let canalPedidos = null;

let realtimeConectado = false;

let cargandoPedidos = false;

let actualizacionPendiente = false;

let intervaloRespaldo = null;


/* =========================================================
   5. UTILIDADES
   ========================================================= */

function numeroSeguro(valor) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;
}


function dinero(valor) {

    return numeroSeguro(valor)
        .toFixed(2);
}


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


/* =========================================================
   6. SUBTOTAL DE PRODUCTO
   ========================================================= */

/*
 * IMPORTANTE:
 *
 * Si el pedido ya tiene un subtotal guardado,
 * utilizamos ese valor.
 *
 * Esto evita que el administrador vuelva a
 * calcular precios promocionales incorrectamente.
 */

function obtenerSubtotalProducto(producto) {

    if (
        producto &&
        producto.subtotal !== undefined &&
        producto.subtotal !== null &&
        Number.isFinite(
            Number(producto.subtotal)
        )
    ) {

        return Number(
            producto.subtotal
        );
    }


    const cantidad =
        numeroSeguro(
            producto?.cantidad
        );


    if (
        producto?.tipo ===
        "gringa"
    ) {

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

        const precioUnitario =
            precio +
            extraSalsa +
            extraQueso;

        return (
            precioUnitario *
            cantidad
        );
    }


    if (
        producto?.tipo ===
        "fresco"
    ) {

        const precioAplicado =
            numeroSeguro(
                producto.precioAplicado ??
                producto.precio_aplicado ??
                producto.precio
            );

        return (
            precioAplicado *
            cantidad
        );
    }


    return 0;
}


/* =========================================================
   7. TEXTO / CLASE DEL ESTADO
   ========================================================= */

function obtenerClaseEstado(estado) {

    return String(
        estado || "Pendiente"
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        );
}


function obtenerSiguienteEstado(estado) {

    switch (estado) {

        case "Pendiente":
            return "Preparando";

        case "Preparando":
            return "Listo";

        case "Listo":
            return "Entregado";

        case "Entregado":
            return "Pendiente";

        default:
            return "Preparando";
    }
}


/* =========================================================
   8. ACTUALIZAR INDICADOR DE CONEXIÓN
   ========================================================= */

function actualizarEstadoConexion(
    conectado
) {

    if (!conexion) {
        return;
    }


    if (conectado) {

        conexion.textContent =
            "🟢 Conectado";

    } else {

        conexion.textContent =
            "🟠 Modo respaldo";
    }
}


/* =========================================================
   9. RENDERIZAR PRODUCTOS
   ========================================================= */

function renderizarProducto(
    producto
) {

    const cantidad =
        numeroSeguro(
            producto?.cantidad
        );

    const subtotal =
        obtenerSubtotalProducto(
            producto
        );


    let detalles = "";


    if (
        producto?.tipo ===
        "gringa"
    ) {

        if (
            Array.isArray(
                producto.salsas
            ) &&
            producto.salsas.length > 0
        ) {

            detalles += `
                <small>
                    🌶️ Salsa:
                    ${escaparHTML(
                        producto.salsas.join(
                            " + "
                        )
                    )}
                </small>
            `;
        }


        if (
            numeroSeguro(
                producto.extraSalsa
            ) > 0
        ) {

            detalles += `
                <small>
                    🌶️ Segunda salsa
                    +$${dinero(
                        producto.extraSalsa
                    )}
                </small>
            `;
        }


        if (
            numeroSeguro(
                producto.extraQueso
            ) > 0
        ) {

            detalles += `
                <small>
                    🧀 Extra queso
                    +$${dinero(
                        producto.extraQueso
                    )}
                </small>
            `;
        }
    }


    else if (
        producto?.tipo ===
        "fresco"
    ) {

        const precioAplicado =
            numeroSeguro(
                producto.precioAplicado ??
                producto.precio_aplicado ??
                producto.precio
            );

        detalles = `
            <small>
                🥤 $${dinero(
                    precioAplicado
                )} c/u
            </small>
        `;
    }


    return `
        <div class="producto-pedido">

            <div class="producto-pedido-info">

                <strong>
                    ${escaparHTML(
                        producto?.nombre ||
                        "Producto"
                    )}
                </strong>

                ${detalles}

                <span>
                    x${cantidad}
                </span>

            </div>

            <strong>
                $${dinero(
                    subtotal
                )}
            </strong>

        </div>
    `;
}


/* =========================================================
   10. RENDERIZAR PEDIDO
   ========================================================= */

function renderizarPedido(
    pedido
) {

    const estado =
        pedido.estado ||
        "Pendiente";


    const claseEstado =
        obtenerClaseEstado(
            estado
        );


    const siguienteEstado =
        obtenerSiguienteEstado(
            estado
        );


    let productos = [];


    if (
        Array.isArray(
            pedido.productos
        )
    ) {

        productos =
            pedido.productos;

    } else {

        try {

            productos =
                JSON.parse(
                    pedido.productos || "[]"
                );

        } catch (error) {

            console.warn(
                "⚠️ No se pudieron leer los productos del pedido:",
                pedido.id
            );

            productos = [];
        }
    }


    const productosHTML =
        productos
            .map(
                renderizarProducto
            )
            .join("");


    const numero =
        pedido.numero_pedido ??
        pedido.id;


    return `
        <div
            class="pedido-card ${claseEstado}"
            data-id="${pedido.id}"
        >

            <div class="pedido-header">

                <div>

                    <h3>
                        Pedido #${escaparHTML(
                            numero
                        )}
                    </h3>

                    <p>
                        👤 ${escaparHTML(
                            pedido.cliente ||
                            "Cliente"
                        )}
                    </p>

                </div>

                <span class="estado ${claseEstado}">
                    ${escaparHTML(
                        estado
                    )}
                </span>

            </div>


            <div class="pedido-productos">

                ${productosHTML}

            </div>


            <div class="pedido-info">

                <p>
                    💳 Método:
                    <strong>
                        ${escaparHTML(
                            pedido.metodo_pago ||
                            "No especificado"
                        )}
                    </strong>
                </p>

                ${
                    pedido.efectivo_recibido !==
                    null &&
                    pedido.efectivo_recibido !==
                    undefined
                    ? `
                        <p>
                            💵 Efectivo:
                            <strong>
                                $${dinero(
                                    pedido.efectivo_recibido
                                )}
                            </strong>
                        </p>
                    `
                    : ""
                }

                ${
                    pedido.cambio !==
                    null &&
                    pedido.cambio !==
                    undefined
                    ? `
                        <p>
                            💰 Cambio:
                            <strong>
                                $${dinero(
                                    pedido.cambio
                                )}
                            </strong>
                        </p>
                    `
                    : ""
                }

            </div>


            <div class="pedido-footer">

                <strong class="pedido-total">
                    TOTAL:
                    $${dinero(
                        pedido.total
                    )}
                </strong>


                <button
                    type="button"
                    class="btn-cambiar-estado"
                    data-id="${pedido.id}"
                    data-estado="${escaparHTML(
                        siguienteEstado
                    )}"
                >
                    Cambiar a
                    ${escaparHTML(
                        siguienteEstado
                    )}
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   11. CARGAR PEDIDOS
   ========================================================= */

async function cargarPedidos() {

    /*
     * Evitamos varias consultas simultáneas.
     */

    if (cargandoPedidos) {

        actualizacionPendiente =
            true;

        return;
    }


    cargandoPedidos =
        true;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
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


        if (!contenedorPedidos) {
            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            contenedorPedidos.innerHTML = `
                <div class="sin-pedidos">
                    <p>
                        👻 No hay pedidos todavía.
                    </p>
                </div>
            `;

        } else {

            contenedorPedidos.innerHTML =
                data
                    .map(
                        renderizarPedido
                    )
                    .join("");
        }


        /*
         * La consulta a Supabase funcionó.
         */

        if (!realtimeConectado) {
            actualizarEstadoConexion(true);
        }


        console.log(
            `📦 ${data?.length || 0} pedido(s) cargado(s)`
        );


    } catch (error) {

        console.error(
            "❌ Error al cargar pedidos:",
            error
        );


        actualizarEstadoConexion(
            false
        );


        if (contenedorPedidos) {

            contenedorPedidos.innerHTML = `
                <div class="sin-pedidos">
                    <p>
                        ⚠️ No se pudieron cargar los pedidos.
                    </p>

                    <button
                        type="button"
                        onclick="cargarPedidos()"
                    >
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }

    } finally {

        cargandoPedidos =
            false;


        /*
         * Si llegó otro cambio mientras
         * estábamos cargando, hacemos
         * una segunda carga.
         */

        if (
            actualizacionPendiente
        ) {

            actualizacionPendiente =
                false;

            cargarPedidos();
        }
    }
}


/* =========================================================
   12. CAMBIAR ESTADO
   ========================================================= */

async function manejarCambioEstado(
    evento
) {

    const boton =
        evento.target.closest(
            ".btn-cambiar-estado"
        );


    if (!boton) {
        return;
    }


    const id =
        boton.dataset.id;


    const nuevoEstado =
        boton.dataset.estado;


    if (
        !id ||
        !nuevoEstado
    ) {

        console.error(
            "❌ Faltan datos para cambiar el estado.",
            {
                id,
                nuevoEstado
            }
        );

        return;
    }


    /*
     * Guardamos el texto original.
     */

    const textoOriginal =
        boton.textContent;


    /*
     * Bloqueamos únicamente este botón.
     */

    boton.disabled =
        true;

    boton.textContent =
        "Actualizando...";


    try {

        console.log(
            `🔄 Actualizando pedido #${id}...`
        );


        const {
            error
        } =
            await supabaseClient
                .from("pedidos")
                .update({
                    estado:
                        nuevoEstado
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        console.log(
            `✅ Pedido #${id} actualizado a "${nuevoEstado}"`
        );


        /*
         * IMPORTANTE:
         *
         * NO usamos:
         *
         * await cargarPedidos();
         *
         * porque eso hacía que el botón
         * permaneciera en "Actualizando..."
         * mientras se descargaban todos
         * los pedidos nuevamente.
         *
         * Realtime detectará el UPDATE.
         */

        cargarPedidos();


        /*
         * Liberamos el botón inmediatamente
         * después de confirmar el UPDATE.
         */

        boton.disabled =
            false;

        boton.textContent =
            textoOriginal;


    } catch (error) {

        console.error(
            "❌ Error al cambiar estado:",
            error
        );


        alert(
            "❌ No se pudo actualizar el estado del pedido."
        );


        boton.disabled =
            false;

        boton.textContent =
            textoOriginal;
    }
}


/* =========================================================
   13. COMPATIBILIDAD
   ========================================================= */

/*
 * Esta función permite que cualquier parte
 * antigua del código que utilice cambiarEstado()
 * siga funcionando.
 */

async function cambiarEstado(
    id,
    nuevoEstado,
    boton = null
) {

    if (!id || !nuevoEstado) {
        return;
    }


    const textoOriginal =
        boton
            ? boton.textContent
            : "";


    if (boton) {

        boton.disabled =
            true;

        boton.textContent =
            "Actualizando...";
    }


    try {

        console.log(
            `🔄 Actualizando pedido #${id}...`
        );


        const {
            error
        } =
            await supabaseClient
                .from("pedidos")
                .update({
                    estado:
                        nuevoEstado
                })
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        console.log(
            `✅ Pedido #${id} actualizado a "${nuevoEstado}"`
        );


        cargarPedidos();


        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                textoOriginal;
        }


    } catch (error) {

        console.error(
            "❌ Error al cambiar estado:",
            error
        );


        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                textoOriginal;
        }


        alert(
            "❌ No se pudo actualizar el estado del pedido."
        );
    }
}


/* =========================================================
   14. SUPABASE REALTIME
   ========================================================= */

function iniciarRealtime() {

    /*
     * Si ya existe un canal,
     * lo eliminamos antes de crear otro.
     */

    if (canalPedidos) {

        supabaseClient.removeChannel(
            canalPedidos
        );

        canalPedidos =
            null;
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
                     * Volvemos a cargar la lista
                     * solamente cuando Supabase
                     * confirma que hubo un cambio.
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
                            "✅ Supabase Realtime conectado."
                        );
                    }


                    else if (
                        status ===
                            "CHANNEL_ERROR" ||
                        status ===
                            "TIMED_OUT" ||
                        status ===
                            "CLOSED"
                    ) {

                        realtimeConectado =
                            false;

                        actualizarEstadoConexion(
                            false
                        );


                        console.warn(
                            "⚠️ Realtime desconectado. Se utilizará el respaldo."
                        );
                    }
                }
            );
}


/* =========================================================
   15. RESPALDO AUTOMÁTICO
   ========================================================= */

function iniciarRespaldo() {

    /*
     * Evitamos crear más de un intervalo.
     */

    if (intervaloRespaldo) {

        clearInterval(
            intervaloRespaldo
        );
    }


    intervaloRespaldo =
        setInterval(
            () => {

                /*
                 * Mientras Realtime funcione,
                 * NO hacemos consultas periódicas.
                 */

                if (
                    !realtimeConectado
                ) {

                    console.log(
                        "🔄 Realtime no disponible. Ejecutando respaldo..."
                    );


                    cargarPedidos();
                }

            },
            INTERVALO_RESPALDO
        );
}


/* =========================================================
   16. EVENT DELEGATION
   ========================================================= */

/*
 * En lugar de agregar un listener a cada
 * botón cada vez que se renderiza la lista,
 * utilizamos un único listener.
 *
 * Esto reduce trabajo del navegador.
 */

if (contenedorPedidos) {

    contenedorPedidos.addEventListener(
        "click",
        manejarCambioEstado
    );
}


/* =========================================================
   17. INICIO DEL ADMIN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 GRINGA.EXE Admin iniciado."
        );


        /*
         * Carga inicial.
         */

        cargarPedidos();


        /*
         * Conexión Realtime.
         */

        iniciarRealtime();


        /*
         * Respaldo cada 15 segundos
         * solamente si Realtime falla.
         */

        iniciarRespaldo();
    }
);