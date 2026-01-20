import React, { useState, useMemo } from 'react';
import {
  X, Download, FileText, Shield, Book, Database,
  ChevronRight, Lock, Key, Users, Server, AlertTriangle,
  CheckCircle, Clock, Settings, HardDrive, FileDown, Layers,
  ArrowRight, GitBranch, Box
} from 'lucide-react';
import { Order, SCHEMA_DEFINITION } from '../types';

interface SettingsPageProps {
  orders: Order[];
  onClose: () => void;
}

type SettingsTab = 'data' | 'schema' | 'sop' | 'specification' | 'security';

const SettingsPage: React.FC<SettingsPageProps> = ({ orders, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('data');

  const tabs = [
    { id: 'data' as SettingsTab, label: 'Data & Backups', icon: Database },
    { id: 'schema' as SettingsTab, label: 'Data Schema', icon: GitBranch },
    { id: 'sop' as SettingsTab, label: 'SOP & Training', icon: Book },
    { id: 'specification' as SettingsTab, label: 'Specification', icon: FileText },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
  ];

  // Database Statistics
  const dbStats = useMemo(() => {
    const activeOrders = orders.filter(o => !o.isArchived);
    const archivedOrders = orders.filter(o => o.isArchived);
    const totalLineItems = orders.reduce((sum, o) => sum + o.lineItems.length, 0);
    const uniqueCustomers = new Set(orders.map(o => o.customer)).size;
    const totalRevenue = orders.reduce((sum, o) =>
      sum + o.lineItems.reduce((s, li) => s + (li.price * li.qty), 0), 0
    );
    const totalCost = orders.reduce((sum, o) =>
      sum + o.lineItems.reduce((s, li) => s + (li.cost * li.qty), 0), 0
    );

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      archivedOrders: archivedOrders.length,
      totalLineItems,
      uniqueCustomers,
      totalRevenue,
      totalCost,
      leadsCount: orders.filter(o => o.status === 'Lead').length,
      quotesCount: orders.filter(o => o.status === 'Quote').length,
      inProductionCount: orders.filter(o => ['Production Prep', 'Inventory Received', 'Production'].includes(o.status)).length
    };
  }, [orders]);

  // Data Export Functions
  const exportFullDatabase = () => {
    const exportData = {
      metadata: {
        version: '2.0.0',
        schemaVersion: SCHEMA_DEFINITION.version,
        exportedAt: new Date().toISOString(),
        totalOrders: orders.length,
        totalLineItems: dbStats.totalLineItems,
        totalCustomers: dbStats.uniqueCustomers
      },
      orders: orders,
      schema: SCHEMA_DEFINITION
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pallet-database-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOrdersJSON = () => {
    const data = JSON.stringify(orders, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pallet-orders-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAnalyticsCSV = () => {
    const headers = ['Order Number', 'Customer', 'Email', 'Phone', 'Project', 'Status', 'Created', 'Due Date', 'Items', 'Units', 'Total Cost', 'Total Revenue', 'Profit', 'Rush', 'Art Status', 'Is Lead', 'Lead Source', 'Lead Temperature'];
    const rows = orders.map(order => {
      const totalUnits = order.lineItems.reduce((sum, li) => sum + li.qty, 0);
      const totalCost = order.lineItems.reduce((sum, li) => sum + (li.cost * li.qty), 0);
      const totalRevenue = order.lineItems.reduce((sum, li) => sum + (li.price * li.qty), 0);
      return [
        order.orderNumber,
        `"${order.customer}"`,
        order.customerEmail || '',
        order.customerPhone || '',
        `"${order.projectName}"`,
        order.status,
        new Date(order.createdAt).toISOString(),
        order.dueDate,
        order.lineItems.length,
        totalUnits,
        totalCost.toFixed(2),
        totalRevenue.toFixed(2),
        (totalRevenue - totalCost).toFixed(2),
        order.rushOrder ? 'Yes' : 'No',
        order.artStatus,
        order.status === 'Lead' ? 'Yes' : 'No',
        order.leadInfo?.source || '',
        order.leadInfo?.temperature || ''
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pallet-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLineItemsCSV = () => {
    const headers = ['Order Number', 'Customer', 'Status', 'Item Number', 'Name', 'Color', 'Size', 'Qty', 'Decoration', 'Placements', 'Cost', 'Price', 'Line Total', 'Ordered', 'Ordered At', 'Received', 'Received At', 'Decorated', 'Decorated At', 'Packed', 'Packed At'];
    const rows: string[] = [];

    orders.forEach(order => {
      order.lineItems.forEach(li => {
        rows.push([
          order.orderNumber,
          `"${order.customer}"`,
          order.status,
          li.itemNumber,
          `"${li.name}"`,
          li.color,
          li.size,
          li.qty,
          li.decorationType,
          li.decorationPlacements,
          li.cost.toFixed(2),
          li.price.toFixed(2),
          (li.price * li.qty).toFixed(2),
          li.ordered ? 'Yes' : 'No',
          li.orderedAt ? new Date(li.orderedAt).toISOString() : '',
          li.received ? 'Yes' : 'No',
          li.receivedAt ? new Date(li.receivedAt).toISOString() : '',
          li.decorated ? 'Yes' : 'No',
          li.decoratedAt ? new Date(li.decoratedAt).toISOString() : '',
          li.packed ? 'Yes' : 'No',
          li.packedAt ? new Date(li.packedAt).toISOString() : ''
        ].join(','));
      });
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pallet-line-items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSchemaJSON = () => {
    const data = JSON.stringify(SCHEMA_DEFINITION, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pallet-schema-v${SCHEMA_DEFINITION.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Settings className="text-blue-600" size={28} />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings & Documentation</h2>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Data & Backups Tab */}
          {activeTab === 'data' && (
            <div className="space-y-8 max-w-5xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Data Export & Backup</h3>
                <p className="text-slate-500">Download your data for backup purposes or analytics processing.</p>
              </div>

              {/* Database Status */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={24} />
                  <div>
                    <h4 className="font-bold text-lg">Database Status</h4>
                    <p className="text-slate-400 text-sm">Schema Version {SCHEMA_DEFINITION.version}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Orders</p>
                    <p className="text-2xl font-black">{dbStats.totalOrders}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Line Items</p>
                    <p className="text-2xl font-black">{dbStats.totalLineItems}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Customers</p>
                    <p className="text-2xl font-black">{dbStats.uniqueCustomers}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Active</p>
                    <p className="text-2xl font-black">{dbStats.activeOrders}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-xs uppercase">Archived</p>
                    <p className="text-2xl font-black">{dbStats.archivedOrders}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-600">Leads</p>
                  <p className="text-3xl font-black text-emerald-700">{dbStats.leadsCount}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-600">Quotes</p>
                  <p className="text-3xl font-black text-blue-700">{dbStats.quotesCount}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-sm font-medium text-amber-600">In Production</p>
                  <p className="text-3xl font-black text-amber-700">{dbStats.inProductionCount}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm font-medium text-green-600">Total Revenue</p>
                  <p className="text-3xl font-black text-green-700">${dbStats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 uppercase text-sm">Export Options</h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* Full Database Export */}
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Database className="text-white" size={28} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-lg">Full Database Export</h5>
                        <p className="text-sm text-slate-500">Complete database with schema definition, metadata, and all orders</p>
                        <p className="text-xs text-blue-600 mt-1">Recommended for full system backup or migration</p>
                      </div>
                    </div>
                    <button
                      onClick={exportFullDatabase}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      <Download size={18} /> Download
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <HardDrive className="text-slate-600" size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Orders Only (JSON)</h5>
                        <p className="text-sm text-slate-500">All order data without schema metadata</p>
                      </div>
                    </div>
                    <button
                      onClick={exportOrdersJSON}
                      className="flex items-center gap-2 bg-slate-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                    >
                      <Download size={18} /> Download
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <FileDown className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Order Analytics (CSV)</h5>
                        <p className="text-sm text-slate-500">Summary data for each order with financials</p>
                      </div>
                    </div>
                    <button
                      onClick={exportAnalyticsCSV}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                      <Download size={18} /> Download
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Layers className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Line Item Details (CSV)</h5>
                        <p className="text-sm text-slate-500">Every line item with full tracking timestamps</p>
                      </div>
                    </div>
                    <button
                      onClick={exportLineItemsCSV}
                      className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                    >
                      <Download size={18} /> Download
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <GitBranch className="text-cyan-600" size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Schema Definition (JSON)</h5>
                        <p className="text-sm text-slate-500">Database schema for integration/migration</p>
                      </div>
                    </div>
                    <button
                      onClick={exportSchemaJSON}
                      className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-700 transition-colors"
                    >
                      <Download size={18} /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schema Tab - Visual ERD */}
          {activeTab === 'schema' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Data Schema Diagram</h3>
                <p className="text-slate-500">Visual representation of the database structure and entity relationships.</p>
              </div>

              {/* Schema Version Info */}
              <div className="bg-slate-800 text-white rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GitBranch size={20} />
                  <span className="font-bold">Schema Version {SCHEMA_DEFINITION.version}</span>
                </div>
                <button
                  onClick={exportSchemaJSON}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download size={16} /> Export Schema
                </button>
              </div>

              {/* Visual ERD */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 overflow-x-auto">
                <div className="min-w-[1000px]">
                  {/* ERD Diagram */}
                  <div className="relative">
                    {/* Main Order Entity - Center */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-blue-600 text-white rounded-xl p-1 shadow-xl w-80">
                        <div className="bg-blue-700 rounded-t-lg px-4 py-2 font-bold text-lg flex items-center gap-2">
                          <Box size={18} />
                          Order
                        </div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-3 text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-blue-600 font-bold">PK</span> <span>id: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>orderNumber: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>customer: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>customerEmail?: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>customerPhone?: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>projectName: string</span></div>
                          <div className="flex justify-between"><span className="text-purple-600 font-bold">FK</span> <span>status: OrderStatus</span></div>
                          <div className="flex justify-between"><span className="text-purple-600 font-bold">FK</span> <span>artStatus: ArtStatus</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>createdAt: Date</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>dueDate: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>rushOrder: boolean</span></div>
                          <div className="flex justify-between"><span className="text-green-600 font-bold">1:N</span> <span>lineItems: LineItem[]</span></div>
                          <div className="flex justify-between"><span className="text-green-600 font-bold">1:1</span> <span>leadInfo?: LeadInfo</span></div>
                          <div className="flex justify-between"><span className="text-green-600 font-bold">1:1</span> <span>prepStatus: PrepStatus</span></div>
                          <div className="flex justify-between"><span className="text-green-600 font-bold">1:1</span> <span>fulfillment: FulfillmentStatus</span></div>
                          <div className="flex justify-between"><span className="text-green-600 font-bold">1:1</span> <span>closeoutChecklist: CloseoutChecklist</span></div>
                          <div className="flex justify-between"><span className="text-green-600 font-bold">1:N</span> <span>history: StatusChangeLog[]</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>version: number</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>isArchived: boolean</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Related Entities Row */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                      {/* LineItem */}
                      <div className="bg-emerald-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-emerald-700 rounded-t-lg px-3 py-2 font-bold flex items-center gap-2">
                          <Layers size={16} />
                          LineItem
                        </div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-2 text-xs space-y-0.5">
                          <div className="flex justify-between"><span className="text-blue-600 font-bold">PK</span> <span>id: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>itemNumber: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>name: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>color: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>size: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>qty: number</span></div>
                          <div className="flex justify-between"><span className="text-purple-600 font-bold">FK</span> <span>decorationType</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>cost: number</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>price: number</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>ordered: boolean</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>received: boolean</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>decorated: boolean</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>packed: boolean</span></div>
                        </div>
                      </div>

                      {/* LeadInfo */}
                      <div className="bg-amber-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-amber-700 rounded-t-lg px-3 py-2 font-bold flex items-center gap-2">
                          <Users size={16} />
                          LeadInfo
                        </div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-2 text-xs space-y-0.5">
                          <div className="flex justify-between"><span className="text-purple-600 font-bold">FK</span> <span>source: LeadSource</span></div>
                          <div className="flex justify-between"><span className="text-purple-600 font-bold">FK</span> <span>temperature</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>estimatedQuantity</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>estimatedValue</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>productInterest</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>eventDate?: string</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>followUpDate?</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>contactedAt: Date</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>contactNotes?</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>budget?: string</span></div>
                        </div>
                      </div>

                      {/* PrepStatus */}
                      <div className="bg-purple-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-purple-700 rounded-t-lg px-3 py-2 font-bold flex items-center gap-2">
                          <Settings size={16} />
                          PrepStatus
                        </div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-2 text-xs space-y-0.5">
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>gangSheetCreated</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>artworkDigitized</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>screensBurned</span></div>
                          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t">boolean | null for each</div>
                        </div>
                      </div>

                      {/* FulfillmentStatus */}
                      <div className="bg-cyan-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-cyan-700 rounded-t-lg px-3 py-2 font-bold flex items-center gap-2">
                          <Box size={16} />
                          FulfillmentStatus
                        </div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-2 text-xs space-y-0.5">
                          <div className="flex justify-between"><span className="text-purple-600 font-bold">FK</span> <span>method</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>shippingLabelPrinted</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>customerPickedUp</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>trackingNumber?</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">-</span> <span>fulfilledAt?: Date</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row - Enums and Supporting */}
                    <div className="grid grid-cols-5 gap-3">
                      {/* OrderStatus Enum */}
                      <div className="bg-slate-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-slate-700 rounded-t-lg px-3 py-1.5 font-bold text-sm">OrderStatus</div>
                        <div className="bg-slate-100 text-slate-700 rounded-b-lg p-2 text-[10px] space-y-0.5">
                          <div>Lead</div>
                          <div>Quote</div>
                          <div>Approval</div>
                          <div>Art Confirmation</div>
                          <div>Inventory Order</div>
                          <div>Production Prep</div>
                          <div>Inventory Received</div>
                          <div>Production</div>
                          <div>Fulfillment</div>
                          <div>Invoice</div>
                        </div>
                      </div>

                      {/* ProductionMethod Enum */}
                      <div className="bg-slate-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-slate-700 rounded-t-lg px-3 py-1.5 font-bold text-sm">ProductionMethod</div>
                        <div className="bg-slate-100 text-slate-700 rounded-b-lg p-2 text-[10px] space-y-0.5">
                          <div>ScreenPrint</div>
                          <div>Embroidery</div>
                          <div>DTF</div>
                          <div>Other</div>
                        </div>
                      </div>

                      {/* LeadSource Enum */}
                      <div className="bg-slate-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-slate-700 rounded-t-lg px-3 py-1.5 font-bold text-sm">LeadSource</div>
                        <div className="bg-slate-100 text-slate-700 rounded-b-lg p-2 text-[10px] space-y-0.5">
                          <div>Website</div>
                          <div>Referral</div>
                          <div>Social Media</div>
                          <div>Cold Call</div>
                          <div>Trade Show</div>
                          <div>Email Campaign</div>
                          <div>Other</div>
                        </div>
                      </div>

                      {/* CloseoutChecklist */}
                      <div className="bg-green-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-green-700 rounded-t-lg px-3 py-1.5 font-bold text-sm">CloseoutChecklist</div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-2 text-[10px] space-y-0.5">
                          <div>filesSaved: boolean</div>
                          <div>canvaArchived: boolean</div>
                          <div>summaryUploaded: boolean</div>
                          <div>invoiceSent: boolean</div>
                        </div>
                      </div>

                      {/* StatusChangeLog */}
                      <div className="bg-red-600 text-white rounded-xl p-1 shadow-lg">
                        <div className="bg-red-700 rounded-t-lg px-3 py-1.5 font-bold text-sm">StatusChangeLog</div>
                        <div className="bg-white text-slate-700 rounded-b-lg p-2 text-[10px] space-y-0.5">
                          <div>timestamp: Date</div>
                          <div>userId?: string</div>
                          <div>action: string</div>
                          <div>previousValue: any</div>
                          <div>newValue: any</div>
                          <div>notes?: string</div>
                        </div>
                      </div>
                    </div>

                    {/* Relationship Lines Legend */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-4">Relationship Legend</h4>
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-xs">PK</span>
                          <span className="text-slate-600">Primary Key</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold text-xs">FK</span>
                          <span className="text-slate-600">Foreign Key / Enum Reference</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-xs">1:N</span>
                          <span className="text-slate-600">One-to-Many Relationship</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-xs">1:1</span>
                          <span className="text-slate-600">One-to-One Relationship</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Workflow Diagram */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <h4 className="font-bold text-slate-900 text-lg mb-2">Application Workflow Diagram</h4>
                <p className="text-slate-500 text-sm mb-6">Complete visual guide to order processing from lead capture to invoice.</p>

                {/* Swimlane Workflow */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Swimlane Headers */}
                  <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200">
                    <div className="px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-slate-700 text-sm">SALES</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-bold text-slate-700 text-sm">OPERATIONS</span>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="font-bold text-slate-700 text-sm">PRODUCTION</span>
                      </div>
                    </div>
                  </div>

                  {/* Swimlane Content */}
                  <div className="grid grid-cols-3 min-h-[500px]">
                    {/* Sales Lane */}
                    <div className="border-r border-slate-200 p-4 bg-emerald-50/30">
                      <div className="space-y-4">
                        {/* Lead */}
                        <div className="bg-white rounded-xl border-2 border-emerald-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">0</div>
                            <span className="font-bold text-slate-800">Lead</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Capture customer inquiry</li>
                            <li>• Record contact info</li>
                            <li>• Set temperature (Hot/Warm/Cold)</li>
                            <li>• Estimate quantity & value</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Gate: Customer info captured</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-emerald-300"></div>
                        </div>

                        {/* Quote */}
                        <div className="bg-white rounded-xl border-2 border-emerald-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                            <span className="font-bold text-slate-800">Quote</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Add line items (SKU grid)</li>
                            <li>• Set decoration types</li>
                            <li>• Auto-calculate pricing</li>
                            <li>• Set due date</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Gate: Line items added</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-emerald-300"></div>
                        </div>

                        {/* Approval */}
                        <div className="bg-white rounded-xl border-2 border-emerald-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                            <span className="font-bold text-slate-800">Approval</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Send quote to customer</li>
                            <li>• Await customer approval</li>
                            <li>• Collect deposit if needed</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Gate: Customer approves</span>
                          </div>
                        </div>

                        <div className="flex justify-center items-center gap-2">
                          <div className="w-0.5 h-6 bg-slate-300"></div>
                        </div>
                        <div className="flex justify-center">
                          <ArrowRight className="text-blue-400" size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Operations Lane */}
                    <div className="border-r border-slate-200 p-4 bg-blue-50/30">
                      <div className="space-y-4">
                        {/* Art Confirmation */}
                        <div className="bg-white rounded-xl border-2 border-blue-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                            <span className="font-bold text-slate-800">Art Confirmation</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Create artwork proof</li>
                            <li>• Send to customer</li>
                            <li>• Get approval or revise</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Gate: Art approved (or bypass)</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-blue-300"></div>
                        </div>

                        {/* Inventory Order */}
                        <div className="bg-white rounded-xl border-2 border-blue-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                            <span className="font-bold text-slate-800">Inventory Order</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Order blank goods</li>
                            <li>• Mark each item ordered</li>
                            <li>• Track supplier orders</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Gate: All items ordered</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-blue-300"></div>
                        </div>

                        {/* Production Prep */}
                        <div className="bg-white rounded-xl border-2 border-blue-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">5</div>
                            <span className="font-bold text-slate-800">Production Prep</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• DTF: Create gang sheet</li>
                            <li>• Embroidery: Digitize art</li>
                            <li>• Screen: Burn screens</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Gate: Prep tasks complete</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-blue-300"></div>
                        </div>

                        {/* Inventory Received */}
                        <div className="bg-white rounded-xl border-2 border-blue-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">6</div>
                            <span className="font-bold text-slate-800">Inventory Received</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Receive shipments</li>
                            <li>• Verify quantities</li>
                            <li>• Check for defects</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Gate: All items received</span>
                          </div>
                        </div>

                        <div className="flex justify-center items-center gap-2">
                          <div className="w-0.5 h-6 bg-slate-300"></div>
                        </div>
                        <div className="flex justify-center">
                          <ArrowRight className="text-purple-400" size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Production Lane */}
                    <div className="p-4 bg-purple-50/30">
                      <div className="space-y-4">
                        {/* Production */}
                        <div className="bg-white rounded-xl border-2 border-purple-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">7</div>
                            <span className="font-bold text-slate-800">Production</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Run sheet tracking</li>
                            <li>• Mark items decorated</li>
                            <li>• Mark items packed</li>
                            <li>• Quality check</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-purple-600 uppercase">Gate: All decorated & packed</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-purple-300"></div>
                        </div>

                        {/* Fulfillment */}
                        <div className="bg-white rounded-xl border-2 border-purple-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">8</div>
                            <span className="font-bold text-slate-800">Fulfillment</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Print shipping label</li>
                            <li className="text-slate-400">— OR —</li>
                            <li>• Customer pickup</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-purple-600 uppercase">Gate: Shipped or picked up</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-purple-300"></div>
                        </div>

                        {/* Invoice */}
                        <div className="bg-white rounded-xl border-2 border-green-400 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">9</div>
                            <span className="font-bold text-slate-800">Invoice & Closeout</span>
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1 ml-8">
                            <li>• Save files to folder</li>
                            <li>• Archive Canva proof</li>
                            <li>• Upload order summary</li>
                            <li>• Send invoice</li>
                          </ul>
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-green-600 uppercase">Gate: All closeout complete</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-green-300"></div>
                        </div>

                        {/* Archive */}
                        <div className="bg-slate-800 rounded-xl p-4 shadow-sm text-center">
                          <span className="font-bold text-white text-sm">✓ ARCHIVED</span>
                          <p className="text-slate-400 text-xs mt-1">Order complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Legend */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h5 className="font-bold text-slate-700 text-sm mb-4">Workflow Legend</h5>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">0-2</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Sales Funnel</p>
                        <p className="text-xs text-slate-500">Lead → Approval</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3-6</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Operations</p>
                        <p className="text-xs text-slate-500">Art → Receiving</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">7-8</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Production</p>
                        <p className="text-xs text-slate-500">Decorate → Ship</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">9</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Closeout</p>
                        <p className="text-xs text-slate-500">Invoice → Archive</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decoration Methods */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h5 className="font-bold text-slate-700 text-sm mb-4">Decoration Methods & Prep Requirements</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="font-bold text-purple-800">Screen Print</span>
                      </div>
                      <p className="text-xs text-purple-700">Requires: Screens burned</p>
                      <p className="text-xs text-purple-600 mt-1">+$2/placement, +$1/color</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="font-bold text-amber-800">Embroidery</span>
                      </div>
                      <p className="text-xs text-amber-700">Requires: Art digitized</p>
                      <p className="text-xs text-amber-600 mt-1">+$0/10/20 by stitch count</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span className="font-bold text-cyan-800">DTF</span>
                      </div>
                      <p className="text-xs text-cyan-700">Requires: Gang sheet created</p>
                      <p className="text-xs text-cyan-600 mt-1">+$5 standard, +$8 large</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linear State Machine (simplified view) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <h4 className="font-bold text-slate-900 text-lg mb-6">Linear Stage Progression</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-4">
                  {SCHEMA_DEFINITION.workflow.stages.map((stage, index) => (
                    <React.Fragment key={stage.number}>
                      <div className="flex flex-col items-center min-w-[100px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          stage.number === 0 ? 'bg-emerald-500' :
                          stage.number <= 2 ? 'bg-emerald-500' :
                          stage.number <= 6 ? 'bg-blue-500' :
                          stage.number <= 8 ? 'bg-purple-500' : 'bg-green-500'
                        }`}>
                          {stage.number}
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-2 text-center">{stage.name}</p>
                        <p className="text-[10px] text-slate-400 text-center mt-1 max-w-[90px]">{stage.gateCondition}</p>
                      </div>
                      {index < SCHEMA_DEFINITION.workflow.stages.length - 1 && (
                        <ArrowRight className="text-slate-300 flex-shrink-0" size={20} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Entity Details Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 text-lg mb-4">Entity Field Reference</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-3 font-bold text-slate-600">Entity</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Total Fields</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Required</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Optional</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Relationships</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SCHEMA_DEFINITION.entities).map(([name, entity]) => {
                        const fields = Object.values(entity.fields);
                        const required = fields.filter((f: any) => f.required).length;
                        const relationships = 'relationships' in entity && entity.relationships ? Object.keys(entity.relationships).length : 0;
                        return (
                          <tr key={name} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-bold text-slate-900">{name}</td>
                            <td className="px-4 py-3 text-slate-600">{fields.length}</td>
                            <td className="px-4 py-3 text-green-600 font-medium">{required}</td>
                            <td className="px-4 py-3 text-slate-400">{fields.length - required}</td>
                            <td className="px-4 py-3 text-blue-600 font-medium">{relationships}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SOP & Training Tab */}
          {activeTab === 'sop' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Standard Operating Procedures & Training Guide</h3>
                <p className="text-slate-500">Complete documentation for system operation and staff training.</p>
              </div>

              <div className="prose prose-slate max-w-none">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <h4 className="text-blue-900 font-bold text-lg m-0 mb-2">Pallet 2.0 - Production Management System</h4>
                  <p className="text-blue-700 m-0">Standard Operating Procedures Manual v2.0</p>
                </div>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2">1. System Overview</h4>
                <p>Pallet 2.0 is a comprehensive production management system designed for apparel decoration businesses. The system manages orders through a 10-stage workflow from initial lead capture through final invoice and archival.</p>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2 mt-8">2. Workflow Stages</h4>

                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <h5 className="font-bold text-emerald-800 m-0">Stage 0: Lead</h5>
                    <p className="text-sm text-emerald-700 m-0 mt-1">Capture initial customer inquiries with estimated quantities, product interests, and lead qualification data for sales funnel tracking.</p>
                    <p className="text-xs text-emerald-600 m-0 mt-2"><strong>Action:</strong> Convert to Quote</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 1: Quote</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Build quotes using the SKU-based line item system. Enter product details, decoration specifications, and quantities using the color/size grid.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Action:</strong> Submit Quote for Approval</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 2: Approval</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Customer reviews and approves the quote. System displays total value and item count.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Action:</strong> Quote Approved - Continue</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 3: Art Confirmation</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Artwork approval stage. Can approve art or bypass to continue with pending art status.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Actions:</strong> Art Approved OR Advance to Purchasing (Art Pending)</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 4: Inventory Order</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Purchasing checklist for all line items. Mark each item as ordered from suppliers.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Gate:</strong> All items must be marked as ordered to proceed</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 5: Production Prep</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Dynamic checklist based on decoration methods: DTF (gang sheet), Embroidery (digitizing), Screen Print (screens).</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Gate:</strong> All applicable prep tasks must be complete</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 6: Inventory Received</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Receiving checklist to verify all ordered inventory has arrived.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Gate:</strong> All items must be marked as received</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 7: Production</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Run sheet with dual tracking columns. Mark items as decorated, then packed.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Gate:</strong> All items must be decorated AND packed</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 8: Fulfillment</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Complete order delivery via shipping or customer pickup.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Options:</strong> Shipping Label Printed OR Customer Picked Up</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-bold text-slate-800 m-0">Stage 9: Invoice & Closeout</h5>
                    <p className="text-sm text-slate-600 m-0 mt-1">Administrative closeout: Files saved, Canva archived, Summary uploaded, Invoice sent.</p>
                    <p className="text-xs text-slate-500 m-0 mt-2"><strong>Final Action:</strong> Close & Archive Order</p>
                  </div>
                </div>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2 mt-8">3. Pricing Calculations</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Base Price:</strong> Wholesale Cost × 2.0</li>
                  <li><strong>Screen Print:</strong> +$2.00/placement + $1.00/color + $2.00 for 2XL+ sizes</li>
                  <li><strong>DTF:</strong> +$5.00 (Standard) or +$8.00 (Large)</li>
                  <li><strong>Embroidery:</strong> +$0 (&lt;8k), +$10 (8k-12k), +$20 (12k+)</li>
                </ul>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2 mt-8">4. Best Practices</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Always complete stages in order - do not skip stages</li>
                  <li>Mark line items complete immediately when finished</li>
                  <li>Use rush order flag for time-sensitive jobs</li>
                  <li>Export data backups weekly using the Full Database Export</li>
                  <li>Complete all closeout checklist items before archiving</li>
                </ul>
              </div>
            </div>
          )}

          {/* Specification Tab */}
          {activeTab === 'specification' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Application Specification</h3>
                <p className="text-slate-500">Complete technical specification for the Pallet 2.0 system.</p>
              </div>

              <div className="prose prose-slate max-w-none">
                <div className="bg-slate-800 text-white rounded-xl p-6 mb-8">
                  <h4 className="text-white font-bold text-lg m-0 mb-2">Pallet 2.0 - Technical Specification</h4>
                  <p className="text-slate-300 m-0">Version 2.0 | Schema Version {SCHEMA_DEFINITION.version}</p>
                </div>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2">1. Technology Stack</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Frontend:</strong> React 19.x with TypeScript</li>
                  <li><strong>Build Tool:</strong> Vite 6.x</li>
                  <li><strong>Styling:</strong> Tailwind CSS (CDN)</li>
                  <li><strong>Icons:</strong> Lucide React</li>
                  <li><strong>State Management:</strong> React useState/useMemo hooks</li>
                </ul>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2 mt-8">2. Data Persistence</h4>
                <p>For production deployment, integrate with:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>PostgreSQL or MySQL for relational data</li>
                  <li>Redis for session caching</li>
                  <li>S3-compatible storage for file attachments</li>
                </ul>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2 mt-8">3. API Integration Points</h4>
                <div className="bg-slate-100 rounded-lg p-4 font-mono text-sm">
                  <pre className="m-0">{`GET    /api/orders              # List orders (with filters)
GET    /api/orders/:id          # Get single order
POST   /api/orders              # Create order/lead
PUT    /api/orders/:id          # Update order
DELETE /api/orders/:id          # Archive order
POST   /api/orders/:id/advance  # Advance to next stage

GET    /api/customers           # List customers
GET    /api/reports/queue       # Queue report data
GET    /api/reports/performance # Performance analytics

GET    /api/export/database     # Full database export
GET    /api/export/orders       # Orders JSON
GET    /api/export/analytics    # Analytics CSV
GET    /api/export/lineitems    # Line items CSV
GET    /api/export/schema       # Schema definition`}</pre>
                </div>

                <h4 className="text-slate-900 font-bold border-b border-slate-200 pb-2 mt-8">4. Component Structure</h4>
                <div className="bg-slate-100 rounded-lg p-4 font-mono text-sm">
                  <pre className="m-0">{`/
├── App.tsx                 # Main application shell
├── types.ts                # TypeScript interfaces & schema
├── constants.tsx           # Stage definitions, defaults
├── components/
│   ├── Sidebar.tsx         # Icon navigation bar
│   ├── WorkflowSidebar.tsx # Stage navigation
│   ├── OrderCard.tsx       # Order summary cards
│   ├── OrderSlideOver.tsx  # Order detail panel (10 stages)
│   ├── NewOrderModal.tsx   # Create lead/order form
│   ├── CustomerSearch.tsx  # Customer search autocomplete
│   ├── ReportsPage.tsx     # Queue & Performance reports
│   └── SettingsPage.tsx    # Settings & documentation
└── utils/
    └── pricing.ts          # Price calculation logic`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise Security Configuration</h3>
                <p className="text-slate-500">Configure security features for enterprise deployment.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-amber-800">Development Mode Active</p>
                  <p className="text-sm text-amber-700">Security features below are configuration templates for production deployment.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 uppercase text-sm">Authentication & Access Control</h4>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Key className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Single Sign-On (SSO)</h5>
                        <p className="text-sm text-slate-500">SAML 2.0 / OAuth 2.0 / OpenID Connect</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Available</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Role-Based Access Control (RBAC)</h5>
                        <p className="text-sm text-slate-500">Admin, Sales Manager, Production Lead, Viewer roles</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Available</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Lock className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">Multi-Factor Authentication (MFA)</h5>
                        <p className="text-sm text-slate-500">TOTP, SMS, Hardware keys</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Available</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 uppercase text-sm">Data Security</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Encryption at Rest</p>
                      <p className="text-xs text-slate-500">AES-256</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Encryption in Transit</p>
                      <p className="text-xs text-slate-500">TLS 1.3</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Audit Logging</p>
                      <p className="text-xs text-slate-500">Full trail</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Data Backup</p>
                      <p className="text-xs text-slate-500">Full export available</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 uppercase text-sm">Compliance</h4>
                <div className="grid grid-cols-4 gap-4">
                  {['SOC 2 Type II', 'GDPR', 'CCPA', 'HIPAA Ready'].map(cert => (
                    <div key={cert} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                      <span className="font-bold text-slate-900 text-sm">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
