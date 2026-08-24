import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Stream from '@/pages/Stream';
import Admin from '@/pages/Admin';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/stream" element={<Stream />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(8,8,20,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f0ebe0',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </BrowserRouter>
  );
}
