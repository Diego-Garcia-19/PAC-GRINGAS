const SUPABASE_URL =
    "https://gbrqwiucxwqzflzxtupf.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jW0Tc-8Ij0klXATVMNBFAQ_z3hOqZTz";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ========================================
// GRINGA.EXE
// SISTEMA DE PEDIDOS
// ========================================

let pedido = [];
let gringaSeleccionada = null;
let nombreCliente = "";


// ========================================
// TRANSICIÓN PAC-MAN
// ========================================

function mostrarTransicion(accion) {

    const transicion =
        document.getElementById("pacman-transicion");

    if (!transicion) {

        accion();

        return;
    }

    transicion.classList.add("activa");

    setTimeout(function () {

        transicion.classList.remove("activa");

        accion();

    }, 1900);
}


// ========================================
// ELEMENTOS - SALSAS
// ========================================

const ventanaSalsas =
    document.getElementById("ventana-salsas");

const cerrarSalsas =
    document.getElementById("cerrar-salsas");

const salsaGringaNombre =
    document.getElementById("salsa-gringa-nombre");

const salsa1 =
    document.getElementById("salsa-1");

const salsa2 =
    document.getElementById("salsa-2");

const contenedorSalsa2 =
    document.getElementById("contenedor-salsa-2");

const botonSegundaSalsa =
    document.getElementById("agregar-segunda-salsa");

const confirmarGringa =
    document.getElementById("confirmar-gringa");

const mensajeSalsa =
    document.getElementById("mensaje-salsa");

const precioSalsas =
    document.getElementById("precio-salsas");

const extraQuesoCheckbox =
    document.getElementById("extra-queso-checkbox");

const precioQueso =
    document.getElementById("precio-queso");


// ========================================
// ELEMENTOS - MI PEDIDO
// ========================================

const ventanaPedido =
    document.getElementById("ventana-pedido");

const botonVerPedido =
    document.getElementById("ver-pedido");

const botonCerrarPedido =
    document.getElementById("cerrar-pedido");

const listaProductos =
    document.getElementById("lista-productos");

const cantidadPedido =
    document.getElementById("cantidad-pedido");

const totalPedido =
    document.getElementById("total-pedido");

const ventanaTotal =
    document.getElementById("ventana-total");

const confirmarPedido =
    document.getElementById("confirmar-pedido");


// ========================================
// ELEMENTOS - CHECKOUT
// ========================================

const ventanaCheckout =
    document.getElementById("ventana-checkout");

const cerrarCheckout =
    document.getElementById("cerrar-checkout");

const checkoutProductos =
    document.getElementById("checkout-productos");

const checkoutTotal =
    document.getElementById("checkout-total");

const botonesMetodoPago =
    document.querySelectorAll(".metodo-pago-btn");

const pagoEfectivo =
    document.getElementById("pago-efectivo");

const pagoTransferencia =
    document.getElementById("pago-transferencia");

const dineroRecibido =
    document.getElementById("dinero-recibido");

const cambioPago =
    document.getElementById("cambio-pago");

const finalizarPedido =
    document.getElementById("finalizar-pedido");


// ========================================
// ELEMENTOS - CONFIRMACIÓN
// ========================================

const ventanaConfirmacion =
    document.getElementById("ventana-confirmacion");

const numeroPedidoElemento =
    document.getElementById("numero-pedido");

const confirmacionTotal =
    document.getElementById("confirmacion-total");

const confirmacionEfectivo =
    document.getElementById("confirmacion-efectivo");

const confirmacionCambio =
    document.getElementById("confirmacion-cambio");

const detalleEfectivo =
    document.getElementById("detalle-efectivo");

const detalleCambio =
    document.getElementById("detalle-cambio");

const detalleTransferencia =
    document.getElementById("detalle-transferencia");

const cerrarConfirmacion =
    document.getElementById("cerrar-confirmacion");


// ========================================
// CALCULAR PRECIO DE FRESCOS
// ========================================

function calcularPrecioFrescos(
    cantidadFrescos,
    cantidadGringas
) {

    if (cantidadFrescos <= 0) {
        return 0;
    }

    if (cantidadGringas === 0) {

        return cantidadFrescos * 0.35;

    }

    const primerosDos =
        Math.min(cantidadFrescos, 2);

    const restantes =
        Math.max(cantidadFrescos - 2, 0);

    return (
        primerosDos * 0.25 +
        restantes * 0.35
    );
}


// ========================================
// CANTIDAD DE GRINGAS
// ========================================

function obtenerCantidadGringas() {

    let cantidad = 0;

    pedido.forEach(function (producto) {

        if (producto.tipo === "gringa") {

            cantidad += producto.cantidad;

        }

    });

    return cantidad;
}


// ========================================
// CANTIDAD DE FRESCOS
// ========================================

function obtenerCantidadFrescos() {

    let cantidad = 0;

    pedido.forEach(function (producto) {

        if (producto.tipo === "fresco") {

            cantidad += producto.cantidad;

        }

    });

    return cantidad;
}


// ========================================
// TOTAL DE GRINGAS
// ========================================

function obtenerTotalGringas() {

    let total = 0;

    pedido.forEach(function (producto) {

        if (producto.tipo === "gringa") {

            const precioUnitario =
                producto.precio +
                (producto.extraSalsa || 0) +
                (producto.extraQueso || 0);

            total +=
                precioUnitario *
                producto.cantidad;

        }

    });

    return total;
}


// ========================================
// TOTAL DEL PEDIDO
// ========================================

function obtenerTotalPedido() {

    const cantidadGringas =
        obtenerCantidadGringas();

    const cantidadFrescos =
        obtenerCantidadFrescos();

    const totalGringas =
        obtenerTotalGringas();

    const totalFrescos =
        calcularPrecioFrescos(
            cantidadFrescos,
            cantidadGringas
        );

    return totalGringas + totalFrescos;
}


// ========================================
// ACTUALIZAR PEDIDO
// ========================================

function actualizarPedido() {

    let cantidadTotal = 0;

    pedido.forEach(function (producto) {

        cantidadTotal += producto.cantidad;

    });

    const total =
        obtenerTotalPedido();


    if (cantidadPedido) {

        cantidadPedido.textContent =
            cantidadTotal +
            (
                cantidadTotal === 1
                    ? " producto"
                    : " productos"
            );

    }


    if (totalPedido) {

        totalPedido.textContent =
            "$" + total.toFixed(2);

    }


    if (ventanaTotal) {

        ventanaTotal.textContent =
            "$" + total.toFixed(2);

    }


    if (!listaProductos) {
        return;
    }


    if (pedido.length === 0) {

        listaProductos.innerHTML = `

            <p class="pedido-vacio">

                No hay productos en tu pedido.

            </p>

        `;

        return;
    }


    listaProductos.innerHTML = "";


    const cantidadGringas =
        obtenerCantidadGringas();

    const cantidadFrescos =
        obtenerCantidadFrescos();

    const totalFrescos =
        calcularPrecioFrescos(
            cantidadFrescos,
            cantidadGringas
        );


    pedido.forEach(function (producto, indice) {

        let subtotal = 0;


        // ========================================
        // GRINGA
        // ========================================

        if (producto.tipo === "gringa") {

            const precioUnitario =
                producto.precio +
                (producto.extraSalsa || 0) +
                (producto.extraQueso || 0);

            subtotal =
                precioUnitario *
                producto.cantidad;

        }


        // ========================================
        // FRESCO
        // ========================================

        else if (producto.tipo === "fresco") {

            if (cantidadFrescos > 0) {

                subtotal =
                    (
                        totalFrescos /
                        cantidadFrescos
                    ) *
                    producto.cantidad;

            }

        }


        // ========================================
        // EXTRA
        // ========================================

        else if (producto.tipo === "extra") {

            subtotal =
                producto.precio *
                producto.cantidad;

        }


        // ========================================
        // SALSAS
        // ========================================

        let textoSalsas = "";

        if (
            producto.tipo === "gringa" &&
            producto.salsas &&
            producto.salsas.length > 0
        ) {

            textoSalsas = `

                <p>
                    🌶️ Salsa:
                    ${producto.salsas.join(", ")}
                </p>

            `;

        } else if (producto.tipo === "gringa") {

            textoSalsas = `

                <p>
                    Sin salsa
                </p>

            `;

        }


        // ========================================
        // EXTRA QUESO
        // ========================================

        let textoQueso = "";

        if (
            producto.tipo === "gringa" &&
            producto.extraQueso > 0
        ) {

            textoQueso = `

                <p>
                    🧀 Extra Cheese
                </p>

            `;

        }


        // ========================================
        // CREAR ITEM
        // ========================================

        const item =
            document.createElement("div");

        item.classList.add(
            "item-pedido"
        );


        item.innerHTML = `

            <div class="item-info">

                <h3>
                    ${producto.nombre}
                </h3>

                <p>

                    ${
                        producto.tipo === "fresco"
                            ? "Fresco"
                            : "$" +
                              producto.precio.toFixed(2) +
                              " c/u"
                    }

                </p>

                ${textoSalsas}

                ${textoQueso}

            </div>


            <div class="item-controles">

                <button
                    type="button"
                    onclick="disminuirCantidad(${indice})">

                    −

                </button>

                <span>
                    ${producto.cantidad}
                </span>

                <button
                    type="button"
                    onclick="aumentarCantidad(${indice})">

                    +

                </button>

            </div>


            <div class="item-precio">

                $${subtotal.toFixed(2)}

            </div>

        `;


        listaProductos.appendChild(item);

    });

}


// ========================================
// AUMENTAR CANTIDAD
// ========================================

function aumentarCantidad(indice) {

    if (!pedido[indice]) {
        return;
    }

    pedido[indice].cantidad++;

    actualizarPedido();
}


// ========================================
// DISMINUIR CANTIDAD
// ========================================

function disminuirCantidad(indice) {

    if (!pedido[indice]) {
        return;
    }

    pedido[indice].cantidad--;

    if (pedido[indice].cantidad <= 0) {

        pedido.splice(indice, 1);

    }

    actualizarPedido();
}


// ========================================
// BOTONES DE GRINGAS
// ========================================

const botonesGringa =
    document.querySelectorAll(".btn-gringa");


botonesGringa.forEach(function (boton) {

    boton.addEventListener(
        "click",
        function () {

            const producto =
                boton.closest(".producto");

            if (!producto) {
                return;
            }


            const nombre =
                producto.querySelector("h4").textContent;


            const precio =
                parseFloat(
                    producto.dataset.precio
                );


            gringaSeleccionada = {

                nombre: nombre,

                precio: precio

            };


            if (salsaGringaNombre) {

                salsaGringaNombre.textContent =
                    nombre;

            }


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


            if (botonSegundaSalsa) {

                botonSegundaSalsa.style.display =
                    "block";

            }


            if (precioSalsas) {

                precioSalsas.textContent =
                    "$0.00";

            }


            if (mensajeSalsa) {

                mensajeSalsa.textContent =
                    "";

            }


            if (extraQuesoCheckbox) {

                extraQuesoCheckbox.checked =
                    false;

            }


            if (precioQueso) {

                precioQueso.textContent =
                    "$0.00";

            }


            if (ventanaSalsas) {

                mostrarTransicion(function () {

                    ventanaSalsas.classList.add(
                        "activa"
                    );

                });

            }

        }
    );

});


// ========================================
// EXTRA CHEESE
// ========================================

if (extraQuesoCheckbox) {

    extraQuesoCheckbox.addEventListener(
        "change",
        function () {

            if (extraQuesoCheckbox.checked) {

                precioQueso.textContent =
                    "$0.50";

            } else {

                precioQueso.textContent =
                    "$0.00";

            }

        }
    );

}


// ========================================
// AGREGAR SEGUNDA SALSA
// ========================================

if (botonSegundaSalsa) {

    botonSegundaSalsa.addEventListener(
        "click",
        function () {

            if (salsa1.value === "") {

                mensajeSalsa.textContent =
                    "Primero selecciona una salsa.";

                return;
            }


            contenedorSalsa2.style.display =
                "block";


            botonSegundaSalsa.style.display =
                "none";


            precioSalsas.textContent =
                "$0.15";


            mensajeSalsa.textContent =
                "";

        }
    );

}


// ========================================
// EVITAR SALSA REPETIDA
// ========================================

if (salsa2) {

    salsa2.addEventListener(
        "change",
        function () {

            if (
                salsa2.value !== "" &&
                salsa2.value === salsa1.value
            ) {

                mensajeSalsa.textContent =
                    "⚠️ No puedes elegir la misma salsa dos veces.";

                salsa2.value = "";

                return;
            }


            mensajeSalsa.textContent =
                "";

        }
    );

}


// ========================================
// CONFIRMAR GRINGA
// ========================================

if (confirmarGringa) {

    confirmarGringa.addEventListener(
        "click",
        function () {

            if (!gringaSeleccionada) {
                return;
            }


            const salsas = [];


            if (salsa1.value !== "") {

                salsas.push(
                    salsa1.value
                );

            }


            if (salsa2.value !== "") {

                if (
                    salsa2.value === salsa1.value
                ) {

                    mensajeSalsa.textContent =
                        "⚠️ No puedes repetir la misma salsa.";

                    return;

                }


                salsas.push(
                    salsa2.value
                );

            }


            let extraSalsa = 0;

            if (salsas.length === 2) {

                extraSalsa = 0.15;

            }


            let extraQueso = 0;

            if (
                extraQuesoCheckbox &&
                extraQuesoCheckbox.checked
            ) {

                extraQueso = 0.50;

            }


            pedido.push({

                nombre:
                    gringaSeleccionada.nombre,

                precio:
                    gringaSeleccionada.precio,

                cantidad:
                    1,

                tipo:
                    "gringa",

                salsas:
                    salsas,

                extraSalsa:
                    extraSalsa,

                extraQueso:
                    extraQueso

            });


            actualizarPedido();


            ventanaSalsas.classList.remove(
                "activa"
            );


            gringaSeleccionada = null;

        }
    );

}


// ========================================
// CERRAR SALSAS
// ========================================

if (cerrarSalsas) {

    cerrarSalsas.addEventListener(
        "click",
        function () {

            ventanaSalsas.classList.remove(
                "activa"
            );

            gringaSeleccionada = null;

        }
    );

}


// ========================================
// BOTONES DE FRESCOS
// ========================================

const botonesFresco =
    document.querySelectorAll(
        '[data-tipo="fresco"] button'
    );


botonesFresco.forEach(function (boton) {

    boton.addEventListener(
        "click",
        function () {

            const producto =
                boton.closest(".producto");

            if (!producto) {
                return;
            }


            const nombre =
                producto.querySelector("h4").textContent;


            const precio =
                parseFloat(
                    producto.dataset.precio
                );


            const frescoExistente =
                pedido.find(function (item) {

                    return (
                        item.nombre === nombre &&
                        item.tipo === "fresco"
                    );

                });


            if (frescoExistente) {

                frescoExistente.cantidad++;

            } else {

                pedido.push({

                    nombre:
                        nombre,

                    precio:
                        precio,

                    cantidad:
                        1,

                    tipo:
                        "fresco"

                });

            }


            actualizarPedido();

        }
    );

});


// ========================================
// ABRIR MI PEDIDO
// ========================================

if (botonVerPedido) {

    botonVerPedido.addEventListener(
        "click",
        function () {

            mostrarTransicion(function () {

                ventanaPedido.classList.add(
                    "activa"
                );

            });

        }
    );

}


// ========================================
// CERRAR MI PEDIDO
// ========================================

if (botonCerrarPedido) {

    botonCerrarPedido.addEventListener(
        "click",
        function () {

            ventanaPedido.classList.remove(
                "activa"
            );

        }
    );

}


// ========================================
// ABRIR CHECKOUT
// ========================================

function abrirCheckout() {

    if (pedido.length === 0) {

        alert(
            "⚠️ Tu pedido está vacío."
        );

        return;
    }


    if (!checkoutProductos) {
        return;
    }


    checkoutProductos.innerHTML = "";


    const cantidadGringas =
        obtenerCantidadGringas();

    const cantidadFrescos =
        obtenerCantidadFrescos();

    const totalFrescos =
        calcularPrecioFrescos(
            cantidadFrescos,
            cantidadGringas
        );


    pedido.forEach(function (producto) {

        let subtotal = 0;


        // ========================================
        // GRINGA
        // ========================================

        if (producto.tipo === "gringa") {

            const precioUnitario =
                producto.precio +
                (producto.extraSalsa || 0) +
                (producto.extraQueso || 0);


            subtotal =
                precioUnitario *
                producto.cantidad;


            let detalles = "";


            if (
                producto.salsas &&
                producto.salsas.length > 0
            ) {

                detalles += `

                    <p>
                        🌶️
                        ${producto.salsas.join(", ")}
                    </p>

                `;

            } else {

                detalles += `

                    <p>
                        Sin salsa
                    </p>

                `;

            }


            if (producto.extraQueso > 0) {

                detalles += `

                    <p>
                        🧀 Extra Cheese
                    </p>

                `;

            }


            checkoutProductos.innerHTML += `

                <div class="checkout-item">

                    <div>

                        <strong>
                            ${producto.nombre}
                        </strong>

                        ${detalles}

                        <p>
                            x${producto.cantidad}
                        </p>

                    </div>

                    <span>
                        $${subtotal.toFixed(2)}
                    </span>

                </div>

            `;

        }


        // ========================================
        // FRESCO
        // ========================================

        else if (producto.tipo === "fresco") {

            let subtotalFresco = 0;


            if (cantidadFrescos > 0) {

                subtotalFresco =
                    (
                        totalFrescos /
                        cantidadFrescos
                    ) *
                    producto.cantidad;

            }


            checkoutProductos.innerHTML += `

                <div class="checkout-item">

                    <div>

                        <strong>
                            ${producto.nombre}
                        </strong>

                        <p>
                            x${producto.cantidad}
                        </p>

                    </div>

                    <span>
                        $${subtotalFresco.toFixed(2)}
                    </span>

                </div>

            `;

        }

    });


    const total =
        obtenerTotalPedido();


    checkoutTotal.textContent =
        "$" + total.toFixed(2);


    pagoEfectivo.style.display =
        "none";

    pagoTransferencia.style.display =
        "none";

    dineroRecibido.value =
        "";

    cambioPago.textContent =
        "$0.00";

    finalizarPedido.disabled =
        true;


    ventanaCheckout.classList.add(
        "activa"
    );

}


// ========================================
// CONFIRMAR PEDIDO → CHECKOUT
// ========================================

if (confirmarPedido) {

    confirmarPedido.addEventListener(
        "click",
        function () {

            if (pedido.length === 0) {

                alert(
                    "⚠️ Tu pedido está vacío."
                );

                return;
            }


            // ========================================
            // PEDIR NOMBRE
            // ========================================

            const nombre =
                prompt(
                    "👤 Ingresa tu nombre:"
                );


            if (nombre === null) {

                return;

            }


            const nombreLimpio =
                nombre.trim();


            if (nombreLimpio === "") {

                alert(
                    "⚠️ Debes ingresar tu nombre."
                );

                return;

            }


            nombreCliente =
                nombreLimpio;


            ventanaPedido.classList.remove(
                "activa"
            );


            mostrarTransicion(function () {

                abrirCheckout();

            });

        }
    );

}


// ========================================
// CERRAR CHECKOUT
// ========================================

if (cerrarCheckout) {

    cerrarCheckout.addEventListener(
        "click",
        function () {

            ventanaCheckout.classList.remove(
                "activa"
            );

        }
    );

}


// ========================================
// MÉTODOS DE PAGO
// ========================================

botonesMetodoPago.forEach(function (boton) {

    boton.addEventListener(
        "click",
        function () {

            const metodo =
                boton.dataset.metodo;


            // EFECTIVO
            if (metodo === "efectivo") {

                pagoEfectivo.style.display =
                    "block";

                pagoTransferencia.style.display =
                    "none";

                finalizarPedido.disabled =
                    true;

                dineroRecibido.focus();

            }


            // TRANSFERENCIA
            else if (
                metodo === "transferencia"
            ) {

                pagoEfectivo.style.display =
                    "none";

                pagoTransferencia.style.display =
                    "block";

                finalizarPedido.disabled =
                    false;

            }

        }
    );

});


// ========================================
// CALCULAR CAMBIO
// ========================================

if (dineroRecibido) {

    dineroRecibido.addEventListener(
        "input",
        function () {

            const total =
                obtenerTotalPedido();


            const recibido =
                parseFloat(
                    dineroRecibido.value
                );


            if (isNaN(recibido)) {

                cambioPago.textContent =
                    "$0.00";

                finalizarPedido.disabled =
                    true;

                return;

            }


            const cambio =
                recibido - total;


            if (cambio < 0) {

                cambioPago.textContent =
                    "Faltan $" +
                    Math.abs(cambio).toFixed(2);

                finalizarPedido.disabled =
                    true;

            } else {

                cambioPago.textContent =
                    "$" +
                    cambio.toFixed(2);

                finalizarPedido.disabled =
                    false;

            }

        }
    );

}


// ========================================
// FINALIZAR PEDIDO
// ========================================

if (finalizarPedido) {

    finalizarPedido.addEventListener(
        "click",
        async function () {

            if (pedido.length === 0) {

                alert(
                    "⚠️ No hay productos en el pedido."
                );

                return;

            }


            if (!nombreCliente) {

                alert(
                    "⚠️ Falta el nombre del cliente."
                );

                return;

            }


            const total =
                obtenerTotalPedido();


            // ========================================
            // MÉTODO DE PAGO
            // ========================================

            let metodoPago =
                "transferencia";

            let efectivoRecibido =
                0;

            let cambio =
                0;


            if (
                pagoEfectivo &&
                pagoEfectivo.style.display !== "none"
            ) {

                metodoPago =
                    "efectivo";


                efectivoRecibido =
                    parseFloat(
                        dineroRecibido.value
                    );


                if (
                    isNaN(efectivoRecibido) ||
                    efectivoRecibido < total
                ) {

                    alert(
                        "⚠️ El dinero recibido no es suficiente."
                    );

                    return;

                }


                cambio =
                    efectivoRecibido -
                    total;

            }


            // ========================================
            // PREPARAR CONFIRMACIÓN
            // ========================================

            if (confirmacionTotal) {

                confirmacionTotal.textContent =
                    "$" +
                    total.toFixed(2);

            }


            // ========================================
            // EFECTIVO
            // ========================================

            if (metodoPago === "efectivo") {

                if (detalleEfectivo) {

                    detalleEfectivo.style.display =
                        "flex";

                }


                if (detalleCambio) {

                    detalleCambio.style.display =
                        "flex";

                }


                if (detalleTransferencia) {

                    detalleTransferencia.style.display =
                        "none";

                }


                if (confirmacionEfectivo) {

                    confirmacionEfectivo.textContent =
                        "$" +
                        efectivoRecibido.toFixed(2);

                }


                if (confirmacionCambio) {

                    confirmacionCambio.textContent =
                        "$" +
                        cambio.toFixed(2);

                }

            }


            // ========================================
            // TRANSFERENCIA
            // ========================================

            else {

                if (detalleEfectivo) {

                    detalleEfectivo.style.display =
                        "none";

                }


                if (detalleCambio) {

                    detalleCambio.style.display =
                        "none";

                }


                if (detalleTransferencia) {

                    detalleTransferencia.style.display =
                        "flex";

                }

            }


            // ========================================
            // GUARDAR EN SUPABASE
            // ========================================

            const { data, error } =
                await supabaseClient

                    .from("pedidos")

                    .insert([

                        {

                            cliente:
                                nombreCliente,

                            productos:
                                pedido,

                            total:
                                total,

                            metodo_pago:
                                metodoPago,

                            cambio:
                                cambio,

                            estado:
                                "Pendiente"

                        }

                    ])

                    .select()

                    .single();


            // ========================================
            // ERROR
            // ========================================

            if (error) {

                console.error(
                    "❌ Error guardando pedido:",
                    error
                );

                alert(
                    "❌ No se pudo guardar el pedido. Intenta nuevamente."
                );

                return;

            }


            // ========================================
            // NÚMERO DEL PEDIDO
            // GENERADO POR SUPABASE
            // ========================================

            const numeroGenerado =
                data.numero_pedido;


            const numeroFormateado =
                String(numeroGenerado)
                    .padStart(3, "0");


            // ========================================
            // MOSTRAR NÚMERO AL CLIENTE
            // ========================================

            if (numeroPedidoElemento) {

                numeroPedidoElemento.textContent =
                    "#" + numeroFormateado;

            }


            console.log(
                "========================================"
            );

            console.log(
                "✅ PEDIDO GUARDADO CORRECTAMENTE"
            );

            console.log(
                "🔢 Número:",
                numeroFormateado
            );

            console.log(
                "👤 Cliente:",
                nombreCliente
            );

            console.log(
                "💰 Total:",
                total.toFixed(2)
            );

            console.log(
                "💵 Cambio:",
                cambio.toFixed(2)
            );

            console.log(
                "💳 Método:",
                metodoPago
            );

            console.log(
                "📌 Estado: Pendiente"
            );

            console.log(
                "========================================"
            );


            // ========================================
            // CERRAR CHECKOUT
            // ========================================

            ventanaCheckout.classList.remove(
                "activa"
            );


            // ========================================
            // MOSTRAR CONFIRMACIÓN
            // ========================================

            mostrarTransicion(function () {

                if (ventanaConfirmacion) {

                    ventanaConfirmacion.classList.add(
                        "activa"
                    );

                }

            });


            // ========================================
            // VACIAR PEDIDO
            // ========================================

            pedido = [];

            actualizarPedido();


            // ========================================
            // REINICIAR DATOS
            // ========================================

            nombreCliente = "";


            if (dineroRecibido) {

                dineroRecibido.value =
                    "";

            }


            if (cambioPago) {

                cambioPago.textContent =
                    "$0.00";

            }


            if (pagoEfectivo) {

                pagoEfectivo.style.display =
                    "none";

            }


            if (pagoTransferencia) {

                pagoTransferencia.style.display =
                    "none";

            }


            finalizarPedido.disabled =
                true;

        }
    );

}


// ========================================
// CERRAR CONFIRMACIÓN
// ========================================

if (cerrarConfirmacion) {

    cerrarConfirmacion.addEventListener(
        "click",
        function () {

            ventanaConfirmacion.classList.remove(
                "activa"
            );

        }
    );

}


// ========================================
// ESTADO INICIAL DE VENTANAS
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const ventanas = [

            document.getElementById(
                "ventana-pedido"
            ),

            document.getElementById(
                "ventana-salsas"
            ),

            document.getElementById(
                "ventana-checkout"
            ),

            document.getElementById(
                "ventana-confirmacion"
            )

        ];


        ventanas.forEach(function (ventana) {

            if (ventana) {

                ventana.classList.remove(
                    "activa"
                );

            }

        });

    }
);


// ========================================
// INICIAR SISTEMA
// ========================================

actualizarPedido();


console.log(
    "👻 GRINGA.EXE iniciado correctamente."
);