import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true , 'Name is required'],
    trim :true
  },

  email: {
    type: String,
    required: [true , 'Email is required'],
    unique: true,
    lowarcase: true,
    trim :true,
    match: [/\S+@\S+\.\S+/, 'email is invalid']
  },

  password: {
    type: String,
    required: [true , 'Password is required'],
    trim :true 
  },

  role: {
    type: String,
    required: [true , 'Role is required'],
    enum: {
      values: ['admin', 'portero', 'usuario']
    },
    default: 'usuario'
  },

  active: {
    type: Boolean,
    default: true
  }


},{ timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }

  catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
