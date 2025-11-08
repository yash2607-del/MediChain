import React from 'react'
import { FaComments, FaTimes } from 'react-icons/fa'
import Chatbot from './Chatbot.jsx'
import '../../styles/chatbot-popup.scss'

export default function ChatbotPopup() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {/* Floating action button */}
      <button
        className="chatbot-fab"
        aria-label={open ? 'Close Chatbot' : 'Open Chatbot'}
        onClick={() => setOpen(o => !o)}
      >
        <FaComments size={18} />
      </button>

      {open && (
        <div className="chatbot-popup" role="dialog" aria-modal="false">
          <div className="chatbot-popup__header">
            <span>Chatbot</span>
            <button className="close-btn" aria-label="Close" onClick={() => setOpen(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="chatbot-popup__body">
            <Chatbot />
          </div>
        </div>
      )}
    </>
  )
}
