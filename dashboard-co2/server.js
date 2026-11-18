import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Ruta de datos MariaDB
app.get('/api/emisiones', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_emisiones_completas');
    const data = rows.map((row) => ({
      ...row,
      year: Number(row.year),
      population: row.population !== null ? Number(row.population) : null,
      gdp: row.gdp !== null ? Number(row.gdp) : null,
      co2: row.co2 !== null ? Number(row.co2) : null,
      co2_per_capita: row.co2_per_capita !== null ? Number(row.co2_per_capita) : null,
      coal_co2: Number(row.coal_co2 ?? 0),
      oil_co2: Number(row.oil_co2 ?? 0),
      gas_co2: Number(row.gas_co2 ?? 0),
      cement_co2: Number(row.cement_co2 ?? 0),
      flaring_co2: Number(row.flaring_co2 ?? 0)
    }));
    res.json(data);
  } catch (error) {
    console.error('Error MariaDB:', error);
    res.status(500).json({ error: 'Error consultando MariaDB' });
  }
});

// Servir los archivos compilados de React (carpeta dist)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`Observatorio ESG en producción en el puerto ${PORT}`);
});