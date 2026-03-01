import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Auth Service is running' });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
