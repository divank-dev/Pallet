import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, User, Building2, X } from 'lucide-react';
import { Order } from '../types';

interface CustomerSearchProps {
  orders: Order[];
  onSelectCustomer: (customerName: string) => void;
  placeholder?: string;
}

interface CustomerInfo {
  name: string;
  email?: string;
  hasActiveOrders: boolean;
  activeOrderCount: number;
  totalOrderCount: number;
  latestStatus?: string;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  orders,
  onSelectCustomer,
  placeholder = "Search customers..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build customer list with active status
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerInfo>();

    orders.forEach(order => {
      const existing = customerMap.get(order.customer);
      const isActive = !order.isArchived;

      if (existing) {
        existing.totalOrderCount++;
        if (isActive) {
          existing.hasActiveOrders = true;
          existing.activeOrderCount++;
          // Update latest status if this order is more recent
          existing.latestStatus = order.status;
        }
        // Keep the email if we have one
        if (!existing.email && order.customerEmail) {
          existing.email = order.customerEmail;
        }
      } else {
        customerMap.set(order.customer, {
          name: order.customer,
          email: order.customerEmail,
          hasActiveOrders: isActive,
          activeOrderCount: isActive ? 1 : 0,
          totalOrderCount: 1,
          latestStatus: isActive ? order.status : undefined
        });
      }
    });

    // Sort: active customers first, then alphabetically
    return Array.from(customerMap.values()).sort((a, b) => {
      if (a.hasActiveOrders && !b.hasActiveOrders) return -1;
      if (!a.hasActiveOrders && b.hasActiveOrders) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [orders]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCustomers.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCustomers[highlightedIndex]) {
          handleSelect(filteredCustomers[highlightedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (customerName: string) => {
    onSelectCustomer(customerName);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSelectCustomer('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50"
        >
          {filteredCustomers.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-400">
              <Building2 size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No customers found</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {searchTerm ? `${filteredCustomers.length} results` : 'All Customers'}
              </div>
              {filteredCustomers.map((customer, index) => (
                <button
                  key={customer.name}
                  onClick={() => handleSelect(customer.name)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 transition-colors ${
                    index === highlightedIndex
                      ? 'bg-blue-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    customer.hasActiveOrders
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      customer.hasActiveOrders
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}>
                      {customer.name}
                    </p>
                    {customer.email && (
                      <p className="text-xs text-slate-400 truncate">
                        {customer.email}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {customer.hasActiveOrders ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                        {customer.activeOrderCount} active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-400">
                        No active
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Stats Footer */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
            <span>{customers.filter(c => c.hasActiveOrders).length} active customers</span>
            <span>{customers.length} total</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
