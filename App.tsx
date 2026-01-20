
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Bell, X } from 'lucide-react';
import { Order, OrderStatus, ViewMode } from './types';
import { DUMMY_ORDERS, ORDER_STAGES } from './constants';
import Sidebar from './components/Sidebar';
import WorkflowSidebar from './components/WorkflowSidebar';
import OrderCard from './components/OrderCard';
import OrderSlideOver from './components/OrderSlideOver';
import NewOrderModal from './components/NewOrderModal';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import CustomerSearch from './components/CustomerSearch';

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(DUMMY_ORDERS);
  const [currentStage, setCurrentStage] = useState<OrderStatus>('Lead');
  const [viewMode, setViewMode] = useState<ViewMode>('Sales');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [activeView, setActiveView] = useState<'orders' | 'settings' | 'reports'>('orders');

  // When a customer is selected, show all their orders across all stages
  // When no customer is selected, show orders in the current stage
  const filteredOrders = useMemo(() => {
    if (selectedCustomer) {
      // Show all orders for the selected customer across all stages
      return orders.filter(o =>
        !o.isArchived &&
        o.customer === selectedCustomer
      );
    }
    // Normal stage-based filtering
    return orders.filter(o =>
      !o.isArchived &&
      o.status === currentStage
    );
  }, [orders, currentStage, selectedCustomer]);

  // Get customer's orders grouped by stage for display
  const customerOrdersByStage = useMemo(() => {
    if (!selectedCustomer) return null;
    const grouped: Record<OrderStatus, Order[]> = {} as Record<OrderStatus, Order[]>;
    ORDER_STAGES.forEach(stage => {
      grouped[stage] = orders.filter(o =>
        !o.isArchived &&
        o.customer === selectedCustomer &&
        o.status === stage
      );
    });
    return grouped;
  }, [orders, selectedCustomer]);

  const countsByStage = useMemo(() => {
    return orders.filter(o => !o.isArchived).reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);

  const handleUpdateOrder = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    setSelectedOrder(updated);
  };

  const handleCreateOrder = (newOrder: any) => {
    setOrders(prev => [newOrder as Order, ...prev]);
    setShowNewOrder(false);
    setCurrentStage(newOrder.status || 'Lead');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        activeView={activeView}
        onSettingsClick={() => setActiveView('settings')}
        onOrdersClick={() => setActiveView('orders')}
        onReportsClick={() => setActiveView('reports')}
      />
      {activeView === 'settings' ? (
        <SettingsPage orders={orders} onClose={() => setActiveView('orders')} />
      ) : activeView === 'reports' ? (
        <ReportsPage orders={orders} onClose={() => setActiveView('orders')} />
      ) : (
        <>
          <WorkflowSidebar
            currentStage={currentStage}
            counts={countsByStage}
            onStageSelect={setCurrentStage}
            onNewOrder={() => setShowNewOrder(true)}
          />

          <main className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
              <div className="flex items-center gap-6 flex-1">
                <h1 className="text-xl font-bold text-slate-900">Gemini Studio</h1>
                <div className="w-96">
                  <CustomerSearch
                    orders={orders}
                    onSelectCustomer={setSelectedCustomer}
                    placeholder="Search by business name..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('Sales')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      viewMode === 'Sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Sales View
                  </button>
                  <button
                    onClick={() => setViewMode('Production')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      viewMode === 'Production' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Production View
                  </button>
                </div>

                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Bell size={20} />
                </button>
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    JD
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                {/* Customer Filter Active Banner */}
                {selectedCustomer && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Showing all orders for</p>
                      <p className="text-lg font-bold text-blue-900">{selectedCustomer}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer('')}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      <X size={16} />
                      Clear Filter
                    </button>
                  </div>
                )}

                {selectedCustomer && customerOrdersByStage ? (
                  // Customer-specific view: show orders grouped by stage
                  <div className="space-y-8">
                    {ORDER_STAGES.map(stage => {
                      const stageOrders = customerOrdersByStage[stage];
                      if (stageOrders.length === 0) return null;

                      return (
                        <div key={stage}>
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-bold text-slate-900">{stage}</h3>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                              {stageOrders.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {stageOrders.map(order => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                viewMode={viewMode}
                                onClick={setSelectedOrder}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                        <Search size={48} strokeWidth={1} className="mb-4" />
                        <p className="font-medium">No active orders for {selectedCustomer}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Normal stage-based view
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-1">{currentStage}</h2>
                        <p className="text-slate-500 text-sm">Managing {filteredOrders.length} orders in this stage</p>
                      </div>
                    </div>

                    {filteredOrders.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOrders.map(order => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            viewMode={viewMode}
                            onClick={setSelectedOrder}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                        <Search size={48} strokeWidth={1} className="mb-4" />
                        <p className="font-medium">No orders found in {currentStage}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>

          {/* Slide-over Detail View */}
          {selectedOrder && (
            <>
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 animate-in fade-in duration-300"
                onClick={() => setSelectedOrder(null)}
              />
              <OrderSlideOver
                order={selectedOrder}
                viewMode={viewMode}
                onClose={() => setSelectedOrder(null)}
                onUpdate={handleUpdateOrder}
              />
            </>
          )}

          {/* Modals */}
          {showNewOrder && (
            <NewOrderModal
              onClose={() => setShowNewOrder(false)}
              onCreate={handleCreateOrder}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
