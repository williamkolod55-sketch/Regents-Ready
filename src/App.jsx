import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Quiz from './pages/Quiz.jsx'
import Matching from './pages/Matching.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import CramMode from './pages/CramMode.jsx'
import NavBar from './components/NavBar.jsx'
import SideNav from './components/SideNav.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex-1 flex flex-col bg-[#0a0a12] font-inter text-white overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <SideNav />

        {/* Main content — fills remaining height, scrollable, offset for sidebar */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:pl-56">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/flashcards"  element={<Flashcards />} />
            <Route path="/quiz"        element={<Quiz />} />
            <Route path="/matching"    element={<Matching />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/cram"        element={<CramMode />} />
          </Routes>
        </div>

        {/* Mobile bottom nav — hidden on desktop */}
        <NavBar />
      </div>
    </BrowserRouter>
  )
}
