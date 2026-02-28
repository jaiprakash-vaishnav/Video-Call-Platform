import './App.css'
import Authentication from './pages/Authentication.jsx';
import LandingPage from './pages/LandingPage';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeet from './pages/VideoMeet.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';

function App() {

  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            {/* <Route path="/home" /> */}
            <Route path="/" element={<LandingPage/>}/>
            <Route path="/auth" element={<Authentication/>}/>
            <Route path="/home" element={<Home/>}/>
            <Route path="/history" element={<History  />}/>
            <Route path="/:url" element={<VideoMeet/>} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
