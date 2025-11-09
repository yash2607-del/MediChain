import React from 'react'
import { FaComments, FaTimes, FaRobot, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import Chatbot from './Chatbot.jsx'
import '../../styles/chatbot-popup.scss'

export default function ChatbotPopup() {
  const [open, setOpen] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)

  const toggleOpen = () => {
    setOpen(o => !o)
    if (!open) {
      setIsMinimized(false) // Reset minimized state when opening
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(m => !m)
  }

  return (
    <>
      {/* Floating action button */}
      <button
        className={`chatbot-fab ${open ? 'chatbot-fab--active' : ''}`}
        aria-label={open ? 'Close Chatbot' : 'Open Health Assistant'}
        onClick={toggleOpen}
      >
        {open ? <FaTimes size={18} /> : <FaComments size={18} />}
        {!open && <div className="chatbot-fab__badge">AI</div>}
      </button>

      {/* Backdrop for mobile */}
      {open && (
        <div 
          className="chatbot-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chatbot popup */}
      {open && (
        <div className={`chatbot-popup ${isMinimized ? 'chatbot-popup--minimized' : ''}`} role="dialog" aria-modal="false">
          <div className="chatbot-popup__header">
            <div className="chatbot-popup__header-info">
              <div className="chatbot-popup__avatar">
                <FaRobot />
              </div>
              <div className="chatbot-popup__title">
                <span className="chatbot-popup__name">Health Assistant</span>
                <span className="chatbot-popup__status">
                  <span className="status-indicator"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="chatbot-popup__controls">
              <button 
                className="control-btn" 
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
                onClick={toggleMinimize}
              >
                {isMinimized ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </button>
              <button 
                className="control-btn close-btn" 
                aria-label="Close" 
                onClick={() => setOpen(false)}
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <div className="chatbot-popup__body">
              <Chatbot />
            </div>
          )}
        </div>
      )}
    </>
  )
}
