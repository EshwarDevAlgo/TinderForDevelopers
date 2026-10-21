import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { useSocket } from './socket.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Discover from './pages/Discover.jsx';
import Browse from './pages/Browse.jsx';
import ProfileView from './pages/ProfileView.jsx';
import Matches from './pages/Matches.jsx';
import Chat from './pages/Chat.jsx';
import EditProfile from './pages/EditProfile.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Nav() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  return (
    <header className="nav">
      <NavLink to="/" className="brand">
        <span className="logo">&lt;/&gt;</span> DevMatch
      </NavLink>
      {user && (
        <nav>
          <NavLink to="/" end>Discover</NavLink>
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/matches">Matches</NavLink>
          <NavLink to="/me">Profile</NavLink>
          <span className={`dot ${connected ? 'on' : ''}`} title={connected ? 'Realtime connected' : 'Offline'} />
          <button className="link" onClick={logout}>Log out</button>
        </nav>
      )}
    </header>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Nav />
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<Protected><Discover /></Protected>} />
          <Route path="/browse" element={<Protected><Browse /></Protected>} />
          <Route path="/profiles/:id" element={<Protected><ProfileView /></Protected>} />
          <Route path="/matches" element={<Protected><Matches /></Protected>} />
          <Route path="/chat/:matchId" element={<Protected><Chat /></Protected>} />
          <Route path="/me" element={<Protected><EditProfile /></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
