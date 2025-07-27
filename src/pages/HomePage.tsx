import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  MessageCircle, 
  Sun, 
  Moon, 
  CheckCircle, 
  X, 
  Clock,
  Settings,
  Plus,
  Grid3X3,
  List,
  Filter,
  Zap,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import './HomePage.scss';

interface Document {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
}

export const HomePage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch documents from backend
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/app/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      status: 'uploading' as const,
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload files to backend
    for (const uploadFile of newFiles) {
      try {
        const formData = new FormData();
        formData.append('files', uploadFile.file);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id && f.progress !== undefined && f.progress < 90
                ? { ...f, progress: Math.min(90, f.progress + 10) }
                : f
            )
          );
        }, 300);

        // Make API call to upload using axios (automatically includes auth header)
        const response = await axios.post('/app/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        clearInterval(progressInterval);

        console.log('Upload successful:', response.data);
        
        // Mark as completed with 100% progress
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed' as const, progress: 100 }
              : f
          )
        );

        // Refresh documents list to show newly uploaded files
        await fetchDocuments();

      } catch (error) {
        console.error(`Error uploading file ${uploadFile.name}:`, error);
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error' as const }
              : f
          )
        );
      }
    }

    // Close popup and reset upload state after all uploads are complete
    setIsUploading(false);
    setShowCreatePopup(false);
    
    // Clear uploaded files after a short delay to show completion
    setTimeout(() => {
      setUploadedFiles([]);
    }, 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const onButtonClick = () => {
    setShowCreatePopup(true);
  };

  const handleCreateFromUpload = () => {
    fileInputRef.current?.click();
  };

  const handleViewAndChat = (document: Document) => {
    navigate(`/chat/${document.id}`);
  };

  return (
    <div className="home-page">
      <div className="home-page__grid-background"></div>
      
      {/* Header */}
      <header className="home-page__header">
        <div className="home-page__brand">
          <div className="home-page__logo">
            <Zap size={32} />
          </div>
          <div className="home-page__brand-text">
            <h1 className="home-page__brand-title">Blitz</h1>
            <span className="home-page__brand-subtitle">PREMIUM AI</span>
          </div>
        </div>
        
        <div className="home-page__header-actions">
          <button
            onClick={toggleTheme}
            className="home-page__icon-button"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            className="home-page__icon-button"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          
          <div className="home-page__user-menu" ref={profileDropdownRef}>
            <div 
              className="home-page__user-avatar"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            
            {showProfileDropdown && (
              <div className="home-page__profile-dropdown">
                <div className="home-page__profile-header">
                  <div className="home-page__profile-avatar">
                    <User size={20} />
                  </div>
                  <div className="home-page__profile-info">
                    <div className="home-page__profile-name">
                      {user?.name || 'User'}
                    </div>
                    <div className="home-page__profile-email">
                      {user?.email}
                    </div>
                  </div>
                </div>
                
                <div className="home-page__profile-actions">
                  <button 
                    className="home-page__profile-action"
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

      <div className="home-page__main">
        {/* Welcome Section */}
        <section className="home-page__welcome">
          <h2 className="home-page__welcome-title">
            Welcome to Blitz
          </h2>
          <p className="home-page__welcome-subtitle">
            My notebooks
          </p>
          
          <Button
            onClick={onButtonClick}
            className="home-page__create-button"
            size="lg"
          >
            <Plus size={20} />
            Create new
          </Button>
        </section>

        {/* Controls */}
        <section className="home-page__controls">
          <div className="home-page__view-controls">
            <button
              onClick={() => setViewMode('grid')}
              className={`home-page__view-button ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`home-page__view-button ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
          </div>
          
          <div className="home-page__sort-controls">
            <button className="home-page__sort-button">
              <Filter size={16} />
              Most recent
            </button>
          </div>
        </section>

        {/* Upload Section - Hidden until user clicks create */}
        {dragActive && (
          <section 
            className="home-page__upload-overlay"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="home-page__upload-content">
              <Upload size={48} />
              <h3>Drop your files here</h3>
              <p>Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)</p>
            </div>
          </section>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="home-page__upload-input"
          multiple
          style={{ display: 'none' }}
        />

        {/* Documents Grid */}
        <section className="home-page__documents">
          {loading ? (
            <div className="home-page__loading">
              <div className="home-page__loading-spinner"></div>
              <p>Loading notebooks...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="home-page__empty">
              <div className="home-page__empty-icon">
                <FileText size={64} />
              </div>
              <h3>Create your first notebook</h3>
              <p>Upload a source to get started</p>
              <Button onClick={onButtonClick} className="home-page__upload-button">
                Upload a source to get started
              </Button>
            </div>
          ) : (
            <div className={`home-page__documents-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {documents.map((document) => (
                <div key={document.id} className="notebook-card">
                  <div className="notebook-card__icon">
                    <FileText size={24} />
                  </div>
                  
                  <div className="notebook-card__content">
                    <h3 className="notebook-card__title">
                      {document.name || 'Untitled notebook'}
                    </h3>
                    <div className="notebook-card__meta">
                      <span>{document.uploadedAt}</span>
                      <span>•</span>
                      <span>{document.size}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewAndChat(document)}
                    className="notebook-card__action"
                    aria-label="Open notebook"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <section className="home-page__uploaded-files">
            <h3 className="home-page__uploaded-files-title">
              Uploading ({uploadedFiles.length})
            </h3>
            
            <div className="home-page__uploaded-files-list">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="upload-item">
                  <div className="upload-item__icon">
                    <FileText size={20} />
                  </div>
                  
                  <div className="upload-item__content">
                    <div className="upload-item__header">
                      <h4 className="upload-item__name">{file.name}</h4>
                      <span className="upload-item__size">{file.size}</span>
                    </div>
                    
                    <div className="upload-item__status">
                      {file.status === 'uploading' && (
                        <>
                          <Clock size={14} />
                          <span>Uploading... {file.progress}%</span>
                          <div className="upload-item__progress">
                            <div 
                              className="upload-item__progress-bar"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </>
                      )}
                      
                      {file.status === 'completed' && (
                        <>
                          <CheckCircle size={14} />
                          <span>Upload completed</span>
                        </>
                      )}
                      
                      {file.status === 'error' && (
                        <>
                          <X size={14} />
                          <span>Upload failed</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeUploadedFile(file.id)}
                    className="upload-item__remove"
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Create Notebook Popup */}
      {showCreatePopup && (
        <div className="home-page__create-overlay">
          <div className="home-page__create-popup">
            <div className="home-page__create-header">
              <h3>Create New Notebook</h3>
              <button 
                onClick={() => setShowCreatePopup(false)}
                className="home-page__close-button"
                disabled={isUploading}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="home-page__create-options">
              <button 
                onClick={handleCreateFromUpload}
                className="home-page__create-option"
                disabled={isUploading}
              >
                <div className="home-page__create-option-icon">
                  <Upload size={24} />
                </div>
                <div className="home-page__create-option-content">
                  <h4>Upload PDF Sources</h4>
                  <p>{isUploading ? 'Uploading your PDF files...' : 'Create a notebook by uploading PDF documents'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 