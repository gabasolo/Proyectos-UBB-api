const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000; // Usa el puerto 10000 para Render, o la variable PORT si existe

// Middleware
app.use(cors({
    origin: '*', // Permite todas las solicitudes (ajustar si se conoce el dominio del frontend)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configuración de la base de datos con la URI de Supabase
// NOTA: Se asume que la variable de entorno NODE_TLS_REJECT_UNAUTHORIZED=0 está activa en Render.
// Por lo tanto, no se requiere configuración SSL aquí.

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
    // Si la URI es la de 5432 y el error de SSL regresa, descomentar esto:
    /* ssl: {
        rejectUnauthorized: false
    }
    */
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Hotspots está funcionando. Accede a /api/hotspots para obtener datos.');
});

// Endpoint para obtener hotspots
app.get('/api/hotspots', async (req, res) => {
    try {
        // Ejecución de la consulta SQL
        const result = await pool.query('SELECT * FROM hotspots ORDER BY id ASC'); 
        res.json(result.rows);
    } catch (err) {
        // ***********************************************
        // NUEVA LÓGICA DE MANEJO DE ERRORES CRÍTICA
        // ***********************************************

        // Imprimir el error completo en la consola de Render para la depuración
        console.error('Error FATAL al obtener hotspots:', err.message, err.code); 
        
        // Enviar el error específico al frontend (Vercel) para que podamos verlo en la consola del navegador
        res.status(500).json({
            error: "Error interno del servidor al obtener datos.",
            // Esto expondrá el código o mensaje real de Supabase/PostgreSQL (ej: 'invalid password')
            details: err.message || err.code || 'Error desconocido del servidor de BD' 
        });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`API de Hotspots corriendo en http://localhost:${port}`);
});
