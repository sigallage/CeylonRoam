import { Outlet } from 'react-router-dom';
import Header from '../../components/global/Header';
import Footer from '../../components/global/Footer';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

const LayoutShell = () => {
  const { isDarkMode } = useTheme();

  return (
      <div className={`${isDarkMode ? 'flex min-h-screen flex-col bg-[#0a0a0a] text-white' : 'flex min-h-screen flex-col bg-gray-100 text-gray-900'} overflow-x-hidden`}>
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const MainLayout = () => {
  return (
    <ThemeProvider>
      <LayoutShell />
    </ThemeProvider>
  );
};

export default MainLayout;