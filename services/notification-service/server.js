import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Notification Service is running' });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
