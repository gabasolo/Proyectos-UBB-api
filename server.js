const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000; 

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configuración de la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Función de prueba de conexión al inicio
async function connectToDatabase() {
    try {
        const client = await pool.connect();
        console.log("¡Conexión a Supabase (PostgreSQL) establecida con éxito!");
        client.release(); 
    } catch (err) {
        console.error("#################################################");
        console.error("ERROR CRÍTICO: FALLÓ LA CONEXIÓN INICIAL A LA BASE DE DATOS.");
        console.error("Verifique su DATABASE_URL, contraseña y la IP IPv4.");
        console.error("Detalles del Error:", err.message);
        console.error("#################################################");
    }
}

connectToDatabase(); // Ejecutar la función de prueba

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Hotspots funcionando. Accede a /api/hotspots para obtener datos.');
});

// Endpoint para obtener hotspots
app.get('/api/hotspots', async (req, res) => {
    let client;
    try {
        console.log('Intentando obtener datos de la base de datos...');
        client = await pool.connect(); 
        
        // Consulta específica (solo activos)
        const result = await client.query(`
            SELECT id, titulo, latitud, longitud, activo
            FROM hotspots
            WHERE activo = TRUE
            ORDER BY id ASC
        `);
        
        console.log(`Consulta exitosa. Filas encontradas: ${result.rows.length}`);
        res.json(result.rows);
    } catch (err) {
        console.error('#################################################');
        console.error('Error FATAL al obtener datos de la BD:', err.message); 
        console.error('Código de error PG:', err.code);
        console.error('#################################################');
        
        res.status(500).json({
            error: "Error interno del servidor al obtener datos (Fallo de BD).",
            details: err.message || err.code || 'Error desconocido del servidor de BD' 
        });
    } finally {
        if (client) {
            client.release(); // **CRÍTICO:** Asegurar la liberación
        }
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`API de Hotspots corriendo en el puerto: ${port}`);
});