
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { S } from './lib/storage';
import { AuthProvider } from './lib/auth';

import App from './App';
import './styles.css';
import { startAutoTranslate } from './lib/i18n';

// Set the application theme
document.documentElement.dataset.theme = S.get('theme') || '';

// Render the application
createRoot(document.getElementById('root')).render(
    <HashRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
    </HashRouter>
);

// Tanlangan til (rus / ingliz) bo'lsa, interfeysni avtomatik tarjima qilish
startAutoTranslate();

// "Ilovani o'rnatish" tugmasi uchun brauzer taklifini saqlab qo'yamiz
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    window.__mystraInstall = e;
    window.dispatchEvent(new Event('mystra-installable'));
});

// Register the service worker
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
