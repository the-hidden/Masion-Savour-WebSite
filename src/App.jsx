import { lazy,useEffect, Outlet } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css'
import Navbar from './Components/Navbar';
import Home from './Pages/Home';
import Menu from './Pages/Menu';
import Nosotros from './Pages/About';
import Contacto from './Pages/Contacto';
import Footer from './Components/Footer';

const AdminApp = lazy(() => import('./admin/AdminApp'));

const App = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.toLowerCase().startsWith('/admin');

  function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => { window.scrollTo(0, 0) }, [pathname])
    return null
  }

  return (
    <div className="App">
      {!isAdmin && <Navbar />}
      <ScrollToTop />
      <Routes>
        <Route>
          <Route index element={<Home />} />
          <Route path="menu" element={<Menu />} />
          <Route path="nosotros" element={<Nosotros />} />
          <Route path="contacto" element={<Contacto />} />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Route>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  )
}

export default App
