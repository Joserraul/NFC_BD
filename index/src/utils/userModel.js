import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

export default UserModel;
