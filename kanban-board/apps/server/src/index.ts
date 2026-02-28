import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import boardRoutes from './routes/board.js';
import listRoutes from './routes/list.js';
import cardRoutes from './routes/card.js';
import memberRoutes from './routes/member.js';
import commentRoutes from './routes/comment.js';
import labelRoutes from './routes/label.js';
import checklistRoutes from './routes/checklist.js';
import friendRoutes from './routes/friend.js';
import drawingRoutes from './routes/drawing.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/drawings', drawingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
