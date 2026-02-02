const NUMERO_WHATSAPP = "59172216385"; 

let productos = JSON.parse(localStorage.getItem('productos_catalogo')) || [];
let carrito = [];
let categoriaActual = "Todas";
let fotoBase64 = "";

document.getElementById('titulo-tienda').addEventListener('dblclick', () => mostrarSeccion('admin'));

const inputFoto = document.getElementById('input-foto');
inputFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
        fotoBase64 = reader.result;
        document.getElementById('img-preview').src = fotoBase64;
        document.getElementById('previsualizacion').classList.remove('hidden');
    };

    if (file) reader.readAsDataURL(file);
});

function mostrarSeccion(seccion) {
    document.getElementById('seccion-cliente').classList.toggle('hidden', seccion !== 'cliente');
    document.getElementById('seccion-admin').classList.toggle('hidden', seccion !== 'admin');
    if(seccion === 'cliente') {
        actualizarVistaTienda();
        renderizarCategorias();
    } else {
        actualizarVistaAdmin();
    }
}

const form = document.getElementById('form-producto');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const nombre = document.getElementById('nombre').value;
    const precio = Number(document.getElementById('precio').value);
    const categoria = document.getElementById('categoria').value;

    let imgFinal = fotoBase64;
    if (id && !fotoBase64) {
        imgFinal = productos.find(p => p.id == id).img;
    }

    if (id) {
        productos = productos.map(p => p.id == id ? {id: Number(id), nombre, precio, categoria, img: imgFinal} : p);
    } else {
        productos.push({ id: Date.now(), nombre, precio, categoria, img: imgFinal });
    }

    guardarYLimpiar();
});

function guardarYLimpiar() {
    localStorage.setItem('productos_catalogo', JSON.stringify(productos));
    form.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('previsualizacion').classList.add('hidden');
    fotoBase64 = "";
    actualizarVistaAdmin();
}

function prepararEdicion(id) {
    const p = productos.find(p => p.id === id);
    document.getElementById('edit-id').value = p.id;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('precio').value = p.precio;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('img-preview').src = p.img;
    document.getElementById('previsualizacion').classList.remove('hidden');
    window.scrollTo(0,0);
}

function renderizarCategorias() {
    const contenedor = document.getElementById('filtros-categorias');
    const categoriasUnicas = ["Todas", ...new Set(productos.map(p => p.categoria))];
    contenedor.innerHTML = categoriasUnicas.map(cat => `
        <button onclick="filtrarPorCategoria('${cat}')" 
            class="px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${categoriaActual === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}">
            ${cat}
        </button>
    `).join('');
}

function filtrarPorCategoria(cat) {
    categoriaActual = cat;
    renderizarCategorias();
    actualizarVistaTienda();
}

function actualizarVistaTienda() {
    const grid = document.getElementById('grid-productos');
    const filtrados = categoriaActual === "Todas" ? productos : productos.filter(p => p.categoria === categoriaActual);

    grid.innerHTML = filtrados.map(p => `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">
            <img src="${p.img || 'https://via.placeholder.com/150'}" class="w-28 h-28 object-cover">
            <div class="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-gray-800 leading-tight">${p.nombre}</h3>
                    <p class="text-[10px] text-gray-400 uppercase font-black">${p.categoria}</p>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-green-600 font-black text-lg">${p.precio} Bs</span>
                    <button onclick="agregarAlCarrito(${p.id})" class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition shadow-lg shadow-blue-100">+ Añadir</button>
                </div>
            </div>
        </div>
    `).join('');
}


function eliminarProducto(id) {
    if(confirm('¿Eliminar producto?')) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('productos_catalogo', JSON.stringify(productos));
        actualizarVistaAdmin();
    }
}

function agregarAlCarrito(id) {
    const p = productos.find(p => p.id === id);
    const existe = carrito.find(item => item.id === id);
    if (existe) existe.cantidad++;
    else carrito.push({ ...p, cantidad: 1 });
    actualizarInterfazCarrito();
}

function cambiarCantidad(id, delta) {
    const item = carrito.find(p => p.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) carrito = carrito.filter(p => p.id !== id);
    }
    actualizarInterfazCarrito();
}

function toggleCarrito() {
    if(carrito.length > 0) document.getElementById('ventana-carrito').classList.toggle('hidden');
}

function actualizarInterfazCarrito() {
    const total = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
    document.getElementById('barra-carrito').classList.toggle('hidden', carrito.length === 0);
    document.getElementById('badge-carrito').innerText = unidades;
    document.getElementById('total-barra').innerText = `${total.toFixed(2)} Bs`;
    document.getElementById('total-ventana').innerText = `${total.toFixed(2)} Bs`;

    document.getElementById('items-carrito').innerHTML = carrito.map(i => `
        <div class="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
            <div><p class="font-bold text-gray-800">${i.nombre}</p><p class="text-sm text-green-600 font-bold">${(i.precio * i.cantidad).toFixed(2)} Bs</p></div>
            <div class="flex items-center gap-4 bg-white p-1 rounded-xl border">
                <button onclick="cambiarCantidad(${i.id}, -1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xl">-</button>
                <span class="w-4 text-center font-bold text-lg">${i.cantidad}</span>
                <button onclick="cambiarCantidad(${i.id}, 1)" class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl">+</button>
            </div>
        </div>
    `).join('');
    if (carrito.length === 0) document.getElementById('ventana-carrito').classList.add('hidden');
}

function enviarPedido() {
    const total = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    let msj = `*NUEVO PEDIDO*%0A---------------------------%0A`;
    carrito.forEach(i => msj += `${i.cantidad}x ${i.nombre} - ${(i.precio * i.cantidad)} Bs%0A`);
    msj += `---------------------------%0A*TOTAL: ${total.toFixed(2)} Bs*`;
    window.open(`https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${msj}`, '_blank');
}

function actualizarVistaAdmin() {
    document.getElementById('lista-admin').innerHTML = productos.map(p => `
        <div class="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
            <div><p class="font-bold text-gray-700">${p.nombre}</p><p class="text-[10px] text-gray-400 font-bold uppercase">${p.categoria}</p></div>
            <div class="flex gap-4">
                <button onclick="prepararEdicion(${p.id})" class="text-blue-500 text-xl"><i class="fas fa-edit"></i></button>
                <button onclick="eliminarProducto(${p.id})" class="text-red-400 text-xl"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

actualizarVistaTienda();
renderizarCategorias();