import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectsRouter from './routes/projects.js';
import profilesRouter from './routes/profiles.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/profiles', profilesRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Server is running'});
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});