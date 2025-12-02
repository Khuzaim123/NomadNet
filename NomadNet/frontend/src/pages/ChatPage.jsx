// src/pages/ChatPage.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatProvider } from '../context/ChatContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

import '../styles/chat.css';

const ChatPageContent = () => {
  const location = useLocation();
  
  // If there's a listing context, we could show it in the chat
  useEffect(() => {
    if (location.state?.listingContext) {
      console.log('Chat started from listing:', location.state.listingContext);
      // You could use this to show a "Regarding: [Listing Title]" banner
    }
  }, [location.state]);

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <ChatList />
      </div>
      <div className="chat-window">
        <ChatWindow listingContext={location.state?.listingContext} />
      </div>
    </div>
  );
};

const ChatPage = () => {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
};

export default ChatPage;