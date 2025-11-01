const UserModel = require('../utils/userModel');

const createUser = async (req, res) => {
  try {
    const { username, password, role, phone, department, email } = req.body;

    if (!username || !password || !role || !phone || !department || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check existing user by username or email
    const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const newUser = new UserModel({ username, password, role, phone, department, email });
    const saved = await newUser.save();

    const userResponse = saved.toObject();
    delete userResponse.password;

    return res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select('-password');
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({ message: 'User updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
};