import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AdminProvider } from './context/AdminContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Portfolio from './pages/Portfolio'
import Resources from './pages/Resources'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import NukkiAI from './pages/NukkiAI'

export default function App() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"            element={<Home />} />
              <Route path="/about"       element={<About />} />
              <Route path="/portfolio"   element={<Portfolio />} />
              <Route path="/resources"   element={<Resources />} />
              <Route path="/contact"     element={<Contact />} />
              <Route path="/blog"        element={<Blog />} />
              <Route path="/blog/:slug"  element={<BlogPost />} />
              <Route path="/nukki-ai"   element={<NukkiAI />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </ThemeProvider>
  )
}
