import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register.jsx';
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from './pages/Dashboard.jsx';
import Chat from "./pages/Chat";


function App() {

  return (
<BrowserRouter>
<Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/profile" element={<Dashboard/>}/>
  <Route path="/register" element={<Register/>}/>
  <Route path="/login" element={<Login/>}/>
<Route path="/chat/:receiverId" element={<Chat />} />
</Routes>

</BrowserRouter>

  )
}

export default App
