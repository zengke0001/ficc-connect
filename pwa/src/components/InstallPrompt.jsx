import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

export function InstallPrompt() {
  const { isInstallable, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">Install FICC Connect</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add to your home screen for quick access
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 btn btn-primary text-sm py-2"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 btn btn-secondary text-sm py-2"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
