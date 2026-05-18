import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import App from './App';
import {TranslationProvider} from './context/TranslationContext';
import {ThemeProvider} from './context/ThemeContext';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('SW registration failed:', error);
        });
    });
}

const container = document.getElementById('root');

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <TranslationProvider>
                <ThemeProvider>
                    <BrowserRouter>
                        <App/>
                    </BrowserRouter>
                </ThemeProvider>
            </TranslationProvider>
        </React.StrictMode>
    );
}