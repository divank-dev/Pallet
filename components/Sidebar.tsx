
import React from 'react';
import { LayoutDashboard, ShoppingBag, Box, Settings, Gem, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeView: 'orders' | 'settings' | 'reports';
  onSettingsClick: () => void;
  onOrdersClick: () => void;
  onReportsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onSettingsClick, onOrdersClick, onReportsClick }) => {
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', active: false, onClick: () => {} },
    { icon: ShoppingBag, label: 'Orders', active: activeView === 'orders', onClick: onOrdersClick },
    { icon: BarChart3, label: 'Reports', active: activeView === 'reports', onClick: onReportsClick },
    { icon: Box, label: 'Inventory', active: false, onClick: () => {} },
    { icon: Settings, label: 'Settings', active: activeView === 'settings', onClick: onSettingsClick },
  ];

  return (
    <div className="w-20 bg-slate-900 h-full flex flex-col items-center py-6 gap-8">
      <div className="text-blue-400 mb-4">
        <Gem size={32} />
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
