import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/app.css'
import './styles/opening.css'
import './styles/scene.css'
import './styles/level1.css'
import './styles/level2.css'
import './styles/board.css'
import './styles/cheque.css'
import './styles/highlighter.css'
import './styles/level3.css'
import './styles/computer.css'
import './styles/polish.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
