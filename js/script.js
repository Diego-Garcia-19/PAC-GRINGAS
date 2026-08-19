// ========================================
// GRINGA.EXE
// Sistema de pedidos
// ========================================

let pedido = [];


// ========================================
// CALCULAR PRECIO DE FRESCOS
// ========================================

function calcularPrecioFrescos(cantidadFrescos, cantidadGringas) {

    if (cantidadFrescos === 0) {
        return 0;
    }

    // Sin gringa: todos cuestan $0.35
    if (cantidadGringas === 0) {
        return cantidadFrescos * 0.35;
    }

    // Con gringa:
    // Primeros 2 frescos → $0.25
    // Tercero y siguientes → $0.35

    if (cantidadFrescos <= 2) {
        return cantidadFrescos * 0.25;
    }

    return (2 * 0.25) +
           ((cantidadFrescos - 2) * 0.35);
}


// ========================================
// ACTUALIZAR PEDIDO
// ========================================

function actualizarPedido() {

    let cantidadTotal = 0;
    let totalGringas = 0;
    let cantidadGringas = 0;
    let cantidadFrescos = 0;


    // ========================================
    // CONTAR PRODUCTOS
    // ========================================

    pedido.forEach(function(producto) {

        cantidadTotal += producto.cantidad;

        if (producto.tipo === "gringa") {

            cantidadGringas += producto.cantidad;

            totalGringas +=
                producto.precio * producto.cantidad;
        }

        if (producto.tipo === "fresco") {

            cantidadFrescos += producto.cantidad;
        }

    });


    // ========================================
    // CALCULAR FRESCOS
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
        totalGringas + totalFrescos;


    // ========================================
    // ACTUALIZAR BARRA INFERIOR
    // ========================================

    document.getElementById("cantidad-pedido").textContent =
        cantidadTotal +
        (cantidadTotal === 1
            ? " producto"
            : " productos");

    document.getElementById("total-pedido").textContent =
        "$" + total.toFixed(2);


    // ========================================
    // MOSTRAR PRODUCTOS
    // ========================================

    const listaProductos =
        document.getElementById("lista-productos");


    if (pedido.length === 0) {

        listaProductos.innerHTML = `
            <p class="pedido-vacio">
                No hay productos en tu pedido.
            </p>
        `;

    } else {

        listaProductos.innerHTML = "";


        pedido.forEach(function(producto, indice) {

            let subtotal = 0;


            // ========================================
            // GRINGA
            // ========================================

            if (producto.tipo === "gringa") {

                subtotal =
                    producto.precio *
                    producto.cantidad;

            }


            // ========================================
            // FRESCO
            // ========================================

            else if (producto.tipo === "fresco") {

                subtotal =
                    (totalFrescos / cantidadFrescos) *
                    producto.cantidad;

            }


            // ========================================
            // CREAR ELEMENTO
            // ========================================

            const item =
                document.createElement("div");

            item.classList.add("item-pedido");


            item.innerHTML = `

                <div class="item-info">

                    <h3>${producto.nombre}</h3>

                    <p>
                        ${
                            producto.tipo === "fresco"
                            ? "Fresco"
                            : "$" +
                              producto.precio.toFixed(2) +
                              " c/u"
                        }
                    </p>

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
    // TOTAL DE LA VENTANA
    // ========================================

    document.getElementById("ventana-total").textContent =
        "$" + total.toFixed(2);

}


// ========================================
// AUMENTAR CANTIDAD
// ========================================

function aumentarCantidad(indice) {

    pedido[indice].cantidad++;

    actualizarPedido();

}


// ========================================
// DISMINUIR CANTIDAD
// ========================================

function disminuirCantidad(indice) {

    pedido[indice].cantidad--;

    if (pedido[indice].cantidad <= 0) {

        pedido.splice(indice, 1);

    }

    actualizarPedido();

}


// ========================================
// BOTONES DE PRODUCTOS
// ========================================

const botonesProducto =
    document.querySelectorAll(".producto button");


botonesProducto.forEach(function(boton) {

    boton.addEventListener("click", function() {

        // Obtener producto
        const producto =
            boton.closest(".producto");


        // Obtener información
        const nombre =
            producto.querySelector("h4").textContent;

        const precio =
            parseFloat(
                producto.dataset.precio
            );

        const tipo =
            producto.dataset.tipo || "gringa";


        // ========================================
        // BUSCAR PRODUCTO EXISTENTE
        // ========================================

        const productoExistente =
            pedido.find(function(item) {

                return item.nombre === nombre;

            });


        // ========================================
        // AGREGAR O AUMENTAR
        // ========================================

        if (productoExistente) {

            productoExistente.cantidad++;

        } else {

            pedido.push({

                nombre: nombre,

                precio: precio,

                cantidad: 1,

                tipo: tipo

            });

        }


        // Actualizar pedido
        actualizarPedido();


        // ========================================
        // CONSOLA
        // ========================================

        console.log(
            "Producto seleccionado:",
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

    });

});


// ========================================
// VENTANA MI PEDIDO
// ========================================

const ventanaPedido =
    document.getElementById("ventana-pedido");

const botonVerPedido =
    document.getElementById("ver-pedido");

const botonCerrarPedido =
    document.getElementById("cerrar-pedido");


// ========================================
// ABRIR
// ========================================

botonVerPedido.addEventListener(
    "click",
    function() {

        ventanaPedido.classList.add("activa");

    }
);


// ========================================
// CERRAR
// ========================================

botonCerrarPedido.addEventListener(
    "click",
    function() {

        ventanaPedido.classList.remove("activa");

    }
);