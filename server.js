const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
// La librería dotenv ya no es estrictamente necesaria en Render si usa variables de entorno directas.
// require('dotenv').config(); 

const app = express();
// Usa el puerto proporcionado por Render, que es obligatorio.
const port = process.env.PORT || 10000; 

// Middleware
// Configuración de CORS para permitir solicitudes desde cualquier origen (su frontend Vercel, por ejemplo).
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ******************************************************
// BLOQUE DE CÓDIGO CLAVE A MODIFICAR
// ******************************************************

// Configuración de la base de datos
// Utiliza la variable de entorno DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // INSERCIÓN DE LA CONFIGURACIÓN SSL
    ssl: {
        rejectUnauthorized: false // Desactiva la verificación del certificado SSL para Supabase en Render
    }
});

// ******************************************************

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Hotspots funcionando. Accede a /api/hotspots para obtener datos.');
});

// Endpoint para obtener hotspots
app.get('/api/hotspots', async (req, res) => {
    try {
        console.log('Intentando obtener datos de la base de datos...');
        // Consulta para obtener solo los puntos activos, ya que es el modo por defecto del frontend
        const result = await pool.query('SELECT * FROM hotspots WHERE activo = TRUE ORDER BY id ASC');
        console.log(`Consulta exitosa. Filas encontradas: ${result.rows.length}`);
        res.json(result.rows);
    } catch (err) {
        
        // Bloque de manejo de errores mejorado
        console.error('#################################################');
        console.error('Error FATAL al obtener datos de la BD:', err.message); 
        console.error('Código de error PG:', err.code);
        console.error('#################################################');
        
        res.status(500).json({
            error: "Error interno del servidor al obtener datos (Fallo de BD).",
            details: err.message || err.code || 'Error desconocido del servidor de BD' 
        });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`API de Hotspots corriendo en el puerto: ${port}`);
});