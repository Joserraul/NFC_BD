
const express = require('express');
const bodyParser = require('body-parser');


const UserManager = require('./src/manager/userManager');
const userRoutes = require('./src/routes/userRouter');

const app = express();
const PORT = 3000;

// Parse JSON and keep a copy of the raw body for debugging malformed JSON
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        try {
            req.rawBody = buf.toString(encoding || 'utf8');
        } catch (e) {
            req.rawBody = '';
        }
    }
}));


const userManager = new UserManager('./src/manager/data/users.json');

app.use('/api/users', userRoutes(userManager)); 


app.get('/', (req, res) => {
    res.send('API running. Access user routes at /api/users');
});

// Endpoint used por el lector (ESP32) para verificar UID de tarjeta
const crypto = require('crypto');
app.post('/api/verify', express.json(), async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ status: 'ERROR', message: 'uid required' });

        // hash del uid para comparar con idCard almacenado (se usa SHA256 en userManager)
        const uidHash = crypto.createHash('sha256').update(uid).digest('hex');

        // obtener usuarios (no seguro-mode) y buscar match en idCard
        const users = await userManager.listUsers(false);
        const found = users.find(u => u.idCard === uidHash);

        if (found) {
            return res.json({ status: 'OK', user: found.username || found.email || null });
        }

        return res.json({ status: 'DENIED' });
    } catch (err) {
        console.error('Error en /api/verify:', err);
        return res.status(500).json({ status: 'ERROR', message: 'internal' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`User routes available at http://localhost:${PORT}/api/users`);
});

// Error handler to catch malformed JSON from body parser
app.use((err, req, res, next) => {
    // body-parser (used by express.json) sets err.type = 'entity.parse.failed' for JSON parse errors
    const isBodyParserError = err && (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err));
    if (isBodyParserError) {
        console.error('Malformed JSON received:', err.message || err);
        console.error('Raw body:', req.rawBody);
        return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    next(err);
});