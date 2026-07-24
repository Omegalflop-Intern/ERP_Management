import { useEffect } from 'react';

/**
 * Custom hook to trigger keyboard shortcuts (e.g. Escape to close modals, F2 for POS).
 * @param {string} targetKey - Key name (e.g. 'Escape', 'Enter', 'F2').
 * @param {Function} callback - Function to invoke when key is pressed.
 */
export function useKeyPress(targetKey, callback) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === targetKey) {
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, callback]);
}

export default useKeyPress;
