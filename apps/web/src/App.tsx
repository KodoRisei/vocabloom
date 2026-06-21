import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './pages/HomePage';
import { VocabularyListPage } from './pages/VocabularyListPage';
import { VocabularyFormPage } from './pages/VocabularyFormPage';
import { QuizConfigPage } from './pages/QuizConfigPage';
import { QuizGamePage } from './pages/QuizGamePage';
import { QuizResultPage } from './pages/QuizResultPage';
import { HistoryPage } from './pages/HistoryPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 flex items-center gap-1 h-14">
        <NavLink to="/" end className="mr-4 font-bold text-indigo-600 text-lg">
          VocaBloom
        </NavLink>
        <NavLink to="/vocabularies" className={linkClass}>単語</NavLink>
        <NavLink to="/quiz" className={linkClass}>クイズ</NavLink>
        <NavLink to="/history" className={linkClass}>履歴</NavLink>
      </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/vocabularies" element={<VocabularyListPage />} />
              <Route path="/vocabularies/new" element={<VocabularyFormPage />} />
              <Route path="/vocabularies/:id/edit" element={<VocabularyFormPage />} />
              <Route path="/quiz" element={<QuizConfigPage />} />
              <Route path="/quiz/:sessionId" element={<QuizGamePage />} />
              <Route path="/quiz/:sessionId/result" element={<QuizResultPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
