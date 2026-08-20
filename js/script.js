// ========================================
// GRINGA.EXE
// SISTEMA DE PEDIDOS
// ========================================

let pedido = [];
let gringaSeleccionada = null;


// ========================================
// ELEMENTOS DE LA VENTANA DE SALSAS
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
    document.getElementById(
        "extra-queso-checkbox"
    );

const precioQueso =
    document.getElementById(
        "precio-queso"
    );


// ========================================
// ELEMENTOS DEL PEDIDO
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


// ========================================
// CALCULAR PRECIO DE FRESCOS
// ========================================

function calcularPrecioFrescos(
    cantidadFrescos,
    cantidadGringas
) {

    // No hay frescos
    if (cantidadFrescos === 0) {
        return 0;
    }


    // ========================================
    // SIN GRINGA
    // ========================================
    // Todos los frescos cuestan $0.35

    if (cantidadGringas === 0) {

        return cantidadFrescos * 0.35;

    }


    // ========================================
    // CON GRINGA
    // ========================================
    // Primeros 2 → $0.25
    // Tercero en adelante → $0.35

    if (cantidadFrescos <= 2) {

        return cantidadFrescos * 0.25;

    }


    return (
        (2 * 0.25) +
        ((cantidadFrescos - 2) * 0.35)
    );
}


// ========================================
// CALCULAR TOTAL DE SALSAS
// ========================================

function calcularTotalSalsas() {

    let total = 0;


    pedido.forEach(function(producto) {

        if (producto.tipo === "gringa") {

            total +=
                producto.extraSalsa *
                producto.cantidad;

        }

    });


    return total;
}


// ========================================
// ACTUALIZAR PEDIDO
// ========================================

function actualizarPedido() {

    let cantidadTotal = 0;

    let cantidadGringas = 0;

    let cantidadFrescos = 0;

    let totalGringas = 0;


    // ========================================
    // CONTAR PRODUCTOS
    // ========================================

    pedido.forEach(function(producto) {

        cantidadTotal += producto.cantidad;


        if (producto.tipo === "gringa") {

            cantidadGringas +=
                producto.cantidad;

            totalGringas +=
                producto.precio *
                producto.cantidad;

            totalGringas +=
                producto.extraQueso *
                producto.cantidad;

            totalGringas +=
                producto.extraSalsa *
                producto.cantidad;

        }
        
        if (producto.tipo === "fresco") {

            cantidadFrescos +=
                producto.cantidad;

        }

    });


    // ========================================
    // PRECIO DE FRESCOS
    // ========================================

    const totalFrescos =
        calcularPrecioFrescos(
            cantidadFrescos,
            cantidadGringas
        );


    // ========================================
    // TOTAL FINAL
    // ========================================

    const total =
        totalGringas +
        totalFrescos;


    // ========================================
    // ACTUALIZAR BARRA
    // ========================================

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
            "$" +
            total.toFixed(2);

    }


    // ========================================
    // MOSTRAR PRODUCTOS
    // ========================================

    if (!listaProductos) {
        return;
    }


    if (pedido.length === 0) {

        listaProductos.innerHTML = `

            <p class="pedido-vacio">

                No hay productos
                en tu pedido.

            </p>

        `;

    }

    else {

        listaProductos.innerHTML = "";


        pedido.forEach(
            function(producto, indice) {

                let subtotal = 0;


                // ========================================
// CALCULAR SUBTOTAL
// ========================================

if (producto.tipo === "gringa") {

   subtotal =
    (
        producto.precio +
        producto.extraSalsa +
        producto.extraQueso
    ) *
    producto.cantidad;

}

else if (producto.tipo === "extra") {

    subtotal =
        producto.precio *
        producto.cantidad;

}

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
                // CREAR ELEMENTO
                // ========================================

                const item =
                    document.createElement(
                        "div"
                    );


                item.classList.add(
                    "item-pedido"
                );


                // ========================================
                // MOSTRAR SALSAS
                // ========================================

                let textoSalsas = "";


                if (
                    producto.tipo === "gringa" &&
                    producto.salsas &&
                    producto.salsas.length > 0
                ) {

                    textoSalsas =
                        `
                        <p>
                            🌶️ Salsa:
                            ${producto.salsas.join(", ")}
                        </p>
                        `;

                }

                else if (
                    producto.tipo === "gringa"
                ) {

                    textoSalsas =
                        `
                        <p>
                            Sin salsa
                        </p>
                        `;

                }


                // ========================================
                // HTML DEL PRODUCTO
                // ========================================

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


                listaProductos.appendChild(
                    item
                );

            }
        );

    }


    // ========================================
    // TOTAL DE LA VENTANA
    // ========================================

    if (ventanaTotal) {

        ventanaTotal.textContent =
            "$" +
            total.toFixed(2);

    }

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


// ========================================
// BOTONES DE GRINGAS
// ========================================

const botonesGringa =
    document.querySelectorAll(
        ".btn-gringa"
    );


botonesGringa.forEach(
    function(boton) {

        boton.addEventListener(
            "click",
            function() {

                const producto =
                    boton.closest(
                        ".producto"
                    );


                const nombre =
                    producto.querySelector(
                        "h4"
                    ).textContent;


                const precio =
                    parseFloat(
                        producto.dataset.precio
                    );


                // ========================================
                // GUARDAR GRINGA
                // ========================================

                gringaSeleccionada = {

                    nombre:
                        nombre,

                    precio:
                        precio

                };


                // ========================================
                // CONFIGURAR VENTANA
                // ========================================

                salsaGringaNombre.textContent =
                    nombre;


                salsa1.value = "";


                salsa2.value = "";

extraQuesoCheckbox.checked = false;

precioQueso.textContent =
    "$0.00";

                contenedorSalsa2.style.display =
                    "none";


                botonSegundaSalsa.style.display =
                    "block";


                precioSalsas.textContent =
                    "$0.00";


                mensajeSalsa.textContent =
                    "";


                // ========================================
                // ABRIR VENTANA
                // ========================================

                ventanaSalsas.classList.add(
                    "activa"
                );

            }
        );

    }
);


// ========================================
// AGREGAR SEGUNDA SALSA
// ========================================

botonSegundaSalsa.addEventListener(
    "click",
    function() {

        // Si no seleccionó primera salsa
        if (
            salsa1.value === ""
        ) {

            mensajeSalsa.textContent =
                "Primero selecciona una salsa.";

            return;

        }

        // ========================================
// EXTRA CHEESE
// ========================================

extraQuesoCheckbox.addEventListener(
    "change",
    function() {

        if (
            extraQuesoCheckbox.checked
        ) {

            precioQueso.textContent =
                "$0.50";

        } else {

            precioQueso.textContent =
                "$0.00";

        }

    }
);


        // Mostrar segunda salsa
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


// ========================================
// EVITAR SALSA REPETIDA
// ========================================

salsa2.addEventListener(
    "change",
    function() {

        if (
            salsa2.value !== "" &&
            salsa2.value === salsa1.value
        ) {

            mensajeSalsa.textContent =
                "⚠️ No puedes elegir la misma salsa dos veces.";

            salsa2.value =
                "";

            return;

        }


        mensajeSalsa.textContent =
            "";

    }
);


// ========================================
// CONFIRMAR GRINGA
// ========================================

confirmarGringa.addEventListener(
    "click",
    function() {

        if (!gringaSeleccionada) {
            return;
        }


        // ========================================
        // CREAR LISTA DE SALSAS
        // ========================================

        const salsas = [];


        if (
            salsa1.value !== ""
        ) {

            salsas.push(
                salsa1.value
            );

        }


        if (
            salsa2.value !== ""
        ) {

            // Seguridad adicional
            if (
                salsa2.value ===
                salsa1.value
            ) {

                mensajeSalsa.textContent =
                    "⚠️ No puedes repetir la misma salsa.";

                return;

            }


            salsas.push(
                salsa2.value
            );

        }


        // ========================================
        // PRECIO EXTRA
        // ========================================

        let extraSalsa = 0;


        if (
            salsas.length === 2
        ) {

            extraSalsa =
                0.15;

        }

        // ========================================
// EXTRA QUESO
// ========================================

let extraQueso = 0;

if (
    extraQuesoCheckbox.checked
) {

    extraQueso = 0.50;

}
        // ========================================
        // AGREGAR GRINGA
        // ========================================

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


        // ========================================
        // ACTUALIZAR
        // ========================================

        actualizarPedido();


        // ========================================
        // CERRAR
        // ========================================

        ventanaSalsas.classList.remove(
            "activa"
        );


        gringaSeleccionada =
            null;


        console.log(
            "Gringa agregada:",
            pedido[pedido.length - 1]
        );

    }
);


// ========================================
// CERRAR VENTANA DE SALSAS
// ========================================

cerrarSalsas.addEventListener(
    "click",
    function() {

        ventanaSalsas.classList.remove(
            "activa"
        );


        gringaSeleccionada =
            null;

    }
);


// ========================================
// BOTONES DE FRESCOS
// ========================================

const botonesFresco =
    document.querySelectorAll(
        '[data-tipo="fresco"] button'
    );


botonesFresco.forEach(
    function(boton) {

        boton.addEventListener(
            "click",
            function() {

                const producto =
                    boton.closest(
                        ".producto"
                    );


                const nombre =
                    producto.querySelector(
                        "h4"
                    ).textContent;


                const precio =
                    parseFloat(
                        producto.dataset.precio
                    );


                // ========================================
                // BUSCAR FRESCO EXISTENTE
                // ========================================

                const frescoExistente =
                    pedido.find(
                        function(item) {

                            return (
                                item.nombre ===
                                nombre
                            );

                        }
                    );


                if (
                    frescoExistente
                ) {

                    frescoExistente.cantidad++;

                }

                else {

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


                console.log(
                    "Fresco seleccionado:",
                    nombre
                );


                console.log(
                    "Pedido actual:",
                    pedido
                );

            }
        );

    }
);


// ========================================
// VENTANA MI PEDIDO
// ========================================

botonVerPedido.addEventListener(
    "click",
    function() {

        ventanaPedido.classList.add(
            "activa"
        );

    }
);


botonCerrarPedido.addEventListener(
    "click",
    function() {

        ventanaPedido.classList.remove(
            "activa"
        );

    }
);


// ========================================
// INICIAR PEDIDO
// ========================================

actualizarPedido();


console.log(
    "GRINGA.EXE iniciado correctamente."
);

// ========================================
// EXTRA CHEESE
// ========================================

const botonesExtra =
    document.querySelectorAll(
        '[data-tipo="extra"] button'
    );


botonesExtra.forEach(
    function(boton) {

        boton.addEventListener(
            "click",
            function() {

                const producto =
                    boton.closest(".producto");


                const nombre =
                    producto.querySelector("h4").textContent;


                const precio =
                    parseFloat(
                        producto.dataset.precio
                    );


                // ========================================
                // BUSCAR SI YA EXISTE
                // ========================================

                const extraExistente =
                    pedido.find(
                        function(item) {

                            return (
                                item.nombre === nombre &&
                                item.tipo === "extra"
                            );

                        }
                    );


                // ========================================
                // AUMENTAR O CREAR
                // ========================================

                if (extraExistente) {

                    extraExistente.cantidad++;

                } else {

                    pedido.push({

                        nombre: nombre,

                        precio: precio,

                        cantidad: 1,

                        tipo: "extra",

                        extraSalsa: 0,

                        salsas: []

                    });

                }


                // ========================================
                // ACTUALIZAR PEDIDO
                // ========================================

                actualizarPedido();


                // ========================================
                // CONSOLA
                // ========================================

                console.log(
                    "Extra seleccionado:",
                    nombre
                );

                console.log(
                    "Precio:",
                    precio
                );

                console.log(
                    "Pedido actual:",
                    pedido
                );

            }
        );

    }
);