// controllers/chat.controller.js
import ChatModel from '../../models/campus-connect-models/chat.model.js';
import UserModel from '../../models/campus-connect-models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const getChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const chats = await ChatModel.find({ participants: userId })
    .populate('participants', 'name profileImage')
    .sort('-updatedAt');
  
  return res.status(200).json(new ApiResponse(200, chats, "Chats retrieved successfully"));
});

const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: userId
  }).populate('messages.sender', 'name profileImage');

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res.status(200).json(new ApiResponse(200, chat.messages, "Chat messages retrieved successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;
  const senderId = req.user?._id;
  console.log("Entire req.user object:", req.user);
  console.log("Sender Id :: ", senderId);
  
  const chat = await ChatModel.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  console.log("Chat participants:", chat.participants);
  console.log("Sender ID in participants:", chat.participants.includes(senderId));

  if (!chat.participants.includes(senderId)) {
    throw new ApiError(403, "You are not a participant in this chat");
  }

  const newMessage = {
    sender: senderId,
    content
  };

  console.log("New message before save:", newMessage);

  chat.messages.push(newMessage);
  await chat.save();

  console.log("Chat after save:", chat);

  // Populate the sender information
  const populatedMessage = await ChatModel.populate(newMessage, {
    path: 'sender',
    select: 'name profileImage'
  });

  console.log("Populated message:", populatedMessage);

  return res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent successfully"));
});
const createChat = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  const userId = req.user?._id;

  if (userId.toString() === participantId) {
    throw new ApiError(400, "You cannot start a chat with yourself");
  }

  const participant = await UserModel.findById(participantId);
  if (!participant) {
    throw new ApiError(404, "Participant not found");
  }

  let chat = await ChatModel.findOne({
    participants: { $all: [userId, participantId] }
  });

  if (chat) {
    return res.status(200).json(new ApiResponse(200, chat, "Chat already exists"));
  }

  chat = await ChatModel.create({
    participants: [userId, participantId]
  });

  return res.status(201).json(new ApiResponse(201, chat, "Chat created successfully"));
});

export {
  getChats,
  getChatMessages,
  sendMessage,
  createChat
};