import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Doctor Service is running' });
});

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});
