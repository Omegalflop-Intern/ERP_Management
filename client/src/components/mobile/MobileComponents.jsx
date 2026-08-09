import React from 'react';

// Mobile-first responsive utilities
export const MobileContainer = ({ children, className = '' }) => (
  <div className={`min-h-screen bg-background ${className}`}>{children}</div>
);

export const MobileHeader = ({ title, subtitle, actions }) => (
  <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
    <div className="flex items-center justify-between p-4">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </div>
);

export const MobileCard = ({ children, className = '' }) => (
  <div className={`bg-card rounded-xl border p-4 ${className}`}>{children}</div>
);

export const MobileGrid = ({ children, cols = 2, className = '' }) => (
  <div className={`grid grid-cols-${cols} gap-3 ${className}`}>{children}</div>
);

export const MobileStatCard = ({ label, value, icon: Icon, color = 'indigo' }) => (
  <MobileCard>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground uppercase">{label}</span>
      {Icon && (
        <div className={`p-1.5 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`h-3.5 w-3.5 text-${color}-600 dark:text-${color}-400`} />
        </div>
      )}
    </div>
    <div className="text-lg font-bold">{value}</div>
  </MobileCard>
);

export const MobileButton = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const MobileInput = ({ className = '', ...props }) => (
  <input
    className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

export const MobileSelect = ({ children, className = '', ...props }) => (
  <select
    className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const MobileTable = ({ headers, data, renderRow, emptyMessage = 'No data available' }) => (
  <div className="overflow-x-auto -mx-4 px-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          {headers.map((header, i) => (
            <th key={i} className="text-left py-3 px-2 font-medium text-muted-foreground">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, i) => renderRow(row, i))
        )}
      </tbody>
    </table>
  </div>
);

export const MobileTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onTabChange(tab.value)}
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
          activeTab === tab.value
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const MobileModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-64px)] p-4">{children}</div>
      </div>
    </div>
  );
};

export const MobileBottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-background w-full rounded-t-2xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-64px)] p-4">{children}</div>
      </div>
    </div>
  );
};

export const MobileFAB = ({ onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors sm:hidden"
  >
    {Icon && <Icon className="h-5 w-5" />}
    {label && <span className="font-medium">{label}</span>}
  </button>
);

export const MobileNavigation = ({ items, activeItem, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t sm:hidden">
    <div className="flex justify-around items-center h-16">
      {items.slice(0, 5).map((item) => (
        <button
          key={item.path}
          onClick={() => onNavigate(item.path)}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full ${
            activeItem === item.path ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {item.icon && <item.icon className="h-5 w-5" />}
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </div>
  </nav>
);

export default {
  MobileContainer,
  MobileHeader,
  MobileCard,
  MobileGrid,
  MobileStatCard,
  MobileButton,
  MobileInput,
  MobileSelect,
  MobileTable,
  MobileTabs,
  MobileModal,
  MobileBottomSheet,
  MobileFAB,
  MobileNavigation,
};
