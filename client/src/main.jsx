import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.scss'
import 'leaflet/dist/leaflet.css'
import logoUrl from './assets/medichain-logo.png'

// Set favicon from src assets (works in Vite via asset import)
(() => {
	try {
		const link = document.querySelector("link[rel='icon']") || document.createElement('link')
		link.setAttribute('rel', 'icon')
		link.setAttribute('type', 'image/png')
		link.setAttribute('href', logoUrl)
		if (!link.parentNode) document.head.appendChild(link)
	} catch {}
})()

const root = createRoot(document.getElementById('root'))
root.render(<App />)
