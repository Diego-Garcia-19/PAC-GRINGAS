// ========================================
// GRINGA.EXE
// Sistema de pedidos
// ========================================
let pedido = [];

// ========================================
// ACTUALIZAR BARRA DEL PEDIDO
// ========================================
function actualizarPedido() {
    let cantidadTotal = 0;
    let total = 0;
    pedido.forEach(function(producto) {
        cantidadTotal += producto.cantidad;
        total += producto.precio * producto.cantidad;
    });

    // Actualizar barra inferior
    document.getElementById("cantidad-pedido").textContent =
        cantidadTotal + (cantidadTotal === 1 ? " producto" : " productos");

    document.getElementById("total-pedido").textContent =
        "$" + total.toFixed(2);
    // ========================================
    // MOSTRAR PRODUCTOS EN LA VENTANA
    // ========================================
    const listaProductos = document.getElementById("lista-productos");
    if (pedido.length === 0) {
        listaProductos.innerHTML = `
            <p class="pedido-vacio">
                No hay productos en tu pedido.
            </p>
        `;
    } else {
        listaProductos.innerHTML = "";
        pedido.forEach(function(producto, indice) {
            const subtotal = producto.precio * producto.cantidad;
            const item = document.createElement("div");
            item.classList.add("item-pedido");
            item.innerHTML = `
                <div class="item-info">
                    <h3>${producto.nombre}</h3>
                    <p>$${producto.precio.toFixed(2)} c/u</p>
                </div>
                <div class="item-controles">
                    <button type="button" onclick="disminuirCantidad(${indice})">
                        −
                    </button>
                    <span>${producto.cantidad}</span>
                    <button type="button" onclick="aumentarCantidad(${indice})">
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
    // Actualizar total de la ventana
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
const botonesProducto = document.querySelectorAll(".producto button");
botonesProducto.forEach(function(boton) {
    boton.addEventListener("click", function() {
        // Obtener producto
        const producto = boton.closest(".producto");

        // Obtener nombre y precio
        const nombre = producto.querySelector("h4").textContent;
        const precio = parseFloat(producto.dataset.precio);

        // ========================================
        // BUSCAR SI EL PRODUCTO YA EXISTE
        // ========================================
        const productoExistente = pedido.find(function(item) {
            return item.nombre === nombre;
        });

        // ========================================
        // AGREGAR O AUMENTAR CANTIDAD
        // ========================================
        if (productoExistente) {
            productoExistente.cantidad++;
        } else {
            pedido.push({
                nombre: nombre,
                precio: precio,
                cantidad: 1
            });

        }

        // Actualizar barra
        actualizarPedido();

        // Mostrar información en consola
        console.log("Producto seleccionado:", nombre);
        console.log("Precio:", precio);
        console.log("Pedido actual:", pedido);
    });

});

// ========================================
// VENTANA MI PEDIDO
// ========================================

const ventanaPedido = document.getElementById("ventana-pedido");
const botonVerPedido = document.getElementById("ver-pedido");
const botonCerrarPedido = document.getElementById("cerrar-pedido");


// Abrir ventana
botonVerPedido.addEventListener("click", function() {
    ventanaPedido.classList.add("activa");
});

// Cerrar ventana
botonCerrarPedido.addEventListener("click", function() {
    ventanaPedido.classList.remove("activa");
});