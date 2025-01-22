// routes/chat.route.js
import express from 'express';
import { getChats, getChatMessages, sendMessage, createChat } from '../controllers/chat/chat.controller.js';
import { verifyJWT } from '../middlewares/isLogin.middleware.js';

const router = express.Router();

router.use(verifyJWT); // Apply authentication middleware to all chat routes

router.get('/chats', getChats);
router.get('/messages/:chatId', getChatMessages);
router.post('/send', sendMessage);
router.post('/create', createChat);

export default router;