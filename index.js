const express = require('express');
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// ======================================================
// 1. BASE DE DATOS SQL (SQLite - CRUD de Usuarios)
// ======================================================
const dbPath = path.resolve(__dirname, 'usuarios.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQL:', err.message);
  } else {
    console.log('Conectado con exito a la Base de Datos Relacional SQL (SQLite)');
  }
});

// Crear tabla 'users' en SQL
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'usuario'
  )
`);

// --- ENDPOINTS CRUD USUARIOS (SQL) ---
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, role } = req.body;
  db.run(
    'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
    [name, email, role || 'usuario'],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, email, role: role || 'usuario' });
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, role } = req.body;
  db.run(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
    [name, email, role, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Usuario actualizado en SQL', changes: this.changes });
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', req.params.id, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'Usuario eliminado de SQL', changes: this.changes });
  });
});

// ======================================================
// 2. BASE DE DATOS NOSQL (MongoDB Atlas - Eventos/Logs)
// ======================================================
const MONGO_URI = 'mongodb://60864608_db_user:ositomuerto123@ac-jpglomu-shard-00-00.wc8pgoh.mongodb.net:27017,ac-jpglomu-shard-00-01.wc8pgoh.mongodb.net:27017,ac-jpglomu-shard-00-02.wc8pgoh.mongodb.net:27017/miapp?ssl=true&replicaSet=atlas-w8mz1u-shard-0&authSource=admin';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado con exito a MongoDB Atlas'))
  .catch((err) => console.error('Error de conexion a MongoDB:', err.message));

const EventLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['EVENTO', 'LOG'], default: 'LOG' },
  createdAt: { type: Date, default: Date.now }
});

const EventLog = mongoose.model('EventLog', EventLogSchema);

// --- ENDPOINTS CRUD EVENTOS (MongoDB) ---
app.get('/api/events', async (req, res) => {
  try {
    const logs = await EventLog.find();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const newLog = new EventLog(req.body);
    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const updatedLog = await EventLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await EventLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registro eliminado con éxito de MongoDB' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({ status: "OK", message: "API RESTful Hibrida (SQL + MongoDB) funcionando" });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});