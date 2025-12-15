// **********************************************
// ** CONFIGURACIÓN DE LA API DE VERCEL
// **********************************************
// ** PEGAR LA URL DE TU SERVICIO EN VERCEL **
const API_BASE_URL = 'https://proyectos-ubb-frontend.vercel.app'; 
// **********************************************

let isDrawing = false;
let currentHotspot = null;
let isModalOpen = false;
let showAllHotspots = false;

const DOM_ELEMENTS = {
    imageContainer: document.getElementById('image-container'),
    hotspotWrapper: document.getElementById('hotspot-wrapper'),
    mainModal: document.getElementById('main-modal'),
    modalContent: document.getElementById('modal-content'),
    adminBtn: document.getElementById('admin-btn'),
    reportBtn: document.getElementById('report-btn'),
    licitacionBtn: document.getElementById('licitacion-btn'), // NUEVO
    projectImage: document.getElementById('project-image'),
    yearFilterStart: document.getElementById('year-filter-start'),
    yearFilterEnd: document.getElementById('year-filter-end'),
    receptionFilterSi: document.getElementById('filter-recepcionado-si'),
    receptionFilterNo: document.getElementById('filter-recepcionado-no'),
    showButtonsBtn: document.getElementById('show-buttons-btn'),
    hiddenButtonsContainer: document.getElementById('hidden-buttons-container'),
    estudioSueloFilterContainer: document.getElementById('estudio-suelo-filter'),
    estudioSueloFilterSi: document.getElementById('filter-suelo-si'),
    estudioSueloFilterNo: document.getElementById('filter-suelo-no')
};

// **********************************************
// ** Funciones de Utilidad
// **********************************************

// Función para obtener datos de la API
async function fetchHotspots() {
    let url = `${API_BASE_URL}/api/hotspots`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error al obtener hotspots:", error);
        alert(`Error al cargar datos: ${error.message}. Verifique la conexión a la API.`);
        return [];
    }
}

// Función para filtrar los datos según la interfaz de usuario
function filterHotspots(hotspots) {
    if (!showAllHotspots) return [];

    const yearStart = parseInt(DOM_ELEMENTS.yearFilterStart.value);
    const yearEnd = parseInt(DOM_ELEMENTS.yearFilterEnd.value);

    const filterRecepcionSi = DOM_ELEMENTS.receptionFilterSi.checked;
    const filterRecepcionNo = DOM_ELEMENTS.receptionFilterNo.checked;

    const filterSueloSi = DOM_ELEMENTS.estudioSueloFilterSi.checked;
    const filterSueloNo = DOM_ELEMENTS.estudioSueloFilterNo.checked;

    return hotspots.filter(h => {
        const yearMatch = h.ano >= yearStart && h.ano <= yearEnd;
        
        let recepcionMatch;
        if (filterRecepcionSi && filterRecepcionNo) {
            recepcionMatch = true;
        } else if (filterRecepcionSi) {
            recepcionMatch = h.recepcionado === 'Sí';
        } else if (filterRecepcionNo) {
            recepcionMatch = h.recepcionado === 'No';
        } else {
            recepcionMatch = false;
        }

        let sueloMatch;
        if (filterSueloSi && filterSueloNo) {
            sueloMatch = true;
        } else if (filterSueloSi) {
            sueloMatch = h.estudio_suelo === 'Sí';
        } else if (filterSueloNo) {
            sueloMatch = h.estudio_suelo === 'No';
        } else {
            sueloMatch = false;
        }

        return yearMatch && recepcionMatch && sueloMatch;
    });
}

// Función para renderizar los hotspots en el mapa
async function renderHotspots() {
    const allHotspots = await fetchHotspots();
    const filteredHotspots = filterHotspots(allHotspots);

    // Limpiar hotspots existentes
    DOM_ELEMENTS.hotspotWrapper.innerHTML = '';
    
    // Si la bandera está apagada, solo muestra el botón de mostrar
    if (!showAllHotspots) return;

    // Obtener dimensiones de la imagen
    const imgWidth = DOM_ELEMENTS.projectImage.naturalWidth;
    const imgHeight = DOM_ELEMENTS.projectImage.naturalHeight;
    const containerWidth = DOM_ELEMENTS.hotspotWrapper.clientWidth;
    const containerHeight = DOM_ELEMENTS.hotspotWrapper.clientHeight;

    filteredHotspots.forEach(hotspot => {
        // Calcular posición en porcentaje del contenedor
        const xPercent = (hotspot.x_coord / imgWidth) * 100;
        const yPercent = (hotspot.y_coord / imgHeight) * 100;

        const div = document.createElement('div');
        div.className = 'hotspot';
        div.style.left = `${xPercent}%`;
        div.style.top = `${yPercent}%`;
        
        // Asignar clase de color según el estado
        let colorClass = '';
        if (hotspot.estado === 'Proyecto') {
            colorClass = 'bg-red-600 hover:bg-red-700';
        } else if (hotspot.estado === 'Obra') {
            colorClass = 'bg-yellow-500 hover:bg-yellow-600';
        } else if (hotspot.estado === 'Recepcionado') {
            colorClass = 'bg-blue-600 hover:bg-blue-700';
        }
        
        div.classList.add(colorClass);

        // Al hacer clic, mostrar modal
        div.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que se dispare el evento del contenedor
            showHotspotModal(hotspot);
        });

        DOM_ELEMENTS.hotspotWrapper.appendChild(div);
    });
}

// Función para mostrar el modal de detalles del hotspot
function showHotspotModal(hotspot) {
    let headerClass = '';
    if (hotspot.estado === 'Proyecto') {
        headerClass = 'modal-header-proyecto';
    } else if (hotspot.estado === 'Obra') {
        headerClass = 'modal-header-obra';
    } else if (hotspot.estado === 'Recepcionado') {
        headerClass = 'modal-header-recepcionado';
    }

    const content = `
        <div class="p-6">
            <div class="${headerClass} text-white p-4 rounded-t-lg">
                <h3 class="text-xl font-bold">${hotspot.nombre_proyecto}</h3>
                <p class="text-sm">Estado: ${hotspot.estado}</p>
            </div>
            <div class="p-4 space-y-3">
                <p><strong>Código:</strong> ${hotspot.codigo}</p>
                <p><strong>Año:</strong> ${hotspot.ano}</p>
                <p><strong>Ubicación:</strong> ${hotspot.ubicacion}</p>
                <p><strong>Presupuesto:</strong> $${hotspot.presupuesto ? parseFloat(hotspot.presupuesto).toLocaleString('es-CL') : 'N/A'}</p>
                <p><strong>Superficie (m²):</strong> ${hotspot.superficie}</p>
                <p><strong>Estudio de Suelo:</strong> ${hotspot.estudio_suelo}</p>
                <p><strong>Licitación:</strong> ${hotspot.licitacion}</p>
                <p><strong>Recepcionado:</strong> ${hotspot.recepcionado}</p>
                <p><strong>Dirección:</strong> ${hotspot.direccion}</p>
            </div>
        </div>
    `;

    DOM_ELEMENTS.modalContent.innerHTML = content;
    showModal();
}

// Función para mostrar el modal del panel de administrador
function showAdminModal() {
    if (!showAllHotspots) {
        alert("Primero debe hacer clic en 'Mostrar Hotspots' para acceder a esta función.");
        return;
    }
    const content = `
        <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Panel de Administrador (Coordenadas)</h3>
            <p class="mb-4 text-sm text-gray-600">Haga clic en el mapa para marcar una nueva posición. Las coordenadas se guardarán automáticamente en la base de datos.</p>
            <button id="close-admin-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cerrar</button>
        </div>
    `;
    DOM_ELEMENTS.modalContent.innerHTML = content;
    DOM_ELEMENTS.mainModal.classList.remove('hidden');
    isModalOpen = true;

    document.getElementById('close-admin-btn').addEventListener('click', hideModal);

    // Activar modo de dibujo
    isDrawing = true;
    DOM_ELEMENTS.imageContainer.classList.add('drawing-mode');
}

// Función para mostrar el modal de reportes
function showReportModal() {
    if (!showAllHotspots) {
        alert("Primero debe hacer clic en 'Mostrar Hotspots' para acceder a esta función.");
        return;
    }

    fetchHotspots().then(allHotspots => {
        const filteredHotspots = filterHotspots(allHotspots);

        const totalPresupuesto = filteredHotspots.reduce((sum, h) => sum + (parseFloat(h.presupuesto) || 0), 0);
        const totalSuperficie = filteredHotspots.reduce((sum, h) => sum + (parseFloat(h.superficie) || 0), 0);
        
        const proyectosPorEstado = filteredHotspots.reduce((acc, h) => {
            acc[h.estado] = (acc[h.estado] || 0) + 1;
            return acc;
        }, {});
        
        const labels = Object.keys(proyectosPorEstado);
        const data = Object.values(proyectosPorEstado);
        
        const content = `
            <div class="p-6 w-full">
                <h3 class="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">Reporte de Proyectos Filtrados</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gray-100 p-3 rounded-lg text-center">
                        <p class="text-sm text-gray-600">Total Proyectos</p>
                        <p class="text-2xl font-extrabold text-indigo-600">${filteredHotspots.length}</p>
                    </div>
                    <div class="bg-gray-100 p-3 rounded-lg text-center">
                        <p class="text-sm text-gray-600">Presupuesto Total</p>
                        <p class="text-xl font-extrabold text-green-600">$${totalPresupuesto.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</p>
                    </div>
                    <div class="bg-gray-100 p-3 rounded-lg text-center">
                        <p class="text-sm text-gray-600">Superficie Total (m²)</p>
                        <p class="text-xl font-extrabold text-purple-600">${totalSuperficie.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-2">Proyectos por Estado</h4>
                    <div class="h-64">
                        <canvas id="estadoChart"></canvas>
                    </div>
                </div>

                <h4 class="text-lg font-semibold mb-2 border-t pt-4">Detalle por Proyecto</h4>
                <div class="report-table-container overflow-y-auto max-h-96">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="report-table-header">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presupuesto ($)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Superficie (m²)</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${filteredHotspots.map(h => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${h.codigo}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${h.nombre_proyecto}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${h.estado === 'Proyecto' ? 'bg-red-100 text-red-800' : 
                                              h.estado === 'Obra' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-blue-100 text-blue-800'}">
                                            ${h.estado}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${parseFloat(h.presupuesto).toLocaleString('es-CL', { minimumFractionDigits: 0 })}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(h.superficie).toLocaleString('es-CL', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

            </div>
        `;

        DOM_ELEMENTS.modalContent.innerHTML = content;
        showModal();

        // Inicializar el gráfico después de que el modal se haya mostrado
        const ctx = document.getElementById('estadoChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#dc2626', '#f59e0b', '#2563eb'], // Colores para Proyecto, Obra, Recepcionado
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top