import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectExplorerPage from './pages/ProjectExplorerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project" element={<ProjectExplorerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

