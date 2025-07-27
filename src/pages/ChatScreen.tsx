import { Bot, User } from "lucide-react";
import ChatInput from "./ChatInput";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }




const ChatScreen = ({documentId}: {documentId: string | undefined}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
          id: '1',
          text: "I've analyzed your document and I'm ready to help! Feel free to ask me any questions about the content, request summaries, or explore specific topics.",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);

    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
    
      useEffect(() => {
        scrollToBottom();
      }, [messages]);


    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      };    

      const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      };
    

      const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        const userMessage: Message = {
            id: new Date().toISOString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          setInputValue('');
          setIsLoading(true);

        const response = await axios.post('/app/chats/create', {
          query: inputValue,    
          documentId: documentId
        });
    
        const assistantMessage: Message = {
          id: response.data.updatedAt,
          text: response.data.messages,
        sender: 'assistant',
          timestamp: new Date()
        };
    
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      };

      
      useEffect(() => {
        const fetchChats = async () => {
          const response = await axios.get(`/app/chats/getChats/${documentId}`);
          setMessages(response.data.map((chat: any) => ({
            id: chat.updatedAt,
            text: chat.messages,
            sender: chat.sender,
            timestamp: new Date(chat.updatedAt)
          })));
        };
        fetchChats();
      }, [documentId]);

  return <div className="chat-page__chat-section">
  <div className="chat-page__chat-header">
    <h2 className="chat-page__chat-title">Chat</h2>
    <p className="chat-page__chat-subtitle">Ask questions about your sources</p>
  </div>

  <div className="chat-page__chat">
    <div className="chat-page__messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat-message ${message.sender === 'user' ? 'chat-message--user' : 'chat-message--assistant'}`}
        >
          <div className="chat-message__content">
            <div className="chat-message__bubble">
              {/* <div className="chat-message__text">{message.text}</div> */}
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
            <div className="chat-message__meta">
              {message.sender === 'assistant' && (
                <>
                  <div className="chat-message__time">
                    {formatTime(message.timestamp)}
                  </div>
                  <div className="chat-message__avatar">
                    <Bot size={16} />
                  </div>
                </>
              )}
              {message.sender === 'user' && (
                <>
                  <div className="chat-message__avatar">
                    <User size={16} />
                  </div>
                  <div className="chat-message__time">
                    {formatTime(message.timestamp)}
                  </div>
                </>
              )}
            </div>
            {/* {message.sender === 'assistant' && (
              <div className="chat-message__actions">
                <button className="chat-message__action-button">
                  Save to note
                </button>
              </div>
            )} */}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="chat-message chat-message--assistant">
          <div className="chat-message__content">
            <div className="chat-message__bubble">
              <div className="chat-loading">
                Thinking
                <div className="chat-loading__dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            <div className="chat-message__meta">
              <div className="chat-message__time">
                {formatTime(new Date())}
              </div>
              <div className="chat-message__avatar">
                <Bot size={16} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>

    <ChatInput
      inputValue={inputValue}
      setInputValue={setInputValue}
      inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
      handleKeyPress={handleKeyPress}
      handleSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  </div>
</div>;
};

export default ChatScreen;