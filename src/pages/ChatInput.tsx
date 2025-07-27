import { Send } from "lucide-react";

const ChatInput = ({inputRef, handleKeyPress, handleSendMessage, isLoading, inputValue, setInputValue}: {inputRef: React.RefObject<HTMLTextAreaElement>, handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void, handleSendMessage: () => void, isLoading: boolean, inputValue: string, setInputValue: (value: string) => void}) => {   
  return  <div className="chat-page__input-area">   
  <div className="chat-page__input-container-full">
    <textarea
      ref={inputRef}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder="Ask a question about your sources..."
      className="chat-page__input-full"
      disabled={isLoading}
      rows={1}
      style={{
        height: 'auto',
        minHeight: '24px',
      }}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
      }}
    />
    <button
      onClick={handleSendMessage}
      disabled={!inputValue.trim() || isLoading}
      className="chat-page__send-button"
    >
      <Send size={16} />
    </button>
  </div>
</div>;
};

export default ChatInput;