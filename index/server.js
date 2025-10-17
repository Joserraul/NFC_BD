// src/server.js
const express = require('express');
const bodyParser = require('body-parser');

// Importar clases y rutas desde la estructura de carpetas
const UserManager = require('./managers/UserManager');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

// 1. Inicialización de la Lógica de Negocio
// La ruta es relativa a la carpeta raíz del proyecto, no a 'src'
const userManager = new UserManager('./data/usuarios.json');

// 2. Conexión de las Rutas
// Pasamos la instancia de userManager al módulo de rutas
app.use('/api/users', userRoutes(userManager)); 

// Ruta de prueba (opcional)
app.get('/', (req, res) => {
    res.send('API running. Access user routes at /api/users');
});

// 3. Inicio del Servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`User routes available at http://localhost:${PORT}/api/users`);
});