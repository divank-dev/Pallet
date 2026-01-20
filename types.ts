// 10-Stage Workflow Status (Lead + 9 Production Stages)
export type OrderStatus =
  | 'Lead'               // Stage 0 - Initial inquiry / sales funnel
  | 'Quote'              // Stage 1
  | 'Approval'           // Stage 2
  | 'Art Confirmation'   // Stage 3
  | 'Inventory Order'    // Stage 4
  | 'Production Prep'    // Stage 5
  | 'Inventory Received' // Stage 6
  | 'Production'         // Stage 7
  | 'Fulfillment'        // Stage 8
  | 'Invoice';           // Stage 9

// Lead source tracking
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Trade Show' | 'Email Campaign' | 'Other';

// Lead interest/temperature level
export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

// Lead-specific information for sales funnel
export interface LeadInfo {
  source: LeadSource;
  temperature: LeadTemperature;
  estimatedQuantity: number;
  estimatedValue: number;
  productInterest: string;           // What products they're interested in
  decorationInterest: ProductionMethod | null;
  eventDate?: string;                // Target event/need-by date
  followUpDate?: string;             // When to follow up
  contactedAt: Date;                 // When lead was first captured
  lastContactAt?: Date;              // Most recent contact
  contactNotes?: string;             // Notes from conversations
  competitorQuoted?: boolean;        // Are they shopping around?
  decisionMaker?: string;            // Who makes the purchasing decision
  budget?: string;                   // Budget range if known
}

export type ProductionMethod = 'ScreenPrint' | 'Embroidery' | 'DTF' | 'Other';

export type ArtStatus = 'Pending' | 'Approved';

export type FulfillmentMethod = 'Shipped' | 'PickedUp' | null;

export interface LineItem {
  id: string;

  // Product Identification
  itemNumber: string;
  name: string;

  // Garment Details
  color: string;
  size: string;
  qty: number;

  // Decoration Details
  decorationType: ProductionMethod;
  decorationPlacements: number;
  decorationDescription?: string;

  // Pricing
  cost: number;
  price: number;

  // Stage-specific tracking flags
  ordered: boolean;              // Stage 4: Inventory Order
  received: boolean;             // Stage 6: Inventory Received
  decorated: boolean;            // Stage 7: Production - decoration complete
  packed: boolean;               // Stage 7: Production - packing complete

  // Timestamps for tracking
  orderedAt?: Date;
  receivedAt?: Date;
  decoratedAt?: Date;
  packedAt?: Date;

  // Method-specific pricing fields
  screenPrintColors?: number;
  isPlusSize?: boolean;
  stitchCountTier?: '<8k' | '8k-12k' | '12k+';
  dtfSize?: 'Standard' | 'Large';
}

// Stage 5: Production Prep status
export interface PrepStatus {
  gangSheetCreated: boolean | null;    // Required if DTF present
  artworkDigitized: boolean | null;    // Required if Embroidery present
  screensBurned: boolean | null;       // Required if ScreenPrint present
}

// Stage 9: Closeout checklist
export interface CloseoutChecklist {
  filesSaved: boolean;
  canvaArchived: boolean;
  summaryUploaded: boolean;
  invoiceSent: boolean;
}

// Stage 8: Fulfillment status
export interface FulfillmentStatus {
  method: FulfillmentMethod;
  shippingLabelPrinted: boolean;
  customerPickedUp: boolean;
  trackingNumber?: string;
  fulfilledAt?: Date;
}

// Audit trail entry
export interface StatusChangeLog {
  timestamp: Date;
  userId?: string;
  action: string;
  previousValue: any;
  newValue: any;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;           // Human-readable (e.g., "TBD-2024-0001")

  // Customer Info
  customer: string;
  customerEmail?: string;
  customerPhone?: string;

  projectName: string;
  status: OrderStatus;
  artStatus: ArtStatus;

  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  dueDate: string;

  // Flags
  rushOrder: boolean;
  notes?: string;

  // Line items
  lineItems: LineItem[];

  // Lead-specific data (populated when status is 'Lead')
  leadInfo?: LeadInfo;

  // Stage-specific data
  prepStatus: PrepStatus;
  fulfillment: FulfillmentStatus;
  closeoutChecklist: CloseoutChecklist;

  // Audit trail
  history: StatusChangeLog[];

  // Concurrency control
  version: number;
  archivedAt?: Date;
  isArchived: boolean;
}

export type ViewMode = 'Sales' | 'Production';

// Stage number mapping for validation
export const STAGE_NUMBER: Record<OrderStatus, number> = {
  'Lead': 0,
  'Quote': 1,
  'Approval': 2,
  'Art Confirmation': 3,
  'Inventory Order': 4,
  'Production Prep': 5,
  'Inventory Received': 6,
  'Production': 7,
  'Fulfillment': 8,
  'Invoice': 9
};

// Allowed transitions
export const ALLOWED_TRANSITIONS: Record<number, number[]> = {
  0: [1],    // Lead → Quote only
  1: [2],    // Quote → Approval only
  2: [3],    // Approval → Art Confirmation only
  3: [4],    // Art Confirmation → Inventory Order only
  4: [5],    // Inventory Order → Production Prep only
  5: [6],    // Production Prep → Inventory Received only
  6: [7],    // Inventory Received → Production only
  7: [8],    // Production → Fulfillment only
  8: [9],    // Fulfillment → Invoice only
  9: []      // Terminal state
};

// ============================================
// DATABASE SCHEMA DEFINITION
// ============================================

// Customer Entity - extracted from orders for CRM functionality
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
  tags?: string[];
  totalOrders: number;
  totalRevenue: number;
  lastOrderAt?: Date;
}

// Product Catalog Entry
export interface Product {
  id: string;
  itemNumber: string;           // SKU
  name: string;
  description?: string;
  category?: string;
  baseCost: number;
  basePrice: number;
  availableSizes: string[];
  availableColors: string[];
  supplier?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Database Metadata
export interface DatabaseMetadata {
  version: string;
  schemaVersion: string;
  createdAt: Date;
  lastModifiedAt: Date;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalLineItems: number;
}

// Complete Database Schema
export interface DatabaseSchema {
  metadata: DatabaseMetadata;
  orders: Order[];
  customers: Customer[];
  products: Product[];
}

// Schema Definition for Documentation
export const SCHEMA_DEFINITION = {
  version: '2.0.0',
  entities: {
    Order: {
      description: 'Primary order/job tracking entity',
      fields: {
        id: { type: 'string', required: true, description: 'Unique identifier' },
        orderNumber: { type: 'string', required: true, description: 'Human-readable order number (e.g., TBD-2024-0001)' },
        customer: { type: 'string', required: true, description: 'Customer/business name' },
        customerEmail: { type: 'string', required: false, description: 'Customer email address' },
        customerPhone: { type: 'string', required: false, description: 'Customer phone number' },
        projectName: { type: 'string', required: true, description: 'Project or job name' },
        status: { type: 'OrderStatus', required: true, description: 'Current workflow stage (Lead through Invoice)' },
        artStatus: { type: 'ArtStatus', required: true, description: 'Artwork approval status' },
        createdAt: { type: 'Date', required: true, description: 'Order creation timestamp' },
        updatedAt: { type: 'Date', required: false, description: 'Last modification timestamp' },
        dueDate: { type: 'string', required: true, description: 'Target completion date' },
        rushOrder: { type: 'boolean', required: true, description: 'Rush order flag' },
        notes: { type: 'string', required: false, description: 'Order notes' },
        lineItems: { type: 'LineItem[]', required: true, description: 'Array of line items' },
        leadInfo: { type: 'LeadInfo', required: false, description: 'Lead-specific data (when status is Lead)' },
        prepStatus: { type: 'PrepStatus', required: true, description: 'Production prep checklist status' },
        fulfillment: { type: 'FulfillmentStatus', required: true, description: 'Fulfillment/shipping status' },
        closeoutChecklist: { type: 'CloseoutChecklist', required: true, description: 'Invoice stage checklist' },
        history: { type: 'StatusChangeLog[]', required: true, description: 'Audit trail of changes' },
        version: { type: 'number', required: true, description: 'Optimistic concurrency version' },
        isArchived: { type: 'boolean', required: true, description: 'Soft delete flag' },
        archivedAt: { type: 'Date', required: false, description: 'Archive timestamp' }
      },
      relationships: {
        lineItems: { type: 'one-to-many', target: 'LineItem', description: 'Order contains multiple line items' },
        leadInfo: { type: 'one-to-one', target: 'LeadInfo', description: 'Optional lead information' },
        history: { type: 'one-to-many', target: 'StatusChangeLog', description: 'Audit trail entries' }
      }
    },
    LineItem: {
      description: 'Individual product line within an order',
      fields: {
        id: { type: 'string', required: true, description: 'Unique identifier' },
        itemNumber: { type: 'string', required: true, description: 'Product SKU' },
        name: { type: 'string', required: true, description: 'Product name' },
        color: { type: 'string', required: true, description: 'Product color' },
        size: { type: 'string', required: true, description: 'Product size' },
        qty: { type: 'number', required: true, description: 'Quantity ordered' },
        decorationType: { type: 'ProductionMethod', required: true, description: 'Decoration method' },
        decorationPlacements: { type: 'number', required: true, description: 'Number of print/embroidery locations' },
        decorationDescription: { type: 'string', required: false, description: 'Decoration details' },
        cost: { type: 'number', required: true, description: 'Unit cost (wholesale)' },
        price: { type: 'number', required: true, description: 'Unit price (selling)' },
        ordered: { type: 'boolean', required: true, description: 'Inventory ordered flag' },
        received: { type: 'boolean', required: true, description: 'Inventory received flag' },
        decorated: { type: 'boolean', required: true, description: 'Decoration complete flag' },
        packed: { type: 'boolean', required: true, description: 'Packing complete flag' },
        orderedAt: { type: 'Date', required: false, description: 'Inventory order timestamp' },
        receivedAt: { type: 'Date', required: false, description: 'Inventory receipt timestamp' },
        decoratedAt: { type: 'Date', required: false, description: 'Decoration completion timestamp' },
        packedAt: { type: 'Date', required: false, description: 'Packing completion timestamp' },
        screenPrintColors: { type: 'number', required: false, description: 'Number of ink colors (screen print)' },
        isPlusSize: { type: 'boolean', required: false, description: 'Plus size surcharge flag' },
        stitchCountTier: { type: 'string', required: false, description: 'Embroidery stitch count tier' },
        dtfSize: { type: 'string', required: false, description: 'DTF transfer size' }
      }
    },
    LeadInfo: {
      description: 'Sales lead tracking information',
      fields: {
        source: { type: 'LeadSource', required: true, description: 'How the lead was acquired' },
        temperature: { type: 'LeadTemperature', required: true, description: 'Lead qualification level' },
        estimatedQuantity: { type: 'number', required: true, description: 'Estimated unit quantity' },
        estimatedValue: { type: 'number', required: true, description: 'Estimated order value' },
        productInterest: { type: 'string', required: true, description: 'Products of interest' },
        decorationInterest: { type: 'ProductionMethod', required: false, description: 'Decoration method interest' },
        eventDate: { type: 'string', required: false, description: 'Target event date' },
        followUpDate: { type: 'string', required: false, description: 'Next follow-up date' },
        contactedAt: { type: 'Date', required: true, description: 'Initial contact timestamp' },
        lastContactAt: { type: 'Date', required: false, description: 'Most recent contact' },
        contactNotes: { type: 'string', required: false, description: 'Contact notes' },
        competitorQuoted: { type: 'boolean', required: false, description: 'Competitor involvement flag' },
        decisionMaker: { type: 'string', required: false, description: 'Decision maker name' },
        budget: { type: 'string', required: false, description: 'Budget range' }
      }
    },
    PrepStatus: {
      description: 'Production preparation checklist',
      fields: {
        gangSheetCreated: { type: 'boolean|null', required: true, description: 'DTF gang sheet created' },
        artworkDigitized: { type: 'boolean|null', required: true, description: 'Embroidery artwork digitized' },
        screensBurned: { type: 'boolean|null', required: true, description: 'Screen print screens burned' }
      }
    },
    FulfillmentStatus: {
      description: 'Order fulfillment tracking',
      fields: {
        method: { type: 'FulfillmentMethod', required: true, description: 'Shipped or PickedUp' },
        shippingLabelPrinted: { type: 'boolean', required: true, description: 'Shipping label printed' },
        customerPickedUp: { type: 'boolean', required: true, description: 'Customer pickup confirmed' },
        trackingNumber: { type: 'string', required: false, description: 'Shipping tracking number' },
        fulfilledAt: { type: 'Date', required: false, description: 'Fulfillment timestamp' }
      }
    },
    CloseoutChecklist: {
      description: 'Invoice stage closeout checklist',
      fields: {
        filesSaved: { type: 'boolean', required: true, description: 'Project files saved' },
        canvaArchived: { type: 'boolean', required: true, description: 'Canva proof archived' },
        summaryUploaded: { type: 'boolean', required: true, description: 'Order summary uploaded' },
        invoiceSent: { type: 'boolean', required: true, description: 'Invoice sent to customer' }
      }
    },
    StatusChangeLog: {
      description: 'Audit trail entry for order changes',
      fields: {
        timestamp: { type: 'Date', required: true, description: 'Change timestamp' },
        userId: { type: 'string', required: false, description: 'User who made the change' },
        action: { type: 'string', required: true, description: 'Action description' },
        previousValue: { type: 'any', required: true, description: 'Value before change' },
        newValue: { type: 'any', required: true, description: 'Value after change' },
        notes: { type: 'string', required: false, description: 'Change notes' }
      }
    }
  },
  enums: {
    OrderStatus: ['Lead', 'Quote', 'Approval', 'Art Confirmation', 'Inventory Order', 'Production Prep', 'Inventory Received', 'Production', 'Fulfillment', 'Invoice'],
    ProductionMethod: ['ScreenPrint', 'Embroidery', 'DTF', 'Other'],
    ArtStatus: ['Pending', 'Approved'],
    FulfillmentMethod: ['Shipped', 'PickedUp', null],
    LeadSource: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Trade Show', 'Email Campaign', 'Other'],
    LeadTemperature: ['Hot', 'Warm', 'Cold'],
    StitchCountTier: ['<8k', '8k-12k', '12k+'],
    DTFSize: ['Standard', 'Large']
  },
  workflow: {
    stages: [
      { number: 0, name: 'Lead', description: 'Initial sales inquiry', gateCondition: 'Customer info captured' },
      { number: 1, name: 'Quote', description: 'Building quote with line items', gateCondition: 'Line items added with pricing' },
      { number: 2, name: 'Approval', description: 'Quote sent for customer approval', gateCondition: 'Customer approves quote' },
      { number: 3, name: 'Art Confirmation', description: 'Artwork proof approval', gateCondition: 'Art status = Approved' },
      { number: 4, name: 'Inventory Order', description: 'Ordering blank goods', gateCondition: 'All line items marked as ordered' },
      { number: 5, name: 'Production Prep', description: 'Preparing for production', gateCondition: 'All required prep tasks complete' },
      { number: 6, name: 'Inventory Received', description: 'Receiving blank goods', gateCondition: 'All line items marked as received' },
      { number: 7, name: 'Production', description: 'Decoration and packing', gateCondition: 'All items decorated and packed' },
      { number: 8, name: 'Fulfillment', description: 'Shipping or pickup', gateCondition: 'Shipping label printed or customer picked up' },
      { number: 9, name: 'Invoice', description: 'Final closeout', gateCondition: 'All closeout checklist items complete' }
    ]
  }
};
