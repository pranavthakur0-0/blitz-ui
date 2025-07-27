import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';


// Set up the PDF.js worker with more specific configuration


import {
  ArrowLeft,
  User,
  FileText,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import './ChatPage.scss';
import PdfLoader from './PdfLoader';
import ChatScreen from './ChatScreen';


  // // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
  //       setShowProfileDropdown(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);


export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const documentId = useParams().documentId;
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  return (
    <div className="chat-page">
      {/* Header */}
      <header className="chat-page__header">
        <div className="chat-page__header-left">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>

          <div className="chat-page__document-info">
            <FileText size={20} />
            <span className="chat-page__document-title">
              OOP: Structs, Classes, Encapsulation, and Abstraction
            </span>
          </div>
        </div>

        <div className="chat-page__header-right">
          <button
            onClick={toggleTheme}
            className="chat-page__theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="chat-page__user-menu" ref={profileDropdownRef}>
            <div
              className="chat-page__user-avatar"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>

            {showProfileDropdown && (
              <div className="chat-page__profile-dropdown">
                <div className="chat-page__profile-header">
                  <div className="chat-page__profile-avatar">
                    <User size={20} />
                  </div>
                  <div className="chat-page__profile-info">
                    <div className="chat-page__profile-name">
                      {user?.name || 'User'}
                    </div>
                    <div className="chat-page__profile-email">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="chat-page__profile-actions">
                  <button
                    className="chat-page__profile-action"
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="chat-page__content">
        <ChatScreen documentId={documentId} />
        <PdfLoader documentId={documentId} />
      </div>
    </div>
  );
}; 