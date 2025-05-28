import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from './contexts/SupabaseContext'; 
import { CosmoProvider } from './contexts/CosmoContext';
import { ModalProvider } from './contexts/ModalContext';
import { TutorialProvider } from './components/tutorial/TutorialProvider';
import { StripeProvider } from './contexts/StripeContext';
import AppContent from './components/common/AppContent';
import { PWAInstallPrompt } from './components/ui/pwa-install-prompt';

function App() {
  return (
    <BrowserRouter>
      <SupabaseProvider>
        <StripeProvider>
          <CosmoProvider>
            <TutorialProvider>
              <ModalProvider>
                <AppContent />
                <PWAInstallPrompt />
              </ModalProvider>
            </TutorialProvider>
          </CosmoProvider>
        </StripeProvider>
      </SupabaseProvider>
    </BrowserRouter>
  );
}

export default App;