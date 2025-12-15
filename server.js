const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');


const app = express();
const port = process.env.PORT || 10000; 

// Middleware
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
        rejectUnauthorized: false // Permite la conexión SSL con Supabase
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.send('API de Hotspots funcionando. Accede a /api/hotspots para obtener datos.');
});

// Endpoint para obtener hotspots
app.get('/api/hotspots', async (req, res) => {
    let client;
    try {
        console.log('Intentando obtener datos de la base de datos...');
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
        console.error('Error FATAL al obtener datos de la BD:', err.message);
        console.error('Código de error:', err.code);
        console.error('#################################################');
        
        res.status(500).json({
            error: "Error interno del servidor",
            details: err.message 
        });
    } finally {
        if (client) {
            client.release(); // Liberar conexión
        }
    }
});

app.listen(port, () => {
    console.log(`API de Hotspots corriendo en el puerto: ${port}`);
});