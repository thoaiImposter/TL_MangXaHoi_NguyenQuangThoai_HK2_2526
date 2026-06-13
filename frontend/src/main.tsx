import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import './styles/app.css'
import App from './App.tsx'
import GlobalUploadProgress from './components/GlobalUploadProgress.tsx'
import FeedbackHost from './components/FeedbackHost.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <GlobalUploadProgress />
      <FeedbackHost />
    </BrowserRouter>
  </StrictMode>,
)
