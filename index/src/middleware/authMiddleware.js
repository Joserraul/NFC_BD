const authMiddlewware = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'ThisIsASecretKey';

/**
 * @verefyToken Middleware para verificar el token JWT del encabezado de Autorización
 * Si es válido, adjunta la información del usuario a req.user
 * Si es inválido o falta, responde con el error apropiado
 */

const verefyToken = (req, res, next) => {

  let token; 
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decode = jwt.verefyToken(token, jwtSecret);

      req.user = {
        _id: decode._id,
        role: decode.role,
      };

      next();
    } catch (error) {
      res.status(403).json({ error: 'Token no valido' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Token no encontrado' });
  }
};
module.exports = { verefyToken };