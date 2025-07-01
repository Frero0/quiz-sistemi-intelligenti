// src/Layout.jsx
import Header from './Header';

export default function Layout({ children }) {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <Header />
            <main className="flex-grow flex items-center justify-center px-4 py-10">
                {children}
            </main>
            {/* <footer className="text-center p-4 text-white">© 2025 Il Tuo Nome</footer> */}
        </div>
    );
}