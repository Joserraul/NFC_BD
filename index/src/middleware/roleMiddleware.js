/**
 * @checkRole Middleware para verificar si el usuario tiene uno de los roles permitidos
 * @param {Array} allowedRoles - Array de roles permitidos (e.g., ['admin', 'portero'])
 * @returns Middleware que verifica el rol del usuario
 */

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Acceso denegado, no se encuentra ese rol' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
    }

    next();
  };
};

module.exports = { checkRole };