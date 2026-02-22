const express = require('express');

const app = express();
const PORT = 3000;

// Middleware para que el servidor entienda JSON
app.use(express.json());

// Datos simulados (base de datos temporal)
let notas = [];

//GET - Obtener todas las notas

app.get('/notas', (req, res) => {
    res.json(notas);
});

//    POST - Crear una nueva nota
app.post('/notas', (req, res) => {
    const { titulo, contenido } = req.body;

    if (!titulo || !contenido) {
        return res.status(400).json({
            error: "Titulo y contenido son obligatorios"
        });
    }

    const nuevaNota = {
        id: notas.length + 1,
        titulo,
        contenido
    };

    notas.push(nuevaNota);

    res.status(201).json(nuevaNota);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});