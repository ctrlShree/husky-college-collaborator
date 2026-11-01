import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Nav() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <NavLink to="/" end className="navbar-brand" onClick={closeMenu}>
        Husky College Collaborator
      </NavLink>

      <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
        ☰
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {!session && <NavLink to="/" end onClick={closeMenu}>Login</NavLink>}
        {!session && <NavLink to="/signup" onClick={closeMenu}>Sign up</NavLink>}
        <NavLink to="/browse" onClick={closeMenu}>Browse</NavLink>
        {session && <NavLink to="/post" onClick={closeMenu}>Post project</NavLink>}
        {session && <NavLink to="/requests" onClick={closeMenu}>My requests</NavLink>}
        {session && <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>}
        {session && (
          <button onClick={handleLogout} className="btn-danger">
            Log out
          </button>
        )}
      </div>
    </nav>
  );
}