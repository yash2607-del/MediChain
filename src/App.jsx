import React from 'react'
import Example from './components/Example.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>HackCbs Project — React + SCSS skeleton</h1>
        <p>Colour palette is defined in <code>src/styles/_colors.scss</code></p>
      </header>

      <main>
        <Example />
      </main>
    </div>
  )
}
