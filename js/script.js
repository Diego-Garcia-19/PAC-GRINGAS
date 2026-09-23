/* =========================================================
   GRINGA.EXE - SISTEMA DE PEDIDOS
   Archivo: js/script.js
   Función: Sistema del cliente
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
   3. CONFIGURACIÓN DE NOTIFICACIÓN
   ========================================================= */

const STORAGE_PEDIDO_CLIENTE =
    "gringa_pedido_cliente";

let canalPedidoCliente = null;

let audioContextCliente = null;


/* =========================================================
   4. ESTADO GLOBAL DEL PEDIDO
   ========================================================= */

let pedido = [];

let gringaSeleccionada = null;

let nombreCliente = "";

let procesandoPedido = false;


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

    return numeroSeguro(valor).toFixed(2);
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


function mostrarTransicion(accion = "") {

    const transicion =
        document.getElementById(
            "pacman-transicion"
        );

    if (!transicion) {
        return;
    }

    transicion.classList.add("activa");

    if (typeof accion === "function") {

        setTimeout(
            accion,
            350
        );
    }

    setTimeout(
        () => {

            transicion.classList.remove(
                "activa"
            );

        },
        1900
    );
}


function buscarProducto(
    nombre,
    tipo
) {

    return pedido.find(
        producto =>
            producto.nombre === nombre &&
            producto.tipo === tipo
    );
}


/* =========================================================
   6. NOTIFICACIÓN DEL CLIENTE
   ========================================================= */

/*
 * Creamos un sonido directamente con Web Audio.
 *
 * IMPORTANTE:
 * Este sonido se ejecuta en el navegador del CLIENTE,
 * no en el administrador.
 */

async function prepararAudioCliente() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        if (!audioContextCliente) {

            audioContextCliente =
                new AudioContext();
        }

        if (
            audioContextCliente.state ===
            "suspended"
        ) {

            await audioContextCliente.resume();
        }

    } catch (error) {

        console.warn(
            "⚠️ No se pudo preparar el audio:",
            error
        );
    }
}


async function reproducirSonidoPedidoEntregado() {

    try {

        await prepararAudioCliente();

        if (!audioContextCliente) {
            return;
        }

        const ahora =
            audioContextCliente.currentTime;


        const oscilador =
            audioContextCliente.createOscillator();

        const ganancia =
            audioContextCliente.createGain();


        oscilador.type =
            "sine";


        oscilador.frequency.setValueAtTime(
            659,
            ahora
        );

        oscilador.frequency.setValueAtTime(
            880,
            ahora + 0.12
        );

        oscilador.frequency.setValueAtTime(
            1174,
            ahora + 0.24
        );


        ganancia.gain.setValueAtTime(
            0.0001,
            ahora
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.22,
            ahora + 0.03
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.0001,
            ahora + 0.55
        );


        oscilador.connect(
            ganancia
        );

        ganancia.connect(
            audioContextCliente.destination
        );


        oscilador.start(
            ahora
        );

        oscilador.stop(
            ahora + 0.55
        );


    } catch (error) {

        console.warn(
            "⚠️ No se pudo reproducir el sonido:",
            error
        );
    }
}


/* =========================================================
   7. AVISO VISUAL AL CLIENTE
   ========================================================= */

function mostrarAvisoPedidoEntregado(
    numero
) {

    const numeroFormateado =
        String(numero)
            .padStart(3, "0");


    const avisoExistente =
        document.getElementById(
            "aviso-pedido-entregado"
        );


    if (avisoExistente) {

        avisoExistente.remove();
    }


    const aviso =
        document.createElement(
            "div"
        );


    aviso.id =
        "aviso-pedido-entregado";


    aviso.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                z-index:99999;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(0,0,0,.82);
                padding:20px;
            "
        >

            <div
                style="
                    width:min(500px,100%);
                    background:#111;
                    border:4px solid #ffe600;
                    box-shadow:0 0 35px rgba(255,230,0,.55);
                    padding:35px 25px;
                    text-align:center;
                    font-family:monospace;
                "
            >

                <div
                    style="
                        font-size:55px;
                        margin-bottom:15px;
                    "
                >
                    🍔
                </div>


                <h2
                    style="
                        color:#ffe600;
                        margin:0 0 15px;
                        font-size:28px;
                    "
                >
                    ¡PEDIDO LISTO!
                </h2>


                <p
                    style="
                        color:white;
                        font-size:18px;
                        margin:10px 0;
                    "
                >
                    Tu pedido
                    <strong>
                        #${escaparHTML(
                            numeroFormateado
                        )}
                    </strong>
                    ha sido entregado.
                </p>


                <button
                    id="cerrar-aviso-entregado"
                    style="
                        margin-top:20px;
                        padding:14px 25px;
                        border:3px solid #ffe600;
                        background:#ffe600;
                        color:#111;
                        font-weight:bold;
                        cursor:pointer;
                        font-family:monospace;
                        font-size:16px;
                    "
                >
                    ¡OK!
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        aviso
    );


    const botonCerrar =
        document.getElementById(
            "cerrar-aviso-entregado"
        );


    if (botonCerrar) {

        botonCerrar.addEventListener(
            "click",
            () => {

                aviso.remove();

            }
        );
    }


    /*
     * También intentamos una notificación
     * del navegador si el usuario la permitió.
     */

    intentarNotificacionNavegador(
        numeroFormateado
    );
}


/* =========================================================
   8. NOTIFICACIÓN DEL NAVEGADOR
   ========================================================= */

function intentarNotificacionNavegador(
    numero
) {

    if (
        !("Notification" in window)
    ) {
        return;
    }


    if (
        Notification.permission ===
        "granted"
    ) {

        try {

            new Notification(
                "GRINGA.EXE 🍔",
                {
                    body:
                        `Tu pedido #${numero} ha sido entregado.`,
                    icon:
                        "img/logo1.png"
                }
            );

        } catch (error) {

            console.warn(
                "⚠️ No se pudo mostrar notificación:",
                error
            );
        }
    }
}


/* =========================================================
   9. ESCUCHAR EL PEDIDO DEL CLIENTE
   ========================================================= */

function obtenerPedidoGuardado() {

    try {

        const guardado =
            localStorage.getItem(
                STORAGE_PEDIDO_CLIENTE
            );


        if (!guardado) {
            return null;
        }


        const numero =
            Number(
                guardado
            );


        return Number.isFinite(numero)
            ? numero
            : null;

    } catch (error) {

        console.warn(
            "⚠️ No se pudo leer el pedido guardado:",
            error
        );

        return null;
    }
}


/* =========================================================
   10. GUARDAR PEDIDO DEL CLIENTE
   ========================================================= */

function guardarPedidoCliente(
    idPedido
) {

    try {

        localStorage.setItem(
            STORAGE_PEDIDO_CLIENTE,
            String(idPedido)
        );

        console.log(
            "📱 Pedido asociado a este dispositivo:",
            idPedido
        );

    } catch (error) {

        console.warn(
            "⚠️ No se pudo guardar el pedido:",
            error
        );
    }
}


/* =========================================================
   11. ESCUCHAR CAMBIOS EN SUPABASE REALTIME
   ========================================================= */

function escucharPedidoCliente(
    idPedido
) {

    if (!idPedido) {
        return;
    }


    /*
     * Si ya existe un canal anterior,
     * lo eliminamos.
     */

    if (canalPedidoCliente) {

        supabaseClient.removeChannel(
            canalPedidoCliente
        );

        canalPedidoCliente = null;
    }


    console.log(
        `📡 Escuchando cambios del pedido #${idPedido}`
    );


    canalPedidoCliente =
        supabaseClient
            .channel(
                `pedido-cliente-${idPedido}`
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "pedidos",
                    filter:
                        `id=eq.${idPedido}`
                },
                async payload => {

                    console.log(
                        "📡 Cambio recibido:",
                        payload
                    );


                    const nuevoEstado =
                        payload.new?.estado;


                    const estadoAnterior =
                        payload.old?.estado;


                    console.log(
                        `📦 Estado: ${estadoAnterior} → ${nuevoEstado}`
                    );


                    /*
                     * SOLO reaccionamos cuando
                     * realmente pasa a Entregado.
                     */

                    if (
                        nuevoEstado ===
                            "Entregado" &&
                        estadoAnterior !==
                            "Entregado"
                    ) {

                        console.log(
                            "🔔 ¡TU PEDIDO ESTÁ ENTREGADO!"
                        );


                        await reproducirSonidoPedidoEntregado();


                        mostrarAvisoPedidoEntregado(
                            payload.new
                                ?.numero_pedido ||
                            idPedido
                        );
                    }

                }
            )
            .subscribe(
                estado => {

                    console.log(
                        `📡 Realtime pedido #${idPedido}:`,
                        estado
                    );

                }
            );
}


/* =========================================================
   12. RESTAURAR ESCUCHA DEL PEDIDO
   ========================================================= */

function restaurarEscuchaPedidoCliente() {

    const idPedido =
        obtenerPedidoGuardado();


    if (!idPedido) {

        console.log(
            "📱 Este dispositivo todavía no tiene un pedido activo."
        );

        return;
    }


    console.log(
        `📱 Restaurando pedido #${idPedido}`
    );


    escucharPedidoCliente(
        idPedido
    );
}


/* =========================================================
   13. REFERENCIAS DOM
   ========================================================= */

// Modal de salsas

const ventanaSalsas =
    document.getElementById(
        "ventana-salsas"
    );

const cerrarSalsas =
    document.getElementById(
        "cerrar-salsas"
    );

const salsaGringaNombre =
    document.getElementById(
        "salsa-gringa-nombre"
    );

const salsa1 =
    document.getElementById(
        "salsa-1"
    );

const salsa2 =
    document.getElementById(
        "salsa-2"
    );

const contenedorSalsa2 =
    document.getElementById(
        "contenedor-salsa-2"
    );

const agregarSegundaSalsa =
    document.getElementById(
        "agregar-segunda-salsa"
    );

const mensajeSalsa =
    document.getElementById(
        "mensaje-salsa"
    );

const precioSalsas =
    document.getElementById(
        "precio-salsas"
    );

const extraQuesoCheckbox =
    document.getElementById(
        "extra-queso-checkbox"
    );

const precioQueso =
    document.getElementById(
        "precio-queso"
    );

const confirmarGringa =
    document.getElementById(
        "confirmar-gringa"
    );


// Modal del pedido

const ventanaPedido =
    document.getElementById(
        "ventana-pedido"
    );

const cerrarPedido =
    document.getElementById(
        "cerrar-pedido"
    );

const listaProductos =
    document.getElementById(
        "lista-productos"
    );

const ventanaTotal =
    document.getElementById(
        "ventana-total"
    );

const confirmarPedido =
    document.getElementById(
        "confirmar-pedido"
    );


// Barra inferior

const cantidadPedido =
    document.getElementById(
        "cantidad-pedido"
    );

const totalPedido =
    document.getElementById(
        "total-pedido"
    );

const verPedido =
    document.getElementById(
        "ver-pedido"
    );


// Checkout

const ventanaCheckout =
    document.getElementById(
        "ventana-checkout"
    );

const cerrarCheckout =
    document.getElementById(
        "cerrar-checkout"
    );

const checkoutProductos =
    document.getElementById(
        "checkout-productos"
    );

const checkoutTotal =
    document.getElementById(
        "checkout-total"
    );

const botonesMetodoPago =
    document.querySelectorAll(
        ".metodo-pago-btn"
    );

const pagoEfectivo =
    document.getElementById(
        "pago-efectivo"
    );

const dineroRecibido =
    document.getElementById(
        "dinero-recibido"
    );

const cambioPago =
    document.getElementById(
        "cambio-pago"
    );

const pagoTransferencia =
    document.getElementById(
        "pago-transferencia"
    );

const finalizarPedido =
    document.getElementById(
        "finalizar-pedido"
    );


// Confirmación

const ventanaConfirmacion =
    document.getElementById(
        "ventana-confirmacion"
    );

const numeroPedido =
    document.getElementById(
        "numero-pedido"
    );

const confirmacionTotal =
    document.getElementById(
        "confirmacion-total"
    );

const confirmacionEfectivo =
    document.getElementById(
        "confirmacion-efectivo"
    );

const confirmacionCambio =
    document.getElementById(
        "confirmacion-cambio"
    );

const detalleEfectivo =
    document.getElementById(
        "detalle-efectivo"
    );

const detalleCambio =
    document.getElementById(
        "detalle-cambio"
    );

const detalleTransferencia =
    document.getElementById(
        "detalle-transferencia"
    );

const cerrarConfirmacion =
    document.getElementById(
        "cerrar-confirmacion"
    );


/* =========================================================
   14. CANTIDADES
   ========================================================= */

function obtenerCantidadGringas() {

    return pedido
        .filter(
            producto =>
                producto.tipo === "gringa"
        )
        .reduce(
            (total, producto) =>
                total +
                numeroSeguro(
                    producto.cantidad
                ),
            0
        );
}


function obtenerCantidadFrescos() {

    return pedido
        .filter(
            producto =>
                producto.tipo === "fresco"
        )
        .reduce(
            (total, producto) =>
                total +
                numeroSeguro(
                    producto.cantidad
                ),
            0
        );
}


/* =========================================================
   15. ACTUALIZAR PRECIOS DE FRESCOS
   ========================================================= */

function actualizarPreciosFrescos() {

    const cantidadGringas =
        obtenerCantidadGringas();

    let unidadesConDescuento = 0;


    pedido.forEach(
        producto => {

            if (
                producto.tipo !==
                "fresco"
            ) {
                return;
            }


            const cantidad =
                numeroSeguro(
                    producto.cantidad
                );


            producto.precioAplicado =
                PRECIOS.frescoIndividual;


            if (
                cantidadGringas > 0
            ) {

                const disponibles =
                    PRECIOS
                        .cantidadFrescosConDescuento -
                    unidadesConDescuento;


                const descontadas =
                    Math.max(
                        0,
                        Math.min(
                            cantidad,
                            disponibles
                        )
                    );


                producto.precioAplicado =
                    cantidad > 0 &&
                    descontadas > 0

                        ? (
                            (
                                descontadas *
                                PRECIOS
                                    .frescoConGringa
                            ) +
                            (
                                (
                                    cantidad -
                                    descontadas
                                ) *
                                PRECIOS
                                    .frescoIndividual
                            )
                        ) / cantidad

                        : PRECIOS
                            .frescoIndividual;


                unidadesConDescuento +=
                    descontadas;
            }
        }
    );
}


/* =========================================================
   16. PRECIO TOTAL DE FRESCOS
   ========================================================= */

function obtenerTotalFrescos() {

    actualizarPreciosFrescos();


    return pedido
        .filter(
            producto =>
                producto.tipo ===
                "fresco"
        )
        .reduce(
            (
                total,
                producto
            ) => {

                const precio =
                    numeroSeguro(
                        producto.precioAplicado
                    );


                const cantidad =
                    numeroSeguro(
                        producto.cantidad
                    );


                return total +
                    (
                        precio *
                        cantidad
                    );

            },
            0
        );
}


/* =========================================================
   17. PRECIO TOTAL DE GRINGAS
   ========================================================= */

function obtenerTotalGringas() {

    return pedido
        .filter(
            producto =>
                producto.tipo ===
                "gringa"
        )
        .reduce(
            (
                total,
                producto
            ) => {

                const precioBase =
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


                const cantidad =
                    numeroSeguro(
                        producto.cantidad
                    );


                const precioUnitario =
                    precioBase +
                    extraSalsa +
                    extraQueso;


                return total +
                    (
                        precioUnitario *
                        cantidad
                    );

            },
            0
        );
}


/* =========================================================
   18. TOTAL GENERAL
   ========================================================= */

function obtenerTotalPedido() {

    return (
        obtenerTotalGringas() +
        obtenerTotalFrescos()
    );
}


/* =========================================================
   19. CANTIDAD TOTAL
   ========================================================= */

function obtenerCantidadTotalPedido() {

    return pedido.reduce(
        (
            total,
            producto
        ) =>
            total +
            numeroSeguro(
                producto.cantidad
            ),
        0
    );
}


/* =========================================================
   20. ACTUALIZAR CARRITO
   ========================================================= */

function actualizarPedido() {

    if (
        !cantidadPedido ||
        !totalPedido ||
        !listaProductos
    ) {
        return;
    }


    actualizarPreciosFrescos();


    const cantidadTotal =
        obtenerCantidadTotalPedido();


    const total =
        obtenerTotalPedido();


    cantidadPedido.textContent =
        cantidadTotal;


    totalPedido.textContent =
        `$${dinero(total)}`;


    if (ventanaTotal) {

        ventanaTotal.textContent =
            `$${dinero(total)}`;
    }


    if (
        pedido.length === 0
    ) {

        listaProductos.innerHTML = `

            <div class="pedido-vacio">

                <p>
                    👻 Tu carrito está vacío.
                </p>

                <p>
                    Agrega una gringa para comenzar.
                </p>

            </div>

        `;

        return;
    }


    listaProductos.innerHTML =
        pedido
            .map(
                (
                    producto,
                    indice
                ) => {

                    const cantidad =
                        numeroSeguro(
                            producto.cantidad
                        );


                    let subtotal = 0;

                    let detalles = "";


                    if (
                        producto.tipo ===
                        "gringa"
                    ) {

                        const precioUnitario =
                            numeroSeguro(
                                producto.precio
                            ) +
                            numeroSeguro(
                                producto.extraSalsa
                            ) +
                            numeroSeguro(
                                producto.extraQueso
                            );


                        subtotal =
                            precioUnitario *
                            cantidad;


                        if (
                            Array.isArray(
                                producto.salsas
                            ) &&
                            producto.salsas.length > 0
                        ) {

                            detalles += `
                                <small>
                                    🌶️ ${escaparHTML(
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
                        producto.tipo ===
                        "fresco"
                    ) {

                        const precioAplicado =
                            numeroSeguro(
                                producto.precioAplicado
                            );


                        subtotal =
                            precioAplicado *
                            cantidad;


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

                            <div
                                class="producto-pedido-info"
                            >

                                <strong>
                                    ${escaparHTML(
                                        producto.nombre
                                    )}
                                </strong>

                                ${detalles}

                                <span>
                                    $${dinero(
                                        subtotal
                                    )}
                                </span>

                            </div>


                            <div
                                class="controles-cantidad"
                            >

                                <button
                                    type="button"
                                    onclick="disminuirCantidad(${indice})"
                                >
                                    −
                                </button>

                                <span>
                                    ${cantidad}
                                </span>

                                <button
                                    type="button"
                                    onclick="aumentarCantidad(${indice})"
                                >
                                    +
                                </button>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   21. CONTROL DE CANTIDADES
   ========================================================= */

function aumentarCantidad(
    indice
) {

    if (!pedido[indice]) {
        return;
    }


    pedido[indice].cantidad =
        numeroSeguro(
            pedido[indice].cantidad
        ) + 1;


    actualizarPedido();
}


function disminuirCantidad(
    indice
) {

    if (!pedido[indice]) {
        return;
    }


    pedido[indice].cantidad =
        numeroSeguro(
            pedido[indice].cantidad
        ) - 1;


    if (
        pedido[indice].cantidad <= 0
    ) {

        pedido.splice(
            indice,
            1
        );
    }


    actualizarPedido();
}


/* =========================================================
   22. CONFIGURACIÓN DE GRINGAS
   ========================================================= */

document
    .querySelectorAll(
        ".btn-gringa"
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                async () => {

                    /*
                     * Aprovechamos cualquier interacción
                     * del usuario para preparar el audio.
                     */

                    prepararAudioCliente();


                    const producto =
                        boton.closest(
                            ".producto"
                        );


                    if (!producto) {
                        return;
                    }


                    const nombre =
                        producto
                            .querySelector("h4")
                            ?.textContent
                            .trim() ||
                        "Gringa";


                    const precio =
                        numeroSeguro(
                            producto.dataset.precio
                        );


                    gringaSeleccionada = {

                        nombre,

                        precio,

                        producto
                    };


                    if (salsa1) {
                        salsa1.value = "";
                    }


                    if (salsa2) {
                        salsa2.value = "";
                    }


                    if (contenedorSalsa2) {

                        contenedorSalsa2.style.display =
                            "none";
                    }


                    if (agregarSegundaSalsa) {

                        agregarSegundaSalsa.style.display =
                            "";
                    }


                    if (mensajeSalsa) {

                        mensajeSalsa.textContent =
                            "";
                    }


                    if (precioSalsas) {

                        precioSalsas.textContent =
                            "$0.00";
                    }


                    if (extraQuesoCheckbox) {

                        extraQuesoCheckbox.checked =
                            false;
                    }


                    if (precioQueso) {

                        precioQueso.textContent =
                            "$0.00";
                    }


                    if (salsaGringaNombre) {

                        salsaGringaNombre.textContent =
                            nombre;
                    }


                    if (ventanaSalsas) {

                        ventanaSalsas.classList.add(
                            "activa"
                        );
                    }


                    mostrarTransicion();
                }
            );
        }
    );


/* =========================================================
   23. EXTRA QUESO
   ========================================================= */

if (
    extraQuesoCheckbox
) {

    extraQuesoCheckbox.addEventListener(
        "change",
        () => {

            if (
                extraQuesoCheckbox.checked
            ) {

                if (precioQueso) {

                    precioQueso.textContent =
                        `+$${dinero(
                            PRECIOS.extraQueso
                        )}`;
                }

            } else {

                if (precioQueso) {

                    precioQueso.textContent =
                        "$0.00";
                }
            }
        }
    );
}


/* =========================================================
   24. SEGUNDA SALSA
   ========================================================= */

if (
    agregarSegundaSalsa
) {

    agregarSegundaSalsa.addEventListener(
        "click",
        () => {

            if (
                !salsa1 ||
                !salsa1.value
            ) {

                if (mensajeSalsa) {

                    mensajeSalsa.textContent =
                        "⚠️ Primero selecciona la primera salsa.";
                }

                return;
            }


            if (contenedorSalsa2) {

                contenedorSalsa2.style.display =
                    "block";
            }


            agregarSegundaSalsa.style.display =
                "none";


            if (precioSalsas) {

                precioSalsas.textContent =
                    `+$${dinero(
                        PRECIOS.segundaSalsa
                    )}`;
            }


            if (mensajeSalsa) {

                mensajeSalsa.textContent =
                    "";
            }
        }
    );
}


/* =========================================================
   25. VALIDACIÓN DE SEGUNDA SALSA
   ========================================================= */

if (salsa2) {

    salsa2.addEventListener(
        "change",
        () => {

            if (
                salsa1 &&
                salsa1.value &&
                salsa2.value &&
                salsa1.value ===
                    salsa2.value
            ) {

                salsa2.value = "";


                if (mensajeSalsa) {

                    mensajeSalsa.textContent =
                        "⚠️ No puedes seleccionar la misma salsa dos veces.";
                }


                return;
            }


            if (mensajeSalsa) {

                mensajeSalsa.textContent =
                    "";
            }
        }
    );
}


/* =========================================================
   26. CONFIRMAR GRINGA
   ========================================================= */

if (
    confirmarGringa
) {

    confirmarGringa.addEventListener(
        "click",
        () => {

            if (
                !gringaSeleccionada
            ) {
                return;
            }


            const salsas = [];


            if (
                salsa1 &&
                salsa1.value
            ) {

                salsas.push(
                    salsa1.value
                );
            }


            if (
                salsa2 &&
                salsa2.value &&
                !salsas.includes(
                    salsa2.value
                )
            ) {

                salsas.push(
                    salsa2.value
                );
            }


            if (
                salsa2 &&
                salsa2.value &&
                salsa1 &&
                salsa1.value ===
                    salsa2.value
            ) {

                if (mensajeSalsa) {

                    mensajeSalsa.textContent =
                        "⚠️ Las salsas deben ser diferentes.";
                }


                return;
            }


            const tieneSegundaSalsa =
                salsas.length >= 2;


            const extraSalsa =
                tieneSegundaSalsa
                    ? PRECIOS.segundaSalsa
                    : 0;


            const extraQueso =
                extraQuesoCheckbox?.checked
                    ? PRECIOS.extraQueso
                    : 0;


            const nuevoProducto = {

                nombre:
                    gringaSeleccionada.nombre,

                precio:
                    gringaSeleccionada.precio,

                cantidad:
                    1,

                tipo:
                    "gringa",

                salsas,

                extraSalsa,

                extraQueso
            };


            pedido.push(
                nuevoProducto
            );


            actualizarPedido();


            gringaSeleccionada =
                null;


            if (ventanaSalsas) {

                ventanaSalsas.classList.remove(
                    "activa"
                );
            }


            mostrarTransicion();
        }
    );
}


/* =========================================================
   27. CERRAR MODAL DE SALSAS
   ========================================================= */

if (
    cerrarSalsas
) {

    cerrarSalsas.addEventListener(
        "click",
        () => {

            if (ventanaSalsas) {

                ventanaSalsas.classList.remove(
                    "activa"
                );
            }


            gringaSeleccionada =
                null;
        }
    );
}


/* =========================================================
   28. FRESCOS
   ========================================================= */

document
    .querySelectorAll(
        '.producto[data-tipo="fresco"] button'
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    prepararAudioCliente();


                    const producto =
                        boton.closest(
                            ".producto"
                        );


                    if (!producto) {
                        return;
                    }


                    const nombre =
                        producto
                            .querySelector("h4")
                            ?.textContent
                            .trim() ||
                        "Fresco";


                    const precio =
                        numeroSeguro(
                            producto.dataset.precio
                        ) ||
                        PRECIOS
                            .frescoIndividual;


                    const existente =
                        buscarProducto(
                            nombre,
                            "fresco"
                        );


                    if (existente) {

                        existente.cantidad =
                            numeroSeguro(
                                existente.cantidad
                            ) + 1;

                    } else {

                        pedido.push({

                            nombre,

                            precio,

                            precioAplicado:
                                precio,

                            cantidad:
                                1,

                            tipo:
                                "fresco"
                        });
                    }


                    actualizarPedido();


                    mostrarTransicion();
                }
            );
        }
    );


/* =========================================================
   29. MODAL DEL PEDIDO
   ========================================================= */

if (
    verPedido
) {

    verPedido.addEventListener(
        "click",
        () => {

            actualizarPedido();


            if (ventanaPedido) {

                ventanaPedido.classList.add(
                    "activa"
                );
            }
        }
    );
}


if (
    cerrarPedido
) {

    cerrarPedido.addEventListener(
        "click",
        () => {

            if (ventanaPedido) {

                ventanaPedido.classList.remove(
                    "activa"
                );
            }
        }
    );
}


/* =========================================================
   30. ABRIR CHECKOUT
   ========================================================= */

function abrirCheckout() {

    if (
        pedido.length === 0
    ) {

        alert(
            "👻 Tu pedido está vacío."
        );

        return;
    }


    if (!checkoutProductos) {
        return;
    }


    actualizarPreciosFrescos();


    checkoutProductos.innerHTML =
        pedido
            .map(
                producto => {

                    const cantidad =
                        numeroSeguro(
                            producto.cantidad
                        );


                    let subtotal = 0;

                    let detalles = "";


                    if (
                        producto.tipo ===
                        "gringa"
                    ) {

                        const precioUnitario =
                            numeroSeguro(
                                producto.precio
                            ) +
                            numeroSeguro(
                                producto.extraSalsa
                            ) +
                            numeroSeguro(
                                producto.extraQueso
                            );


                        subtotal =
                            precioUnitario *
                            cantidad;


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
                                </small>
                            `;
                        }

                    }


                    else if (
                        producto.tipo ===
                        "fresco"
                    ) {

                        const precioAplicado =
                            numeroSeguro(
                                producto.precioAplicado
                            );


                        subtotal =
                            precioAplicado *
                            cantidad;


                        detalles = `
                            <small>
                                🥤 $${dinero(
                                    precioAplicado
                                )} c/u
                            </small>
                        `;
                    }


                    return `

                        <div class="checkout-producto">

                            <div>

                                <strong>
                                    ${escaparHTML(
                                        producto.nombre
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
            )
            .join("");


    const total =
        obtenerTotalPedido();


    if (
        checkoutTotal
    ) {

        checkoutTotal.textContent =
            `$${dinero(total)}`;
    }


    if (
        pagoEfectivo
    ) {

        pagoEfectivo.style.display =
            "none";
    }


    if (
        pagoTransferencia
    ) {

        pagoTransferencia.style.display =
            "none";
    }


    if (
        dineroRecibido
    ) {

        dineroRecibido.value =
            "";
    }


    if (
        cambioPago
    ) {

        cambioPago.textContent =
            "";
    }


    if (
        finalizarPedido
    ) {

        finalizarPedido.disabled =
            true;

        finalizarPedido.textContent =
            "FINALIZAR PEDIDO";
    }


    if (
        ventanaCheckout
    ) {

        ventanaCheckout.classList.add(
            "activa"
        );
    }
}


/* =========================================================
   31. CONFIRMAR NOMBRE DEL CLIENTE
   ========================================================= */

if (
    confirmarPedido
) {

    confirmarPedido.addEventListener(
        "click",
        () => {

            if (
                pedido.length === 0
            ) {

                alert(
                    "👻 Agrega productos antes de continuar."
                );

                return;
            }


            const nombre =
                prompt(
                    "👤 Ingresa tu nombre:"
                );


            if (!nombre) {
                return;
            }


            nombreCliente =
                nombre.trim();


            if (!nombreCliente) {

                alert(
                    "⚠️ Debes ingresar un nombre."
                );

                return;
            }


            if (
                ventanaPedido
            ) {

                ventanaPedido.classList.remove(
                    "activa"
                );
            }


            mostrarTransicion(
                () => {

                    abrirCheckout();

                }
            );
        }
    );
}


/* =========================================================
   32. CERRAR CHECKOUT
   ========================================================= */

if (
    cerrarCheckout
) {

    cerrarCheckout.addEventListener(
        "click",
        () => {

            if (
                ventanaCheckout
            ) {

                ventanaCheckout.classList.remove(
                    "activa"
                );
            }
        }
    );
}


/* =========================================================
   33. MÉTODOS DE PAGO
   ========================================================= */

botonesMetodoPago.forEach(
    boton => {

        boton.addEventListener(
            "click",
            () => {

                prepararAudioCliente();


                const metodo =
                    boton.dataset.metodo;


                botonesMetodoPago.forEach(
                    btn => {

                        btn.classList.remove(
                            "activo"
                        );
                    }
                );


                boton.classList.add(
                    "activo"
                );


                if (
                    metodo ===
                    "efectivo"
                ) {

                    if (
                        pagoEfectivo
                    ) {

                        pagoEfectivo.style.display =
                            "block";
                    }


                    if (
                        pagoTransferencia
                    ) {

                        pagoTransferencia.style.display =
                            "none";
                    }


                    if (
                        finalizarPedido
                    ) {

                        finalizarPedido.disabled =
                            true;
                    }


                    setTimeout(
                        () => {

                            if (
                                dineroRecibido
                            ) {

                                dineroRecibido.focus();
                            }

                        },
                        100
                    );

                }


                else if (
                    metodo ===
                    "transferencia"
                ) {

                    if (
                        pagoEfectivo
                    ) {

                        pagoEfectivo.style.display =
                            "none";
                    }


                    if (
                        pagoTransferencia
                    ) {

                        pagoTransferencia.style.display =
                            "block";
                    }


                    if (
                        finalizarPedido
                    ) {

                        finalizarPedido.disabled =
                            false;
                    }
                }
            }
        );
    }
);


/* =========================================================
   34. CÁLCULO DEL CAMBIO
   ========================================================= */

if (
    dineroRecibido
) {

    dineroRecibido.addEventListener(
        "input",
        () => {

            const total =
                obtenerTotalPedido();


            const recibido =
                parseFloat(
                    dineroRecibido.value
                );


            if (
                !Number.isFinite(
                    recibido
                )
            ) {

                if (
                    cambioPago
                ) {

                    cambioPago.textContent =
                        "";
                }


                if (
                    finalizarPedido
                ) {

                    finalizarPedido.disabled =
                        true;
                }


                return;
            }


            const cambio =
                recibido -
                total;


            if (
                cambio < 0
            ) {

                if (
                    cambioPago
                ) {

                    cambioPago.textContent =
                        `Faltan $${dinero(
                            Math.abs(
                                cambio
                            )
                        )}`;
                }


                if (
                    finalizarPedido
                ) {

                    finalizarPedido.disabled =
                        true;
                }


                return;
            }


            if (
                cambioPago
            ) {

                cambioPago.textContent =
                    `Cambio: $${dinero(
                        cambio
                    )}`;
            }


            if (
                finalizarPedido
            ) {

                finalizarPedido.disabled =
                    false;
            }
        }
    );
}


/* =========================================================
   35. FINALIZAR Y GUARDAR PEDIDO
   ========================================================= */

if (
    finalizarPedido
) {

    finalizarPedido.addEventListener(
        "click",
        async () => {

            if (
                procesandoPedido
            ) {
                return;
            }


            if (
                pedido.length === 0
            ) {

                alert(
                    "👻 El pedido está vacío."
                );

                return;
            }


            if (
                !nombreCliente
            ) {

                alert(
                    "⚠️ No se encontró el nombre del cliente."
                );

                return;
            }


            prepararAudioCliente();


            actualizarPreciosFrescos();


            const total =
                obtenerTotalPedido();


            let metodoPago =
                "transferencia";

            let efectivoRecibido =
                0;

            let cambio =
                0;


            const metodoEfectivoVisible =
                pagoEfectivo &&
                getComputedStyle(
                    pagoEfectivo
                ).display !==
                    "none";


            if (
                metodoEfectivoVisible
            ) {

                metodoPago =
                    "efectivo";


                efectivoRecibido =
                    parseFloat(
                        dineroRecibido?.value
                    );


                if (
                    !Number.isFinite(
                        efectivoRecibido
                    )
                ) {

                    alert(
                        "⚠️ Ingresa la cantidad de efectivo."
                    );

                    return;
                }


                if (
                    efectivoRecibido <
                    total
                ) {

                    alert(
                        `⚠️ El efectivo no es suficiente.\n\n` +
                        `Total: $${dinero(
                            total
                        )}\n` +
                        `Recibido: $${dinero(
                            efectivoRecibido
                        )}`
                    );

                    return;
                }


                cambio =
                    efectivoRecibido -
                    total;
            }


            procesandoPedido =
                true;


            finalizarPedido.disabled =
                true;


            finalizarPedido.textContent =
                "PROCESANDO...";


            if (
                confirmacionTotal
            ) {

                confirmacionTotal.textContent =
                    `$${dinero(total)}`;
            }


            if (
                metodoPago ===
                "efectivo"
            ) {

                if (
                    detalleEfectivo
                ) {

                    detalleEfectivo.style.display =
                        "block";
                }


                if (
                    detalleCambio
                ) {

                    detalleCambio.style.display =
                        "block";
                }


                if (
                    detalleTransferencia
                ) {

                    detalleTransferencia.style.display =
                        "none";
                }


                if (
                    confirmacionEfectivo
                ) {

                    confirmacionEfectivo.textContent =
                        `$${dinero(
                            efectivoRecibido
                        )}`;
                }


                if (
                    confirmacionCambio
                ) {

                    confirmacionCambio.textContent =
                        `$${dinero(
                            cambio
                        )}`;
                }

            } else {

                if (
                    detalleEfectivo
                ) {

                    detalleEfectivo.style.display =
                        "none";
                }


                if (
                    detalleCambio
                ) {

                    detalleCambio.style.display =
                        "none";
                }


                if (
                    detalleTransferencia
                ) {

                    detalleTransferencia.style.display =
                        "block";
                }
            }


            const productosGuardar =
                pedido.map(
                    producto => ({

                        ...producto,

                        precioAplicado:
                            producto.tipo ===
                                "fresco"

                                ? numeroSeguro(
                                    producto.precioAplicado
                                )

                                : undefined,

                        salsas:
                            Array.isArray(
                                producto.salsas
                            )

                                ? [
                                    ...producto.salsas
                                ]

                                : []
                    })
                );


            try {

                /*
                 * IMPORTANTE:
                 *
                 * Ahora pedimos tanto ID como
                 * numero_pedido.
                 */

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("pedidos")
                        .insert([{

                            cliente:
                                nombreCliente,

                            productos:
                                productosGuardar,

                            total:
                                Number(
                                    dinero(
                                        total
                                    )
                                ),

                            metodo_pago:
                                metodoPago,

                            efectivo_recibido:
                                Number(
                                    dinero(
                                        efectivoRecibido
                                    )
                                ),

                            cambio:
                                Number(
                                    dinero(
                                        cambio
                                    )
                                ),

                            estado:
                                "Pendiente"

                        }])
                        .select(
                            "id, numero_pedido"
                        )
                        .single();


                if (
                    error
                ) {
                    throw error;
                }


                if (
                    !data
                ) {

                    throw new Error(
                        "Supabase no devolvió información del pedido."
                    );
                }


                const idPedido =
                    Number(
                        data.id
                    );


                const numero =
                    data.numero_pedido;


                /*
                 * GUARDAR EL PEDIDO EN ESTE DISPOSITIVO
                 */

                guardarPedidoCliente(
                    idPedido
                );


                /*
                 * COMENZAR A ESCUCHAR
                 * ESTE PEDIDO ESPECÍFICO.
                 */

                escucharPedidoCliente(
                    idPedido
                );


                const numeroFormateado =
                    String(numero)
                        .padStart(
                            3,
                            "0"
                        );


                if (
                    numeroPedido
                ) {

                    numeroPedido.textContent =
                        `#${numeroFormateado}`;
                }


                if (
                    ventanaCheckout
                ) {

                    ventanaCheckout.classList.remove(
                        "activa"
                    );
                }


                mostrarTransicion(
                    () => {

                        if (
                            ventanaConfirmacion
                        ) {

                            ventanaConfirmacion.classList.add(
                                "activa"
                            );
                        }
                    }
                );


                pedido = [];

                nombreCliente =
                    "";

                gringaSeleccionada =
                    null;


                if (
                    dineroRecibido
                ) {

                    dineroRecibido.value =
                        "";
                }


                if (
                    cambioPago
                ) {

                    cambioPago.textContent =
                        "";
                }


                botonesMetodoPago.forEach(
                    btn => {

                        btn.classList.remove(
                            "activo"
                        );
                    }
                );


                if (
                    pagoEfectivo
                ) {

                    pagoEfectivo.style.display =
                        "none";
                }


                if (
                    pagoTransferencia
                ) {

                    pagoTransferencia.style.display =
                        "none";
                }


                actualizarPedido();


                console.log(
                    "✅ Pedido guardado:",
                    {
                        id:
                            idPedido,

                        numero:
                            numeroFormateado
                    }
                );


            } catch (
                error
            ) {

                console.error(
                    "❌ Error al guardar el pedido:",
                    error
                );


                alert(
                    "❌ No se pudo registrar el pedido.\n\n" +
                    "Verifica tu conexión e intenta nuevamente."
                );


                procesandoPedido =
                    false;


                finalizarPedido.disabled =
                    false;


                finalizarPedido.textContent =
                    "FINALIZAR PEDIDO";


                return;
            }


            procesandoPedido =
                false;


            finalizarPedido.disabled =
                true;


            finalizarPedido.textContent =
                "PEDIDO ENVIADO ✓";
        }
    );
}


/* =========================================================
   36. CERRAR CONFIRMACIÓN
   ========================================================= */

if (
    cerrarConfirmacion
) {

    cerrarConfirmacion.addEventListener(
        "click",
        () => {

            if (
                ventanaConfirmacion
            ) {

                ventanaConfirmacion.classList.remove(
                    "activa"
                );
            }
        }
    );
}


/* =========================================================
   37. CERRAR MODALES AL HACER CLICK FUERA
   ========================================================= */

[
    ventanaSalsas,
    ventanaPedido,
    ventanaCheckout,
    ventanaConfirmacion

].forEach(
    modal => {

        if (!modal) {
            return;
        }


        modal.addEventListener(
            "click",
            evento => {

                if (
                    evento.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "activa"
                    );
                }
            }
        );
    }
);


/* =========================================================
   38. INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        [

            ventanaSalsas,
            ventanaPedido,
            ventanaCheckout,
            ventanaConfirmacion

        ].forEach(
            modal => {

                if (modal) {

                    modal.classList.remove(
                        "activa"
                    );
                }
            }
        );


        actualizarPedido();


        /*
         * Si este dispositivo ya tenía un pedido,
         * volver a conectarlo al Realtime.
         */

        restaurarEscuchaPedidoCliente();


        console.log(
            "👻 GRINGA.EXE inicializado correctamente."
        );
    }
);


/* =========================================================
   FIN DE SCRIPT.JS
   ========================================================= */