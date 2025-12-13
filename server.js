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

// Configuración de la base de datos
// Utiliza la variable de entorno DATABASE_URL, la cual Render ya configura.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
    // IMPORTANTE: Se asume que la variable NODE_TLS_REJECT_UNAUTHORIZED=0 está activa en Render
    // para manejar los certificados SSL de Supabase. Si no funciona, puede intentar descomentar
    // la configuración SSL aquí (aunque la variable de entorno es más limpia):
    /*
    ssl: {
        rejectUnauthorized: false
    }
    */
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Hotspots funcionando. Accede a /api/hotspots para obtener datos.');
});

// Endpoint para obtener hotspots
app.get('/api/hotspots', async (req, res) => {
    try {
        console.log('Intentando obtener datos de la base de datos...');
        const result = await pool.query('SELECT * FROM hotspots ORDER BY id ASC'); 
        console.log(`Consulta exitosa. Filas encontradas: ${result.rows.length}`);
        res.json(result.rows);
    } catch (err) {
        // ***********************************************
        // ESTE BLOQUE ES CRÍTICO PARA EL DIAGNÓSTICO FINAL
        // ***********************************************
        
        // 1. Imprimir el error completo en la consola de Render
        console.error('#################################################');
        console.error('Error FATAL de CONEXIÓN a la BD (Supabase):', err.message); 
        console.error('Código de error PG:', err.code);
        console.error('#################################################');
        
        // 2. Enviar el error específico al frontend (Vercel)
        res.status(500).json({
            error: "Error interno del servidor al obtener datos (Fallo de BD).",
            // Esto expondrá el mensaje de error REAL de Supabase/PostgreSQL (ej: 'password authentication failed for user "postgres"')
            details: err.message || err.code || 'Error desconocido del servidor de BD' 
        });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`API de Hotspots corriendo en el puerto: ${port}`);
});