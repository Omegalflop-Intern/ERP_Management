import { AlertTriangle, Trash2 } from 'lucide-react';
import React from 'react';
import ReactDOM from 'react-dom/client';

export function confirmDelete(
  title = 'Delete Item?',
  description = 'This action cannot be undone.'
) {
  return showConfirmModal({
    title,
    description,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  });
}

export function confirmAction(
  title = 'Confirm Action?',
  actionLabel = 'Confirm',
  description = 'Are you sure you want to proceed?'
) {
  return showConfirmModal({
    title,
    description,
    confirmText: actionLabel,
    cancelText: 'Cancel',
    type: 'warning',
  });
}

function showConfirmModal({ title, description, confirmText, cancelText, type }) {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const cleanup = (result) => {
      root.unmount();
      container.remove();
      resolve(result);
    };

    root.render(
      React.createElement('div', {
        className: 'fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
      },
        React.createElement('div', {
          className: 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4'
        },
          React.createElement('div', { className: 'flex items-start gap-3' },
            React.createElement('div', {
              className: `p-3 rounded-2xl flex-shrink-0 ${type === 'danger' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`
            },
              type === 'danger'
                ? React.createElement(Trash2, { className: 'w-5 h-5' })
                : React.createElement(AlertTriangle, { className: 'w-5 h-5' })
            ),
            React.createElement('div', { className: 'flex-1 min-w-0' },
              React.createElement('h3', { className: 'text-base font-bold text-gray-900 dark:text-gray-100' }, title),
              React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed' }, description)
            )
          ),
          React.createElement('div', { className: 'flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800' },
            React.createElement('button', {
              type: 'button',
              onClick: () => cleanup(false),
              className: 'px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-all'
            }, cancelText),
            React.createElement('button', {
              type: 'button',
              onClick: () => cleanup(true),
              className: `px-4 py-2 font-semibold text-white rounded-xl text-xs transition-all shadow-lg ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'}`
            }, confirmText)
          )
        )
      )
    );
  });
}
