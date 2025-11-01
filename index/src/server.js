
const express = require('express');
const bodyParser = require('body-parser');


const UserManager = require('./managers/UserManager');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());


const userManager = new UserManager('./data/usuarios.json');

app.use('/api/users', userRoutes(userManager)); 


app.get('/', (req, res) => {
    res.send('API running. Access user routes at /api/users');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`User routes available at http://localhost:${PORT}/api/users`);
});