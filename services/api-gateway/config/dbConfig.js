import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('API Gateway: MongoDB connected');
  } catch (error) {
    console.error('API Gateway: MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
