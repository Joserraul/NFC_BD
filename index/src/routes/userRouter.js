// src/routes/userRoutes.js
const express = require('express');

// La función toma el manager instanciado como argumento
module.exports = (userManager) => {
    const router = express.Router();

    // POST /register: CREATE
    router.post('/register', async (req, res) => {
        try {
            const newUser = await userManager.createUser(req.body);
            res.status(201).json({ 
                message: "User registered successfully", 
                user: newUser 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // POST /login: Authentication
    router.post('/login', async (req, res) => {
        try {
            // Accept either english or spanish keys
            const { username, email, password, usuario, contrasena } = req.body;
            const identifier = username || email || usuario;
            const rawPassword = password || contrasena;
            if (!identifier || !rawPassword) {
                return res.status(400).json({ error: "Missing username/email or password fields." });
            }

            const result = await userManager.login(identifier, rawPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    });

    // GET /: READ All
    router.get('/', async (req, res) => {
        try {
            const users = await userManager.listUsers(true);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: "Error listing users." });
        }
    });

    // GET /:id: READ By ID
    router.get('/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const user = await userManager.findUserById(id);
            res.status(200).json(user);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    });

    // PUT /:id: UPDATE
    router.put('/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const updatedUser = await userManager.updateUser(id, req.body);
            res.status(200).json({ 
                message: `User ${id} updated successfully`,
                user: updatedUser 
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({ error: error.message });
        }
    });

    // DELETE /:id: DELETE
    router.delete('/:id', async (req, res) => {
        try {
            const id = req.params.id;
            await userManager.deleteUser(id);
            res.status(204).send(); // 204 No Content for successful deletion
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    });

    return router;
};