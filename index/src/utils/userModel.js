const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @UserSchema Esquema y Modelo para la Colección de Usuarios
 * Campos:
 * - username: Nombre de usuario único para el usuario (requerido)
 * - name: Nombre completo del usuario (opcional)
 * - email: Dirección de correo electrónico del usuario (requerido, único)
 * - password: Contraseña para el usuario (requerida)
 * - role: Rol del usuario (requerido, enum: 'admin', 'portero', 'usuario')
 * - phone: Número de teléfono del usuario (opcional)
 * - department: Departamento del usuario (opcional)
 * - idCardHash: Hash de la cédula de identidad del usuario (opcional)
 * - active: Estado de la cuenta del usuario (por defecto: true)
 *  UserSchema.pre('save', ...): Middleware para hashear la contraseña antes de guardar el usuario.
 *  UserSchema.methods.matchPassword: Método de instancia para comparar contraseñas.
 *  Transformación toJSON: Elimina campos sensibles (contraseña, __v) al convertir a JSON.
 */


const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true
  },

  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Email is invalid']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    trim: true,
    minlength: [8, 'Password must be at least 8 characters']
  },

  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['admin', 'portero', 'usuario'],
    default: 'usuario'
  },

  phone: {
    type: String,
    trim: true
  },

  department: {
    type: String,
    trim: true
  },

  idCardHash: {
    type: String
  },

  active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Instance method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Clean sensitive fields when converting documents to JSON
if (!UserSchema.options.toJSON) UserSchema.options.toJSON = {};
UserSchema.options.toJSON.transform = function (doc, ret) {
  delete ret.password;
  delete ret.__v;
  return ret;
};

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;