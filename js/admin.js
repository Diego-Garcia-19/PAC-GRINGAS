javascript
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


        contenedorPedidos.innerHTML =
            data
                .map(renderizarPedido)
                .join("");


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
   8. SUBTOTAL DEL PRODUCTO
   ========================================================= */

function obtenerSubtotalProducto(producto) {

    if (!producto) {
        return 0;
    }


    /*
     * PRIORIDAD:
     * Si el subtotal ya fue guardado al realizar
     * el pedido, se utiliza exactamente ese valor.
     *
     * Esto evita que el administrador vuelva a
     * calcular precios de pedidos existentes.
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
     *
     * Si el pedido no tiene subtotal guardado,
     * utilizamos los datos disponibles para
     * reconstruir el subtotal.
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
     *
     * Se intenta utilizar primero el precio
     * aplicado durante el pedido.
     *
     * Se aceptan ambos nombres para mantener
     * compatibilidad:
     *
     * precioAplicado
     * precio_aplicado
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
     *
     * Precio base + salsa extra + queso extra.
     */

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


    let detalles =
        `x${cantidad}`;


    /*
     * Mostrar salsas seleccionadas.
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
     * Mostrar salsa extra.
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
     * Mostrar queso extra.
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
     * Mostrar promoción de fresco.
     *
     * Se aceptan:
     * precioAplicado
     * precio_aplicado
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
   10. CAMBIAR ESTADO
   ========================================================= */

async function manejarCambioEstado(evento) {

    const boton =
        evento.currentTarget;

    if (!boton) {
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
         * IMPORTANTE:
         *
         * AQUÍ NO reproducimos sonido.
         *
         * El sonido será responsabilidad del
         * dispositivo del cliente mediante
         * Supabase Realtime.
         */


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
```

Este reemplaza **completo** al anterior. No necesitas mezclar partes.

Después de guardarlo, **recarga el admin con `Ctrl + F5`** y revisamos la consola. Si carga los pedidos correctamente, el siguiente paso será atacar el `[Violation] 'click' handler took 1303ms` y la actualización cada 5 segundos.
