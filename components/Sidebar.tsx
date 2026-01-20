
import React from 'react';
import { ShoppingBag, Box, Settings, Shirt, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: 'orders' | 'settings' | 'reports' | 'fulfillment';
  onSettingsClick: () => void;
  onOrdersClick: () => void;
  onReportsClick: () => void;
  onFulfillmentClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onSettingsClick, onOrdersClick, onReportsClick, onFulfillmentClick }) => {
  const { permissions } = useAuth();

  const items = [
    { icon: ShoppingBag, label: 'Orders', active: activeView === 'orders', onClick: onOrdersClick, visible: true },
    { icon: BarChart3, label: 'Reports', active: activeView === 'reports', onClick: onReportsClick, visible: permissions.canViewReports },
    { icon: Box, label: 'Fulfillment', active: activeView === 'fulfillment', onClick: onFulfillmentClick, visible: permissions.canAccessFulfillmentTracking },
    { icon: Settings, label: 'Settings', active: activeView === 'settings', onClick: onSettingsClick, visible: permissions.canAccessSettings },
  ].filter(item => item.visible);

  return (
    <div className="w-20 bg-slate-900 h-full flex flex-col items-center py-6 gap-8">
      <div className="text-blue-400 mb-4">
        <Shirt size={32} />
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`p-3 rounded-xl transition-all ${
            item.active
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <item.icon size={24} />
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
