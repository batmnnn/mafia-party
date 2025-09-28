import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUser: string;
}

export function ChatPanel({ isOpen, onClose, messages, onSendMessage, currentUser }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-electric-blue to-neon-green rounded-2xl p-6 max-w-md w-full text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">💬 Game Chat</h3>
          <Button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 rounded-full px-3 py-1 font-semibold shadow-md transition-all transform hover:scale-105 text-white text-sm"
          >
            ✕
          </Button>
        </div>
        <div className="h-64 overflow-y-auto mb-4 space-y-3">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === currentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl shadow-md ${
                  message.sender === currentUser
                    ? 'bg-soft-gold text-black'
                    : message.isBot
                    ? 'bg-vivid-orange text-black'
                    : 'bg-white/20 text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{message.sender}</span>
                  {message.isBot && <span className="text-xs">🤖</span>}
                </div>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-full bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-soft-gold"
          />
          <Button
            onClick={handleSend}
            className="bg-soft-gold hover:bg-yellow-500 rounded-full px-4 py-2 font-semibold shadow-md transition-all transform hover:scale-105 text-black"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}