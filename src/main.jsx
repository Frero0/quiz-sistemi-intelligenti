// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import Layout from './Layout';
import QuizApp from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Layout>
            <QuizApp />
        </Layout>
    </StrictMode>
);