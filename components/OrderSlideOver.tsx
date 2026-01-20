import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, ShoppingCart, FileText, Package, Palette, Layers, Truck, Archive, ClipboardCheck, Printer, Settings, Users, Calendar, DollarSign, Phone, Mail, ThermometerSun, Target } from 'lucide-react';
import { Order, ViewMode, LineItem, ProductionMethod, STAGE_NUMBER, LeadSource, LeadTemperature, LeadInfo } from '../types';
import { calculatePrice } from '../utils/pricing';
import { DEFAULT_LEAD_INFO } from '../constants';

interface OrderSlideOverProps {
  order: Order;
  viewMode: ViewMode;
  onClose: () => void;
  onUpdate: (order: Order) => void;
}

const DECORATION_TYPES: { value: ProductionMethod; label: string }[] = [
  { value: 'ScreenPrint', label: 'Screen Print' },
  { value: 'DTF', label: 'DTF (Direct to Film)' },
  { value: 'Embroidery', label: 'Embroidery' },
  { value: 'Other', label: 'Other' }
];

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'OS'];

interface ColorRow {
  id: string;
  color: string;
  quantities: { [size: string]: number };
}

interface SkuConfig {
  itemNumber: string;
  name: string;
  cost: number;
  decorationType: ProductionMethod;
  decorationPlacements: number;
  decorationDescription: string;
  screenPrintColors: number;
  stitchCountTier: '<8k' | '8k-12k' | '12k+';
  dtfSize: 'Standard' | 'Large';
  colorRows: ColorRow[];
}

const createEmptyColorRow = (): ColorRow => ({
  id: Math.random().toString(36).substr(2, 9),
  color: '',
  quantities: SIZE_OPTIONS.reduce((acc, size) => ({ ...acc, [size]: 0 }), {})
});

const createEmptySkuConfig = (): SkuConfig => ({
  itemNumber: '',
  name: '',
  cost: 0,
  decorationType: 'ScreenPrint',
  decorationPlacements: 1,
  decorationDescription: '',
  screenPrintColors: 1,
  stitchCountTier: '<8k',
  dtfSize: 'Standard',
  colorRows: [createEmptyColorRow()]
});

const OrderSlideOver: React.FC<OrderSlideOverProps> = ({ order, viewMode, onClose, onUpdate }) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [skuConfig, setSkuConfig] = useState<SkuConfig>(createEmptySkuConfig());

  const openAddItemModal = () => {
    setSkuConfig(createEmptySkuConfig());
    setShowAddItem(true);
  };

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return order.lineItems?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0;
  }, [order.lineItems]);

  // Check if size is plus size for surcharge
  const checkPlusSize = (size: string): boolean => {
    return ['2XL', '3XL', '4XL'].includes(size);
  };

  // Detect required prep tasks based on line item decoration methods
  const requiredPrepTasks = useMemo(() => {
    const methods = new Set(order.lineItems?.map(item => item.decorationType) || []);
    return {
      needsGangSheet: methods.has('DTF'),
      needsDigitizing: methods.has('Embroidery'),
      needsScreens: methods.has('ScreenPrint')
    };
  }, [order.lineItems]);

  // Check if all required prep tasks are complete
  const allPrepComplete = useMemo(() => {
    const { needsGangSheet, needsDigitizing, needsScreens } = requiredPrepTasks;
    const { prepStatus } = order;

    if (needsGangSheet && !prepStatus.gangSheetCreated) return false;
    if (needsDigitizing && !prepStatus.artworkDigitized) return false;
    if (needsScreens && !prepStatus.screensBurned) return false;
    return true;
  }, [requiredPrepTasks, order.prepStatus]);

  // Add color row
  const addColorRow = () => {
    setSkuConfig(prev => ({
      ...prev,
      colorRows: [...prev.colorRows, createEmptyColorRow()]
    }));
  };

  const removeColorRow = (rowId: string) => {
    setSkuConfig(prev => ({
      ...prev,
      colorRows: prev.colorRows.filter(row => row.id !== rowId)
    }));
  };

  const updateColorName = (rowId: string, color: string) => {
    setSkuConfig(prev => ({
      ...prev,
      colorRows: prev.colorRows.map(row =>
        row.id === rowId ? { ...row, color } : row
      )
    }));
  };

  const updateQuantity = (rowId: string, size: string, qty: number) => {
    setSkuConfig(prev => ({
      ...prev,
      colorRows: prev.colorRows.map(row =>
        row.id === rowId
          ? { ...row, quantities: { ...row.quantities, [size]: Math.max(0, qty) } }
          : row
      )
    }));
  };

  // Generate line items from SKU config
  const handleAddSkuToOrder = () => {
    const newLineItems: LineItem[] = [];

    skuConfig.colorRows.forEach(colorRow => {
      if (!colorRow.color) return;

      SIZE_OPTIONS.forEach(size => {
        const qty = colorRow.quantities[size];
        if (qty > 0) {
          const isPlusSize = checkPlusSize(size);
          const itemData = {
            decorationType: skuConfig.decorationType,
            cost: skuConfig.cost,
            decorationPlacements: skuConfig.decorationPlacements,
            screenPrintColors: skuConfig.screenPrintColors,
            isPlusSize,
            stitchCountTier: skuConfig.stitchCountTier,
            dtfSize: skuConfig.dtfSize
          };
          const unitPrice = calculatePrice(itemData);

          const item: LineItem = {
            id: Math.random().toString(36).substr(2, 9),
            itemNumber: skuConfig.itemNumber,
            name: skuConfig.name || 'Untitled Item',
            color: colorRow.color,
            size,
            qty,
            decorationType: skuConfig.decorationType,
            decorationPlacements: skuConfig.decorationPlacements,
            decorationDescription: skuConfig.decorationDescription || undefined,
            cost: skuConfig.cost,
            price: unitPrice,
            ordered: false,
            received: false,
            decorated: false,
            packed: false,
            screenPrintColors: skuConfig.screenPrintColors,
            isPlusSize,
            stitchCountTier: skuConfig.stitchCountTier,
            dtfSize: skuConfig.dtfSize
          };

          newLineItems.push(item);
        }
      });
    });

    if (newLineItems.length > 0) {
      onUpdate({ ...order, lineItems: [...(order.lineItems || []), ...newLineItems] });
    }
    setShowAddItem(false);
  };

  const skuPreview = useMemo(() => {
    let totalQty = 0;
    let totalPrice = 0;

    skuConfig.colorRows.forEach(colorRow => {
      SIZE_OPTIONS.forEach(size => {
        const qty = colorRow.quantities[size];
        if (qty > 0) {
          totalQty += qty;
          const isPlusSize = checkPlusSize(size);
          const itemData = {
            decorationType: skuConfig.decorationType,
            cost: skuConfig.cost,
            decorationPlacements: skuConfig.decorationPlacements,
            screenPrintColors: skuConfig.screenPrintColors,
            isPlusSize,
            stitchCountTier: skuConfig.stitchCountTier,
            dtfSize: skuConfig.dtfSize
          };
          totalPrice += calculatePrice(itemData) * qty;
        }
      });
    });

    return { totalQty, totalPrice };
  }, [skuConfig]);

  const removeItem = (id: string) => {
    onUpdate({ ...order, lineItems: order.lineItems?.filter(li => li.id !== id) || [] });
  };

  // Bulk actions
  const markAllOrdered = () => {
    const items = order.lineItems?.map(li => ({ ...li, ordered: true, orderedAt: new Date() })) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const markAllReceived = () => {
    const items = order.lineItems?.map(li => ({ ...li, received: true, receivedAt: new Date() })) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const markAllProductionComplete = () => {
    const items = order.lineItems?.map(li => ({
      ...li,
      decorated: true,
      packed: true,
      decoratedAt: new Date(),
      packedAt: new Date()
    })) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const toggleItemOrdered = (id: string) => {
    const items = order.lineItems?.map(li =>
      li.id === id ? { ...li, ordered: !li.ordered, orderedAt: !li.ordered ? new Date() : undefined } : li
    ) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const toggleItemReceived = (id: string) => {
    const items = order.lineItems?.map(li =>
      li.id === id ? { ...li, received: !li.received, receivedAt: !li.received ? new Date() : undefined } : li
    ) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const toggleItemDecorated = (id: string) => {
    const items = order.lineItems?.map(li =>
      li.id === id ? { ...li, decorated: !li.decorated, decoratedAt: !li.decorated ? new Date() : undefined } : li
    ) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const toggleItemPacked = (id: string) => {
    const item = order.lineItems?.find(li => li.id === id);
    if (item && !item.decorated && !item.packed) return; // Can't pack if not decorated
    const items = order.lineItems?.map(li =>
      li.id === id ? { ...li, packed: !li.packed, packedAt: !li.packed ? new Date() : undefined } : li
    ) || [];
    onUpdate({ ...order, lineItems: items });
  };

  const moveNext = (nextStatus: Order['status'], updates: Partial<Order> = {}) => {
    onUpdate({ ...order, status: nextStatus, updatedAt: new Date(), ...updates });
  };

  // Gatekeepers
  const allOrdered = (order.lineItems?.length || 0) > 0 && order.lineItems?.every(li => li.ordered);
  const allReceived = (order.lineItems?.length || 0) > 0 && order.lineItems?.every(li => li.received);
  const allProductionComplete = (order.lineItems?.length || 0) > 0 && order.lineItems?.every(li => li.decorated && li.packed);
  const fulfillmentReady = order.fulfillment.shippingLabelPrinted || order.fulfillment.customerPickedUp;
  const closeoutComplete = order.closeoutChecklist.filesSaved &&
                          order.closeoutChecklist.canvaArchived &&
                          order.closeoutChecklist.summaryUploaded &&
                          order.closeoutChecklist.invoiceSent;

  const canAddSkuToOrder = skuConfig.itemNumber && skuConfig.name && skuPreview.totalQty > 0;

  // Get decoration type badge color
  const getDecorationBadgeClass = (type: ProductionMethod) => {
    switch (type) {
      case 'ScreenPrint': return 'bg-purple-100 text-purple-700';
      case 'Embroidery': return 'bg-amber-100 text-amber-700';
      case 'DTF': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getDecorationLabel = (type: ProductionMethod) => {
    switch (type) {
      case 'ScreenPrint': return 'Screen Print';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[700px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900">{order.customer}</h2>
            {order.rushOrder && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">RUSH</span>
            )}
            {STAGE_NUMBER[order.status] > 3 && order.artStatus === 'Pending' && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">ART PENDING</span>
            )}
          </div>
          <p className="text-slate-500 font-medium">{order.orderNumber} | {order.projectName}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Stage 0: Lead */}
        {order.status === 'Lead' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Target className="text-emerald-600" size={24} />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Lead Information</h3>
                <p className="text-slate-500 text-sm">Capture initial inquiry details for sales funnel tracking.</p>
              </div>
            </div>

            {/* Lead Temperature Indicator */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
              <ThermometerSun size={32} className={
                order.leadInfo?.temperature === 'Hot' ? 'text-red-500' :
                order.leadInfo?.temperature === 'Warm' ? 'text-amber-500' : 'text-blue-500'
              } />
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">Lead Temperature</p>
                <div className="flex gap-2 mt-1">
                  {(['Hot', 'Warm', 'Cold'] as LeadTemperature[]).map(temp => (
                    <button
                      key={temp}
                      onClick={() => onUpdate({
                        ...order,
                        leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), temperature: temp }
                      })}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        order.leadInfo?.temperature === temp
                          ? temp === 'Hot' ? 'bg-red-500 text-white' :
                            temp === 'Warm' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Source */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-500 font-bold">Lead Source</label>
                <select
                  value={order.leadInfo?.source || 'Website'}
                  onChange={(e) => onUpdate({
                    ...order,
                    leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), source: e.target.value as LeadSource }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Estimated Quantity */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-500 font-bold">Est. Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={order.leadInfo?.estimatedQuantity || 0}
                  onChange={(e) => onUpdate({
                    ...order,
                    leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), estimatedQuantity: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Estimated Value */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-500 font-bold">Est. Value ($)</label>
                <input
                  type="number"
                  min="0"
                  value={order.leadInfo?.estimatedValue || 0}
                  onChange={(e) => onUpdate({
                    ...order,
                    leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), estimatedValue: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Event/Need-by Date */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-500 font-bold">Event/Need-by Date</label>
                <input
                  type="date"
                  value={order.leadInfo?.eventDate || ''}
                  onChange={(e) => onUpdate({
                    ...order,
                    leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), eventDate: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Follow-up Date */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-500 font-bold">Follow-up Date</label>
                <input
                  type="date"
                  value={order.leadInfo?.followUpDate || ''}
                  onChange={(e) => onUpdate({
                    ...order,
                    leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), followUpDate: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Decision Maker */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-500 font-bold">Decision Maker</label>
                <input
                  type="text"
                  placeholder="Who makes the decision?"
                  value={order.leadInfo?.decisionMaker || ''}
                  onChange={(e) => onUpdate({
                    ...order,
                    leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), decisionMaker: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Product Interest */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-bold">Product Interest</label>
              <input
                type="text"
                placeholder="What products are they interested in? (e.g., T-shirts, hoodies, hats)"
                value={order.leadInfo?.productInterest || ''}
                onChange={(e) => onUpdate({
                  ...order,
                  leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), productInterest: e.target.value }
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Decoration Interest */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-bold">Decoration Method Interest</label>
              <div className="flex gap-2">
                {(['ScreenPrint', 'Embroidery', 'DTF', 'Other', null] as (ProductionMethod | null)[]).map(method => (
                  <button
                    key={method || 'unknown'}
                    onClick={() => onUpdate({
                      ...order,
                      leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), decorationInterest: method }
                    })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      order.leadInfo?.decorationInterest === method
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {method === 'ScreenPrint' ? 'Screen Print' : method === null ? 'Unknown' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-bold">Budget Range</label>
              <input
                type="text"
                placeholder="e.g., $500 - $1,000"
                value={order.leadInfo?.budget || ''}
                onChange={(e) => onUpdate({
                  ...order,
                  leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), budget: e.target.value }
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Competitor Quoted */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="competitorQuoted"
                checked={order.leadInfo?.competitorQuoted || false}
                onChange={(e) => onUpdate({
                  ...order,
                  leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), competitorQuoted: e.target.checked }
                })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="competitorQuoted" className="text-sm text-slate-700">Competitor has also quoted this customer</label>
            </div>

            {/* Contact Notes */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-bold">Contact Notes</label>
              <textarea
                placeholder="Notes from conversations, special requirements, concerns..."
                rows={4}
                value={order.leadInfo?.contactNotes || ''}
                onChange={(e) => onUpdate({
                  ...order,
                  leadInfo: { ...(order.leadInfo || DEFAULT_LEAD_INFO), contactNotes: e.target.value }
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Lead Summary Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-emerald-800 mb-3">Lead Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-emerald-700">{order.leadInfo?.estimatedQuantity || 0}</p>
                  <p className="text-xs text-emerald-600">Est. Units</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-700">${(order.leadInfo?.estimatedValue || 0).toLocaleString()}</p>
                  <p className="text-xs text-emerald-600">Est. Value</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-700">
                    {order.leadInfo?.contactedAt ? Math.floor((Date.now() - new Date(order.leadInfo.contactedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </p>
                  <p className="text-xs text-emerald-600">Days in Pipeline</p>
                </div>
              </div>
            </div>

            {/* Convert to Quote Action */}
            <button
              onClick={() => moveNext('Quote', {
                dueDate: order.leadInfo?.eventDate || ''
              })}
              className="w-full py-4 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Convert to Quote →
            </button>
            <p className="text-xs text-slate-400 text-center">
              Lead info will be preserved and available throughout the order process
            </p>
          </div>
        )}

        {/* Stage 1: Quote */}
        {order.status === 'Quote' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Quote Builder</h3>
                <p className="text-slate-500 text-sm">Add line items with complete product and decoration details.</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[650px]">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="px-3 py-3">Item #</th>
                      <th className="px-3 py-3">Description</th>
                      <th className="px-3 py-3">Color</th>
                      <th className="px-3 py-3">Size</th>
                      <th className="px-3 py-3 text-center">Qty</th>
                      <th className="px-3 py-3">Decoration</th>
                      <th className="px-3 py-3 text-right">Price</th>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.lineItems?.map(item => (
                      <tr key={item.id} className="text-sm hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">{item.itemNumber || '-'}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{item.name}</td>
                        <td className="px-3 py-3 text-slate-600">{item.color || '-'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            checkPlusSize(item.size) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.size || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900">{item.qty}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold w-fit ${getDecorationBadgeClass(item.decorationType)}`}>
                              {getDecorationLabel(item.decorationType)}
                            </span>
                            <span className="text-xs text-slate-400">{item.decorationPlacements} placement(s)</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">${item.price.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900">
                          ${(item.price * item.qty).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!order.lineItems || order.lineItems.length === 0) && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                          No items added yet. Click below to add your first item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(order.lineItems?.length || 0) > 0 && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-500 uppercase">Grand Total</span>
                    <span className="text-xs text-slate-400 ml-2">({order.lineItems?.length} items)</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">${grandTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <button
              onClick={openAddItemModal}
              className="w-full border-2 border-dashed border-slate-300 text-slate-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Plus size={20} /> Add Line Item
            </button>

            <button
              disabled={(order.lineItems?.length || 0) === 0}
              onClick={() => moveNext('Approval')}
              className="w-full bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"
            >
              Submit Quote for Approval
            </button>
          </div>
        )}

        {/* Stage 2: Approval */}
        {order.status === 'Approval' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
              <h3 className="text-blue-900 font-bold text-lg mb-2">Quote Pending Approval</h3>
              <p className="text-blue-700 mb-2">Grand Total: <span className="font-bold">${grandTotal.toFixed(2)}</span></p>
              <p className="text-blue-600 text-sm mb-6">{order.lineItems?.length || 0} line items</p>
              <button
                onClick={() => moveNext('Art Confirmation')}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
              >
                Quote Approved - Continue
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: Art Confirmation */}
        {order.status === 'Art Confirmation' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">Art Status</p>
                <p className={`text-xl font-black ${order.artStatus === 'Approved' ? 'text-green-600' : 'text-orange-500'}`}>
                  {order.artStatus}
                </p>
              </div>
              {order.artStatus === 'Pending' ? <AlertCircle className="text-orange-500" size={32} /> : <Check className="text-green-600" size={32} />}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => moveNext('Inventory Order', { artStatus: 'Approved' })}
                className="bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
              >
                <Check size={20} /> Art Approved
              </button>
              <button
                onClick={() => moveNext('Inventory Order')}
                className="bg-orange-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <AlertCircle size={20} /> Advance to Purchasing (Art Pending)
              </button>
            </div>
          </div>
        )}

        {/* Stage 4: Inventory Order */}
        {order.status === 'Inventory Order' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart size={20} className="text-slate-400" />
                Purchasing Checklist
              </h3>
              <button onClick={markAllOrdered} className="text-blue-600 text-sm font-bold hover:underline">
                Mark All as Ordered
              </button>
            </div>

            <div className="space-y-2">
              {order.lineItems?.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleItemOrdered(item.id)}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.itemNumber} - {item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.color} | {item.size} | Qty: {item.qty} | {getDecorationLabel(item.decorationType)}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    item.ordered ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                  }`}>
                    {item.ordered && <Check size={14} strokeWidth={4} />}
                  </div>
                </div>
              ))}
            </div>

            <button
              disabled={!allOrdered}
              onClick={() => moveNext('Production Prep')}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                allOrdered ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Move to Prep
            </button>
          </div>
        )}

        {/* Stage 5: Production Prep */}
        {order.status === 'Production Prep' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="text-blue-600" size={24} />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Production Prep</h3>
                <p className="text-slate-500 text-sm">Complete all preparation tasks before production begins.</p>
              </div>
            </div>

            <div className="space-y-3">
              {requiredPrepTasks.needsGangSheet && (
                <div
                  onClick={() => onUpdate({
                    ...order,
                    prepStatus: { ...order.prepStatus, gangSheetCreated: !order.prepStatus.gangSheetCreated }
                  })}
                  className="flex items-center justify-between p-4 bg-cyan-50 rounded-xl border border-cyan-100 cursor-pointer hover:bg-cyan-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Printer size={20} className="text-cyan-600" />
                    <div>
                      <p className="font-bold text-slate-900">Gang Sheet Created</p>
                      <p className="text-xs text-slate-500">Required for DTF items</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    order.prepStatus.gangSheetCreated ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                  }`}>
                    {order.prepStatus.gangSheetCreated && <Check size={14} strokeWidth={4} />}
                  </div>
                </div>
              )}

              {requiredPrepTasks.needsDigitizing && (
                <div
                  onClick={() => onUpdate({
                    ...order,
                    prepStatus: { ...order.prepStatus, artworkDigitized: !order.prepStatus.artworkDigitized }
                  })}
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Layers size={20} className="text-amber-600" />
                    <div>
                      <p className="font-bold text-slate-900">Artwork Digitized</p>
                      <p className="text-xs text-slate-500">Required for Embroidery items</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    order.prepStatus.artworkDigitized ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                  }`}>
                    {order.prepStatus.artworkDigitized && <Check size={14} strokeWidth={4} />}
                  </div>
                </div>
              )}

              {requiredPrepTasks.needsScreens && (
                <div
                  onClick={() => onUpdate({
                    ...order,
                    prepStatus: { ...order.prepStatus, screensBurned: !order.prepStatus.screensBurned }
                  })}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-purple-600" />
                    <div>
                      <p className="font-bold text-slate-900">Screens Burned</p>
                      <p className="text-xs text-slate-500">Required for Screen Print items</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    order.prepStatus.screensBurned ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                  }`}>
                    {order.prepStatus.screensBurned && <Check size={14} strokeWidth={4} />}
                  </div>
                </div>
              )}

              {!requiredPrepTasks.needsGangSheet && !requiredPrepTasks.needsDigitizing && !requiredPrepTasks.needsScreens && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-slate-500">
                  No preparation tasks required for this order.
                </div>
              )}
            </div>

            <button
              disabled={!allPrepComplete}
              onClick={() => moveNext('Inventory Received')}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                allPrepComplete ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Prep Complete
            </button>
          </div>
        )}

        {/* Stage 6: Inventory Received */}
        {order.status === 'Inventory Received' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Package size={20} className="text-slate-400" />
                Receiving Checklist
              </h3>
              <button onClick={markAllReceived} className="text-blue-600 text-sm font-bold hover:underline">
                Mark All Received
              </button>
            </div>

            <div className="space-y-2">
              {order.lineItems?.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleItemReceived(item.id)}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.itemNumber} - {item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.color} | {item.size} | Qty: {item.qty}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    item.received ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                  }`}>
                    {item.received && <Check size={14} strokeWidth={4} />}
                  </div>
                </div>
              ))}
            </div>

            <button
              disabled={!allReceived}
              onClick={() => moveNext('Production')}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                allReceived ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Goods Verified - Start Production
            </button>
          </div>
        )}

        {/* Stage 7: Production (Run Sheet) */}
        {order.status === 'Production' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck size={20} className="text-slate-400" />
                Run Sheet
              </h3>
              <button onClick={markAllProductionComplete} className="text-blue-600 text-sm font-bold hover:underline">
                Mark All Complete
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-center">Decorated</th>
                    <th className="px-4 py-3 text-center">Packed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.lineItems?.map(item => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{item.itemNumber}</p>
                        <p className="text-xs text-slate-500">{item.color} | {item.size}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{item.qty}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleItemDecorated(item.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors mx-auto ${
                            item.decorated ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400'
                          }`}
                        >
                          {item.decorated && <Check size={16} strokeWidth={4} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleItemPacked(item.id)}
                          disabled={!item.decorated}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors mx-auto ${
                            item.packed ? 'bg-green-500 border-green-500 text-white' :
                            item.decorated ? 'border-slate-300 hover:border-green-400' : 'border-slate-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {item.packed && <Check size={16} strokeWidth={4} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-sm text-slate-500 text-center">
              {order.lineItems?.filter(li => li.decorated).length || 0} of {order.lineItems?.length || 0} decorated | {' '}
              {order.lineItems?.filter(li => li.packed).length || 0} of {order.lineItems?.length || 0} packed
            </div>

            <button
              disabled={!allProductionComplete}
              onClick={() => moveNext('Fulfillment')}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                allProductionComplete ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Job Complete
            </button>
          </div>
        )}

        {/* Stage 8: Fulfillment */}
        {order.status === 'Fulfillment' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Truck className="text-blue-600" size={24} />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Fulfillment</h3>
                <p className="text-slate-500 text-sm">Complete shipping or customer pickup.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => onUpdate({
                  ...order,
                  fulfillment: {
                    ...order.fulfillment,
                    shippingLabelPrinted: !order.fulfillment.shippingLabelPrinted,
                    method: !order.fulfillment.shippingLabelPrinted ? 'Shipped' : order.fulfillment.method
                  }
                })}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Printer size={20} className="text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-900">Shipping Label Printed</p>
                    <p className="text-xs text-slate-500">Order will be shipped to customer</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  order.fulfillment.shippingLabelPrinted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                }`}>
                  {order.fulfillment.shippingLabelPrinted && <Check size={14} strokeWidth={4} />}
                </div>
              </div>

              <div className="text-center text-slate-400 text-sm">- OR -</div>

              <div
                onClick={() => onUpdate({
                  ...order,
                  fulfillment: {
                    ...order.fulfillment,
                    customerPickedUp: !order.fulfillment.customerPickedUp,
                    method: !order.fulfillment.customerPickedUp ? 'PickedUp' : order.fulfillment.method
                  }
                })}
                className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-green-600" />
                  <div>
                    <p className="font-bold text-slate-900">Customer Picked Up</p>
                    <p className="text-xs text-slate-500">Customer collected order in person</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  order.fulfillment.customerPickedUp ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                }`}>
                  {order.fulfillment.customerPickedUp && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
            </div>

            <button
              disabled={!fulfillmentReady}
              onClick={() => moveNext('Invoice', { fulfillment: { ...order.fulfillment, fulfilledAt: new Date() } })}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                fulfillmentReady ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Order Fulfilled
            </button>
          </div>
        )}

        {/* Stage 9: Invoice & Closeout */}
        {order.status === 'Invoice' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Archive className="text-blue-600" size={24} />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Job Closeout</h3>
                <p className="text-slate-500 text-sm">Complete all administrative tasks to archive this order.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => onUpdate({
                  ...order,
                  closeoutChecklist: { ...order.closeoutChecklist, filesSaved: !order.closeoutChecklist.filesSaved }
                })}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <p className="font-bold text-slate-900">Files Saved to Customer Folder</p>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  order.closeoutChecklist.filesSaved ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                }`}>
                  {order.closeoutChecklist.filesSaved && <Check size={14} strokeWidth={4} />}
                </div>
              </div>

              <div
                onClick={() => onUpdate({
                  ...order,
                  closeoutChecklist: { ...order.closeoutChecklist, canvaArchived: !order.closeoutChecklist.canvaArchived }
                })}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <p className="font-bold text-slate-900">Canva Proof Archived</p>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  order.closeoutChecklist.canvaArchived ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                }`}>
                  {order.closeoutChecklist.canvaArchived && <Check size={14} strokeWidth={4} />}
                </div>
              </div>

              <div
                onClick={() => onUpdate({
                  ...order,
                  closeoutChecklist: { ...order.closeoutChecklist, summaryUploaded: !order.closeoutChecklist.summaryUploaded }
                })}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <p className="font-bold text-slate-900">Order Summary Uploaded</p>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  order.closeoutChecklist.summaryUploaded ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                }`}>
                  {order.closeoutChecklist.summaryUploaded && <Check size={14} strokeWidth={4} />}
                </div>
              </div>

              <div
                onClick={() => onUpdate({
                  ...order,
                  closeoutChecklist: { ...order.closeoutChecklist, invoiceSent: !order.closeoutChecklist.invoiceSent }
                })}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <p className="font-bold text-slate-900">Invoice Created & Sent</p>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  order.closeoutChecklist.invoiceSent ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                }`}>
                  {order.closeoutChecklist.invoiceSent && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
            </div>

            <button
              disabled={!closeoutComplete}
              onClick={() => onUpdate({ ...order, isArchived: true, archivedAt: new Date() })}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                closeoutComplete ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Close & Archive Order
            </button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="absolute inset-0 bg-white z-[60] flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold">Add Item to Quote</h3>
            <button
              onClick={() => setShowAddItem(false)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase">
                  <Package size={16} />
                  Product & Decoration Setup
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Item Number / SKU *
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. NL6210"
                      value={skuConfig.itemNumber}
                      onChange={e => setSkuConfig({...skuConfig, itemNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Garment Name *
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Next Level 6210 Tee"
                      value={skuConfig.name}
                      onChange={e => setSkuConfig({...skuConfig, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Wholesale Cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border border-slate-200 p-3 pl-7 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                        value={skuConfig.cost || ''}
                        onChange={e => setSkuConfig({...skuConfig, cost: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Decoration Type
                    </label>
                    <select
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={skuConfig.decorationType}
                      onChange={e => setSkuConfig({...skuConfig, decorationType: e.target.value as ProductionMethod})}
                    >
                      {DECORATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Placements
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={skuConfig.decorationPlacements}
                      onChange={e => setSkuConfig({...skuConfig, decorationPlacements: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>

                {skuConfig.decorationType === 'ScreenPrint' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        Number of Ink Colors
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={skuConfig.screenPrintColors}
                        onChange={e => setSkuConfig({...skuConfig, screenPrintColors: parseInt(e.target.value) || 1})}
                      />
                      <p className="text-xs text-slate-400 mt-1">+$1.00 per color | +$2.00 per placement | +$2.00 for 2XL+</p>
                    </div>
                  </div>
                )}

                {skuConfig.decorationType === 'DTF' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Transfer Size
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSkuConfig({...skuConfig, dtfSize: 'Standard'})}
                        className={`p-3 rounded-xl border-2 font-medium transition-all ${
                          skuConfig.dtfSize === 'Standard'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Standard (+$5.00)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkuConfig({...skuConfig, dtfSize: 'Large'})}
                        className={`p-3 rounded-xl border-2 font-medium transition-all ${
                          skuConfig.dtfSize === 'Large'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Large (+$8.00)
                      </button>
                    </div>
                  </div>
                )}

                {skuConfig.decorationType === 'Embroidery' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Stitch Count
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['<8k', '8k-12k', '12k+'] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSkuConfig({...skuConfig, stitchCountTier: tier})}
                          className={`p-3 rounded-xl border-2 font-medium transition-all text-center ${
                            skuConfig.stitchCountTier === tier
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold">{tier}</div>
                          <div className="text-xs opacity-70">
                            +${tier === '<8k' ? '0' : tier === '8k-12k' ? '10' : '20'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {skuConfig.decorationType === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Description of Decoration
                    </label>
                    <textarea
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={2}
                      placeholder="Describe the decoration method..."
                      value={skuConfig.decorationDescription}
                      onChange={e => setSkuConfig({...skuConfig, decorationDescription: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm uppercase">
                    <Palette size={16} />
                    Colors & Quantities
                  </div>
                  <button
                    type="button"
                    onClick={addColorRow}
                    className="flex items-center gap-1 text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors"
                  >
                    <Plus size={16} /> Add Color
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase">
                        <th className="text-left py-2 px-2 w-32">Color</th>
                        {SIZE_OPTIONS.map(size => (
                          <th key={size} className={`text-center py-2 px-1 min-w-[50px] ${
                            checkPlusSize(size) ? 'text-orange-600' : ''
                          }`}>
                            {size}
                            {checkPlusSize(size) && <span className="block text-[10px]">+$2</span>}
                          </th>
                        ))}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {skuConfig.colorRows.map((row) => (
                        <tr key={row.id}>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="e.g. Navy"
                              value={row.color}
                              onChange={e => updateColorName(row.id, e.target.value)}
                            />
                          </td>
                          {SIZE_OPTIONS.map(size => (
                            <td key={size} className="py-2 px-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full border border-slate-200 p-2 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                value={row.quantities[size] || ''}
                                placeholder="0"
                                onChange={e => updateQuantity(row.id, size, parseInt(e.target.value) || 0)}
                              />
                            </td>
                          ))}
                          <td className="py-2 px-1">
                            {skuConfig.colorRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeColorRow(row.id)}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-green-700">Order Preview</span>
                    <p className="text-xs text-green-600">{skuPreview.totalQty} items across all colors/sizes</p>
                  </div>
                  <span className="text-2xl font-black text-green-700">${skuPreview.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white space-y-3">
            <button
              onClick={handleAddSkuToOrder}
              disabled={!canAddSkuToOrder}
              className="w-full bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
            >
              Add to Order
            </button>
            <button
              onClick={() => {
                handleAddSkuToOrder();
                setSkuConfig(createEmptySkuConfig());
                setShowAddItem(true);
              }}
              disabled={!canAddSkuToOrder}
              className="w-full bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Add to Order & Add Another SKU
            </button>
            <p className="text-xs text-slate-400 text-center">SKU, Name, and at least one quantity are required</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSlideOver;
