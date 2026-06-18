import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/home/HomePage';
import { ConfigurePage } from './pages/configure/ConfigurePage';
import { ProfilePage } from './pages/profile/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/configure" element={<ConfigurePage />} />
        <Route path="/profile/:slug" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
