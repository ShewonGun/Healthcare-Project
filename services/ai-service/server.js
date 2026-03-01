import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'AI Service is running' });
});

app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
