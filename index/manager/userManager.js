const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

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
        this.users = JSON.parse(data);
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

    const requiredFields = ['contrasena', 'correo', 'telefono', 'departamento', 'usuario'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}.`);
    }
    if (this.users.some(u => u.usuario === userData.usuario)) {
      throw new Error(`Username '${userData.usuario}' is already in use.`);
    }
    if (this.users.some(u => u.correo === userData.correo)) {
      throw new Error(`Email '${userData.correo}' is already registered.`);
    }

    const secret = crypto.randomBytes(64).toString('hex');

    const hashedPassword = crypto
      .createHmac("sha256", secret)
      .update(userData.contrasena)
      .digest("hex");
      
    const emptyIDCardEncrypted = crypto
        .createHash('sha256')
        .update('')
        .digest('hex');

    const newUser = {
      id: this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1,
      ...userData,
      contrasena: hashedPassword,
      secret: secret,
      IDcard: emptyIDCardEncrypted,
      fechaCreacion: Date.now()
    };

    this.users.push(newUser);
    await this.save();

    const { contrasena, secret: userSecret, ...userWithoutSecurity } = newUser;
    return userWithoutSecurity;
  }
  
  async login(usuario, contrasena) {
    await this.listUsers(false);
    
    const user = this.users.find(u => u.usuario === usuario);
    if (!user) {
        throw new Error("Incorrect username or password.");
    }
    
    const inputHash = crypto
        .createHmac("sha256", user.secret)
        .update(contrasena)
        .digest("hex");
        
    if (user.contrasena !== inputHash) {
        throw new Error("Incorrect username or password.");
    }

    const { contrasena: userPass, secret, ...userPublic } = user;
    return { 
        message: "Login successful",
        usuario: userPublic
    };
  }

  async listUsers(safeMode = true) {
    try {
      const data = await fs.readFile(this.path, 'utf-8');
      const users = JSON.parse(data || '[]');
      this.users = users.map(u => ({ ...u, id: Number(u.id) }));

      if (safeMode) {
          return this.users.map(u => {
              const { contrasena, secret, ...userPublic } = u; 
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

    const { contrasena, secret, ...userPublic } = user;
    return userPublic;
  }

  async updateUser(id, updateData) {
    await this.listUsers(false);

    const idToUpdate = Number(id);
    const index = this.users.findIndex(u => u.id === idToUpdate);

    if (index === -1) {
      throw new Error(`User with ID ${idToUpdate} not found.`);
    }

    const allowedFields = ['contrasena', 'correo', 'telefono', 'departamento', 'usuario', 'IDcard'];
    const changes = {};
    let mustRehash = false;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && key !== 'id') {
        changes[key] = updateData[key];
        if (key === 'contrasena') {
            mustRehash = true;
        }
      }
    });

    if (Object.keys(changes).length === 0) {
        throw new Error("No valid fields provided for update.");
    }
    
    if (mustRehash) {
        const newHashedPassword = crypto
            .createHmac("sha256", this.users[index].secret)
            .update(changes.contrasena)
            .digest("hex");
        changes.contrasena = newHashedPassword;
    }
    
    if (changes.IDcard) {
        const newHashedIDcard = crypto
            .createHash('sha256')
            .update(changes.IDcard)
            .digest('hex');
        changes.IDcard = newHashedIDcard;
    }
    
    this.users[index] = {
      ...this.users[index],
      ...changes,
      id: idToUpdate
    };

    await this.save();

    const { contrasena, secret, ...userPublic } = this.users[index];
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

    const { contrasena, secret, ...userPublic } = deleted;
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