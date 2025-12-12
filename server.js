// server.js
require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 

const app = express();
const port = process.env.PORT || 10000; // Usar 10000 si Render lo exige, o 3000 si no

// Configuración de la base de datos con la URI de Supabase
// *****************************************************************
// MODIFICACIÓN CLAVE: Se pasa un objeto de configuración al Pool 
// para añadir la opción 'ssl' que resuelve el error de certificado.
// *****************************************************************
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Configuración SSL para ignorar el error 'self-signed certificate in certificate chain'
    ssl: {
        rejectUnauthorized: false
    }
});

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// -----------------------------------------------------------------
// 1. RUTA: OBTENER TODOS LOS HOTSPOTS (GET)
// -----------------------------------------------------------------
app.get('/api/hotspots', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM hotspots ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener hotspots:', err);
        // Devolvemos el mensaje de error para ayudar en la depuración
        res.status(500).json({ error: 'Error interno del servidor al obtener datos.', details: err.message });
    }
});

// -----------------------------------------------------------------
// 2. RUTA: CREAR UN NUEVO HOTSPOT (POST)
// -----------------------------------------------------------------
app.post('/api/hotspots', async (req, res) => {
    const { x, y, nombre, tipo_proyecto, estado, year, recepcionado, estudio_suelo, descripcion } = req.body;
    try {
        const query = `
            INSERT INTO hotspots (x, y, nombre, tipo_proyecto, estado, year, recepcionado, estudio_suelo, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;`;
        
        const result = await pool.query(query, [x, y, nombre, tipo_proyecto, estado, year, recepcionado, estudio_suelo, descripcion]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear hotspot:', err);
        res.status(500).json({ error: 'Error al crear el hotspot.' });
    }
});

// -----------------------------------------------------------------
// 3. RUTA: ACTUALIZAR UN HOTSPOT (PUT)
// -----------------------------------------------------------------
app.put('/api/hotspots/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre, tipo_proyecto, estado, year, recepcionado, estudio_suelo, descripcion } = req.body;
    
    try {
        const query = `
            UPDATE hotspots
            SET nombre = $1, tipo_proyecto = $2, estado = $3, year = $4, recepcionado = $5, estudio_suelo = $6, descripcion = $7
            WHERE id = $8
            RETURNING *;`;
        
        const result = await pool.query(query, [nombre, tipo_proyecto, estado, year, recepcionado, estudio_suelo, descripcion, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Hotspot no encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar hotspot:', err);
        res.status(500).json({ error: 'Error al actualizar el hotspot.' });
    }
});

// -----------------------------------------------------------------
// 4. RUTA: ELIMINAR UN HOTSPOT (DELETE)
// -----------------------------------------------------------------
app.delete('/api/hotspots/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM hotspots WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Hotspot no encontrado.' });
        }
        res.status(204).send(); 
    } catch (err) {
        console.error('Error al eliminar hotspot:', err);
        res.status(500).json({ error: 'Error al eliminar el hotspot.' });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`API de Hotspots corriendo en http://localhost:${port}`);
});

// Pequeño cambio para forzar el despliegue

