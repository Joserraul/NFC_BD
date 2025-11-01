
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