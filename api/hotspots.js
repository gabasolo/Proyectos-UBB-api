// const express = require('express'); // Eliminamos Express para la estructura Serverless
const { Pool } = require('pg');
const cors = require('cors');

// La lógica DNS fallida ya fue eliminada con el git push anterior.

// Configuramos la aplicación para que Vercel la pueda usar
const app = require('express')(); // Todavía usamos Express para middleware y rutas
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(require('express').json());

// Configuración de la base de datos (USAMOS LA CONEXIÓN POOLER)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Permite la conexión SSL con Supabase
    }
});

// Endpoint para obtener hotspots (AQUÍ PONEMOS LA LÓGICA DE SU RUTA ANTERIOR)
app.get('/api/hotspots', async (req, res) => {
    let client;
    try {
        console.log('Intentando obtener datos de la base de datos (Vercel)...');
        client = await pool.connect();
        
        // Consulta solo puntos activos
        const result = await client.query(`
            SELECT * FROM hotspots 
            WHERE activo = TRUE 
            ORDER BY id ASC
        `);
        
        console.log(`Consulta exitosa. Filas encontradas: ${result.rows.length}`);
        res.json(result.rows);
    } catch (err) {
        console.error('#################################################');
        console.error('Error FATAL al obtener datos de la BD (Vercel):', err.message);
        console.error('Código de error:', err.code);
        console.error('#################################################');
        
        res.status(500).json({
            error: "Error interno del servidor (Vercel)",
            details: err.message 
        });
    } finally {
        if (client) {
            client.release(); // Liberar conexión
        }
    }
});

// Exportamos la función de manejo para Vercel
module.exports = app;