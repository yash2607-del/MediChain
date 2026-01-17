import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function LanguageWidget() {
  const location = useLocation()
  const navigate = useNavigate()

  const getCurrentLangFromCookie = () => {
    if (typeof document === 'undefined') return 'en'
    const match = document.cookie.match(/(?:^|; )googtrans=([^;]+)/)
    if (!match) return 'en'
    try {
      const val = decodeURIComponent(match[1])
      const parts = val.split('/')
      const lang = parts.length >= 3 ? parts[2] : 'en'
      return lang || 'en'
    } catch {
      return 'en'
    }
  }

  const [selectedLang, setSelectedLang] = useState(getCurrentLangFromCookie)

  const isLanding = location.pathname === '/'

  const handleLoginClick = () => {
    navigate('/auth/patient')
  }

  const handleSignupClick = () => {
    navigate('/auth/patient')
  }

  const handleLanguageButtonClick = () => {
    if (window.toggleLanguageDropdown) {
      window.toggleLanguageDropdown()
    }
  }

  const handleLanguageChange = (e) => {
    const value = e.target.value
    setSelectedLang(value)
    if (window.setGTranslate) {
      window.setGTranslate(value)
    }
  }

  const handleLanguageBlur = () => {
    if (window.hideLanguageDropdown) {
      window.hideLanguageDropdown()
    }
  }

  return (
    <div id="google_translate_element">
      {isLanding && (
        <div className="top-auth-buttons">
          <button className="top-auth-btn login" type="button" onClick={handleLoginClick}>
            Login
          </button>
          <button className="top-auth-btn signup" type="button" onClick={handleSignupClick}>
            Sign Up
          </button>
        </div>
      )}
      <button
        id="language-icon-btn"
        aria-label="Select language"
        type="button"
        onClick={handleLanguageButtonClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
        </svg>
      </button>
      <select
        id="custom-translate-select"
        className="notranslate"
        translate="no"
        aria-label="Select language"
        value={selectedLang}
        onChange={handleLanguageChange}
        onBlur={handleLanguageBlur}
      >
        <option value="en" translate="no">English</option>
        <option value="hi" translate="no">हिन्दी (Hindi)</option>
        <option value="bn" translate="no">বাংলা (Bengali)</option>
        <option value="te" translate="no">తెలుగు (Telugu)</option>
        <option value="mr" translate="no">मराठी (Marathi)</option>
        <option value="ta" translate="no">தமிழ் (Tamil)</option>
        <option value="gu" translate="no">ગુજરાતી (Gujarati)</option>
        <option value="kn" translate="no">ಕನ್ನಡ (Kannada)</option>
        <option value="ml" translate="no">മലയാളം (Malayalam)</option>
        <option value="pa" translate="no">ਪੰਜਾਬੀ (Punjabi)</option>
        <option value="bho" translate="no">भोजपुरी (Bhojpuri)</option>
        <option value="as" translate="no">অসমীয়া (Assamese)</option>
        <option value="mni-Mtei" translate="no">মৈতৈলোন্ (Manipuri)</option>
        <option value="lus" translate="no">Mizo (Mizo)</option>
        <option value="grt" translate="no">Garo (Garo)</option>
      </select>
    </div>
  )
}
