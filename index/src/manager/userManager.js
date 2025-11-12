const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * @UserManager Clase para gestionar usuarios almacenados en un archivo JSON
 * Métodos:
 * - createUser(userData): Crea un nuevo usuario con los datos proporcionados.
 * - listUsers(noSecure): Obtiene una lista de usuarios (seguro o no seguro).
 * - getUserById(id): Obtiene un usuario por su ID.
 * - updateUser(id, updateData): Actualiza los datos de un usuario existente.
 * - deleteUser(id): Elimina un usuario por su ID.
 * - login(identifier, password): Autentica un usuario con el identificador y la contraseña proporcionados.
 * Nota: El identificador puede ser el nombre de usuario o el correo electrónico.
 * Los datos del usuario se normalizan para aceptar tanto nombres de campos en inglés como en español.
 * Los campos sensibles como contraseñas se manejan de forma segura (hashing).
 * Los ID de tarjetas se almacenan como hashes SHA256 para mayor seguridad.
 */

class UserManager {
  constructor(filepath) {
    this.path = path.resolve(filepath);
    this.users = [];
    this.init(); 
  }

  async init() {
    try {
      await fs.access(this.path);
      const data = await fs.readFile(this.path, 'utf-8');
      if (data.trim() === '') {
        this.users = [];
        await this.save();
      } else {
        const raw = JSON.parse(data);
        // Normalize loaded users to English field names
        this.users = raw.map(u => ({
          id: Number(u.id) || (u.id ? Number(u.id) : undefined),
          username: u.username || u.usuario || '',
          email: u.email || u.correo || '',
          password: u.password || u.contrasena || '',
          phone: u.phone || u.telefono || '',
          department: u.department || u.departamento || '',
          idCard: u.idCard || u.IDcard || '',
          createdAt: u.createdAt || u.fechaCreacion || Date.now(),
          role: u.role || u.rol || 'usuario',
          active: typeof u.active === 'boolean' ? u.active : (u.active !== undefined ? u.active : true)
        }));
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.users = [];
        await this.save();
      } else {
        console.error('Error initializing UserManager:', error);
        throw error;
      }
    }
  }

  async save() {
    try {
      await fs.mkdir(path.dirname(this.path), { recursive: true });
      await fs.writeFile(this.path, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  async createUser(userData) {
    await this.listUsers(false);

    // Accept both Spanish and English input keys
    const username = userData.username || userData.usuario;
    const email = userData.email || userData.correo;
    const rawPassword = userData.password || userData.contrasena;
    const phone = userData.phone || userData.telefono || '';
    const department = userData.department || userData.departamento || '';
    const idCardRaw = userData.idCard || userData.IDcard || '';
    const role = userData.role || userData.rol || 'usuario';

    const required = { username, email, rawPassword, phone, department };
    const missing = Object.keys(required).filter(k => !required[k]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Uniqueness checks against normalized storage
    if (this.users.some(u => u.username === username)) {
      throw new Error(`Username '${username}' is already in use.`);
    }
    if (this.users.some(u => u.email === email)) {
      throw new Error(`Email '${email}' is already registered.`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const emptyIDCardEncrypted = crypto
      .createHash('sha256')
      .update(idCardRaw || '')
      .digest('hex');

    const newUser = {
      id: this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1,
      username,
      email,
      password: hashedPassword,
      phone,
      department,
      idCard: emptyIDCardEncrypted,
      createdAt: Date.now(),
      role,
      active: true
    };

    this.users.push(newUser);
    await this.save();

    const { password, ...userPublic } = newUser;
    return userPublic;
  }
  async login(identifier, rawPassword) {
    await this.listUsers(false);

    // identifier can be username or email (also accept spanish param names)
    const id = identifier || identifier === 0 ? identifier : null;
    const user = this.users.find(u => u.username === id || u.email === id || u.usuario === id || u.correo === id);
    if (!user) {
      throw new Error('Incorrect username or password.');
    }

    const passwordMatches = await bcrypt.compare(rawPassword, user.password);
    if (!passwordMatches) {
      throw new Error('Incorrect username or password.');
    }

    const { password, ...userPublic } = user;
    return {
      message: 'Login successful',
      user: userPublic
    };
  }

  async listUsers(safeMode = true) {
    try {
      const data = await fs.readFile(this.path, 'utf-8');
      const users = JSON.parse(data || '[]');
      this.users = users.map(u => ({
        id: Number(u.id) || (u.id ? Number(u.id) : undefined),
        username: u.username || u.usuario || '',
        email: u.email || u.correo || '',
        password: u.password || u.contrasena || '',
        phone: u.phone || u.telefono || '',
        department: u.department || u.departamento || '',
        idCard: u.idCard || u.IDcard || '',
        createdAt: u.createdAt || u.fechaCreacion || Date.now(),
        role: u.role || u.rol || 'usuario',
        active: typeof u.active === 'boolean' ? u.active : (u.active !== undefined ? u.active : true)
      }));

      if (safeMode) {
        return this.users.map(u => {
          const { password, ...userPublic } = u;
          return userPublic;
        });
      }

      return this.users;

    } catch (error) {
      if (error.code === 'ENOENT') {
        this.users = [];
        await this.save();
        return this.users;
      }
      throw error;
    }
  }

  async findUserById(id) {
    await this.listUsers(false);

    const idSearched = Number(id);
    const user = this.users.find(u => Number(u.id) === idSearched);

    if (!user) {
      throw new Error(`User with ID ${idSearched} not found.`);
    }

    const { password, ...userPublic } = user;
    return userPublic;
  }

  async updateUser(id, updateData) {
    await this.listUsers(false);

    const idToUpdate = Number(id);
    const index = this.users.findIndex(u => u.id === idToUpdate);

    if (index === -1) {
      throw new Error(`User with ID ${idToUpdate} not found.`);
    }

    // Accept updates in Spanish or English; map to normalized English keys
    const keyMap = {
      'contrasena': 'password', 'password': 'password',
      'correo': 'email', 'email': 'email',
      'telefono': 'phone', 'phone': 'phone',
      'departamento': 'department', 'department': 'department',
      'usuario': 'username', 'username': 'username',
      'IDcard': 'idCard', 'idCard': 'idCard',
      'rol': 'role', 'role': 'role',
      'active': 'active'
    };

    const changes = {};
    let mustRehash = false;

    Object.keys(updateData).forEach(key => {
      const norm = keyMap[key];
      if (norm && key !== 'id') {
        changes[norm] = updateData[key];
        if (norm === 'password') mustRehash = true;
      }
    });

    if (Object.keys(changes).length === 0) {
        throw new Error("No valid fields provided for update.");
    }
    if (mustRehash) {
      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(changes.password, salt);
      changes.password = newHashedPassword;
    }

    if (changes.idCard) {
      const newHashedIDcard = crypto
        .createHash('sha256')
        .update(changes.idCard)
        .digest('hex');
      changes.idCard = newHashedIDcard;
    }

    this.users[index] = {
      ...this.users[index],
      ...changes,
      id: idToUpdate
    };

    await this.save();

    const { password, ...userPublic } = this.users[index];
    return userPublic;
  }

  async deleteUser(id) {
    await this.listUsers(false);

    const idToDelete = Number(id);
    const index = this.users.findIndex(u => Number(u.id) === idToDelete);

    if (index === -1) {
      throw new Error(`User with ID ${idToDelete} not found.`);
    }

    const [deleted] = this.users.splice(index, 1);
    await this.save();

    const { password, ...userPublic } = deleted;
    return userPublic;
  }
}

module.exports = UserManager;

const user1 = {
    usuario: 'admin',
    contrasena: 'admin',
    correo: 'admin',
    telefono: 'admin',
    departamento: 'admin',
    IDcard: ''
}
const userManager = new UserManager('./data/users.json');

const test = async () => {
  /* console.log (await userManager.createUser(user1));
  console.log (await userManager.login('admin', 'admin')); */
  console.log (await userManager.listUsers());
}

test();