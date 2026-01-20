/**
 * Pallet Application - Test Utilities
 *
 * Validation functions to ensure data integrity during updates
 */

import {
  Order,
  OrderStatus,
  LineItem,
  ProductionMethod,
  ArtStatus,
  LeadInfo,
  PrepStatus,
  FulfillmentStatus,
  InvoiceStatus,
  CloseoutChecklist,
  ArtConfirmation,
  ArtPlacement,
  ArtProof,
  ArtFile,
  STAGE_NUMBER
} from '../types';

// Valid enum values
const VALID_STATUSES: OrderStatus[] = [
  'Lead', 'Quote', 'Approval', 'Art Confirmation', 'Inventory Order',
  'Production Prep', 'Inventory Received', 'Production', 'Fulfillment',
  'Invoice', 'Closeout', 'Closed'
];

const VALID_PRODUCTION_METHODS: ProductionMethod[] = ['ScreenPrint', 'Embroidery', 'DTF', 'Other'];
const VALID_ART_STATUSES: ArtStatus[] = ['Not Started', 'In Progress', 'Sent to Customer', 'Revision Requested', 'Approved'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  orderResults: OrderValidationResult[];
}

export interface OrderValidationResult {
  orderId: string;
  orderNumber: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single line item
 */
export function validateLineItem(item: LineItem, index: number): string[] {
  const errors: string[] = [];
  const prefix = `LineItem[${index}]`;

  if (!item.id) errors.push(`${prefix}: Missing id`);
  if (!item.itemNumber) errors.push(`${prefix}: Missing itemNumber`);
  if (!item.name) errors.push(`${prefix}: Missing name`);
  if (!item.color) errors.push(`${prefix}: Missing color`);
  if (!item.size) errors.push(`${prefix}: Missing size`);
  if (typeof item.qty !== 'number' || item.qty < 0) errors.push(`${prefix}: Invalid qty`);
  if (!VALID_PRODUCTION_METHODS.includes(item.decorationType)) {
    errors.push(`${prefix}: Invalid decorationType "${item.decorationType}"`);
  }
  if (typeof item.decorationPlacements !== 'number') errors.push(`${prefix}: Missing decorationPlacements`);
  if (typeof item.cost !== 'number') errors.push(`${prefix}: Missing cost`);
  if (typeof item.price !== 'number') errors.push(`${prefix}: Missing price`);
  if (typeof item.ordered !== 'boolean') errors.push(`${prefix}: Missing ordered flag`);
  if (typeof item.received !== 'boolean') errors.push(`${prefix}: Missing received flag`);
  if (typeof item.decorated !== 'boolean') errors.push(`${prefix}: Missing decorated flag`);
  if (typeof item.packed !== 'boolean') errors.push(`${prefix}: Missing packed flag`);

  return errors;
}

/**
 * Validates lead info structure
 */
export function validateLeadInfo(leadInfo: LeadInfo | undefined, isLeadStatus: boolean): string[] {
  const errors: string[] = [];

  if (isLeadStatus && !leadInfo) {
    errors.push('Lead status order missing leadInfo');
    return errors;
  }

  if (!leadInfo) return errors;

  const validSources = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Trade Show', 'Email Campaign', 'Other'];
  const validTemps = ['Hot', 'Warm', 'Cold'];

  if (!validSources.includes(leadInfo.source)) {
    errors.push(`Invalid lead source: ${leadInfo.source}`);
  }
  if (!validTemps.includes(leadInfo.temperature)) {
    errors.push(`Invalid lead temperature: ${leadInfo.temperature}`);
  }
  if (typeof leadInfo.estimatedQuantity !== 'number') {
    errors.push('LeadInfo missing estimatedQuantity');
  }
  if (typeof leadInfo.estimatedValue !== 'number') {
    errors.push('LeadInfo missing estimatedValue');
  }

  return errors;
}

/**
 * Validates prep status structure
 */
export function validatePrepStatus(prepStatus: PrepStatus): string[] {
  const errors: string[] = [];

  if (prepStatus.gangSheetCreated !== null && typeof prepStatus.gangSheetCreated !== 'boolean') {
    errors.push('PrepStatus gangSheetCreated must be boolean or null');
  }
  if (prepStatus.artworkDigitized !== null && typeof prepStatus.artworkDigitized !== 'boolean') {
    errors.push('PrepStatus artworkDigitized must be boolean or null');
  }
  if (prepStatus.screensBurned !== null && typeof prepStatus.screensBurned !== 'boolean') {
    errors.push('PrepStatus screensBurned must be boolean or null');
  }

  return errors;
}

/**
 * Validates fulfillment status structure
 */
export function validateFulfillmentStatus(fulfillment: FulfillmentStatus): string[] {
  const errors: string[] = [];

  const validMethods = ['Shipped', 'PickedUp', null];
  if (!validMethods.includes(fulfillment.method)) {
    errors.push(`Invalid fulfillment method: ${fulfillment.method}`);
  }
  if (typeof fulfillment.shippingLabelPrinted !== 'boolean') {
    errors.push('FulfillmentStatus missing shippingLabelPrinted');
  }
  if (typeof fulfillment.customerPickedUp !== 'boolean') {
    errors.push('FulfillmentStatus missing customerPickedUp');
  }

  return errors;
}

/**
 * Validates invoice status structure
 */
export function validateInvoiceStatus(invoiceStatus: InvoiceStatus): string[] {
  const errors: string[] = [];

  if (typeof invoiceStatus.invoiceCreated !== 'boolean') {
    errors.push('InvoiceStatus missing invoiceCreated');
  }
  if (typeof invoiceStatus.invoiceSent !== 'boolean') {
    errors.push('InvoiceStatus missing invoiceSent');
  }
  if (typeof invoiceStatus.paymentReceived !== 'boolean') {
    errors.push('InvoiceStatus missing paymentReceived');
  }

  return errors;
}

/**
 * Validates closeout checklist structure
 */
export function validateCloseoutChecklist(checklist: CloseoutChecklist): string[] {
  const errors: string[] = [];

  if (typeof checklist.filesSaved !== 'boolean') {
    errors.push('CloseoutChecklist missing filesSaved');
  }
  if (typeof checklist.canvaArchived !== 'boolean') {
    errors.push('CloseoutChecklist missing canvaArchived');
  }
  if (typeof checklist.summaryUploaded !== 'boolean') {
    errors.push('CloseoutChecklist missing summaryUploaded');
  }

  return errors;
}

/**
 * Validates art file structure
 */
export function validateArtFile(file: ArtFile, context: string): string[] {
  const errors: string[] = [];
  const prefix = `${context}`;

  if (!file.id) errors.push(`${prefix}: Missing id`);
  if (!file.fileName) errors.push(`${prefix}: Missing fileName`);
  if (!file.fileUrl) errors.push(`${prefix}: Missing fileUrl`);
  if (typeof file.isMarkup !== 'boolean') errors.push(`${prefix}: Missing isMarkup flag`);

  const validFileTypes = ['original', 'proof', 'markup', 'reference', 'final'];
  if (!validFileTypes.includes(file.fileType)) {
    errors.push(`${prefix}: Invalid fileType "${file.fileType}"`);
  }

  const validSources = ['client', 'designer', 'system'];
  if (!validSources.includes(file.uploadedBy)) {
    errors.push(`${prefix}: Invalid uploadedBy "${file.uploadedBy}"`);
  }

  return errors;
}

/**
 * Validates art proof structure
 */
export function validateArtProof(proof: ArtProof, placementId: string, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Placement[${placementId}].Proof[${index}]`;

  if (!proof.id) errors.push(`${prefix}: Missing id`);
  if (typeof proof.version !== 'number') errors.push(`${prefix}: Missing version`);
  if (!proof.proofName) errors.push(`${prefix}: Missing proofName`);

  const validStatuses = ['Draft', 'Sent', 'Approved', 'Revision Needed'];
  if (!validStatuses.includes(proof.status)) {
    errors.push(`${prefix}: Invalid status "${proof.status}"`);
  }

  // Validate files
  if (proof.files) {
    proof.files.forEach((file, i) => {
      errors.push(...validateArtFile(file, `${prefix}.files[${i}]`));
    });
  }
  if (proof.markupFiles) {
    proof.markupFiles.forEach((file, i) => {
      errors.push(...validateArtFile(file, `${prefix}.markupFiles[${i}]`));
    });
  }

  return errors;
}

/**
 * Validates art placement structure
 */
export function validateArtPlacement(placement: ArtPlacement, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Placement[${index}]`;

  if (!placement.id) errors.push(`${prefix}: Missing id`);
  if (!placement.location) errors.push(`${prefix}: Missing location`);
  if (!Array.isArray(placement.proofs)) errors.push(`${prefix}: proofs must be an array`);

  placement.proofs?.forEach((proof, i) => {
    errors.push(...validateArtProof(proof, placement.id, i));
  });

  return errors;
}

/**
 * Validates art confirmation structure
 */
export function validateArtConfirmation(artConf: ArtConfirmation): string[] {
  const errors: string[] = [];

  if (!VALID_ART_STATUSES.includes(artConf.overallStatus)) {
    errors.push(`Invalid artConfirmation.overallStatus: ${artConf.overallStatus}`);
  }

  if (!Array.isArray(artConf.placements)) {
    errors.push('artConfirmation.placements must be an array');
  } else {
    artConf.placements.forEach((placement, i) => {
      errors.push(...validateArtPlacement(placement, i));
    });
  }

  if (!Array.isArray(artConf.clientFiles)) {
    errors.push('artConfirmation.clientFiles must be an array');
  } else {
    artConf.clientFiles.forEach((file, i) => {
      errors.push(...validateArtFile(file, `clientFiles[${i}]`));
    });
  }

  if (!Array.isArray(artConf.referenceFiles)) {
    errors.push('artConfirmation.referenceFiles must be an array');
  } else {
    artConf.referenceFiles.forEach((file, i) => {
      errors.push(...validateArtFile(file, `referenceFiles[${i}]`));
    });
  }

  if (!Array.isArray(artConf.revisionHistory)) {
    errors.push('artConfirmation.revisionHistory must be an array');
  }

  return errors;
}

/**
 * Validates a single order
 */
export function validateOrder(order: Order): OrderValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!order.id) errors.push('Missing id');
  if (!order.orderNumber) errors.push('Missing orderNumber');
  if (!order.customer) errors.push('Missing customer');
  if (!order.projectName) errors.push('Missing projectName');

  // Status validation
  if (!VALID_STATUSES.includes(order.status)) {
    errors.push(`Invalid status: ${order.status}`);
  }

  // Art status validation
  if (!VALID_ART_STATUSES.includes(order.artStatus)) {
    errors.push(`Invalid artStatus: ${order.artStatus}`);
  }

  // Date validation
  if (!order.createdAt) {
    errors.push('Missing createdAt');
  }

  // Boolean flags
  if (typeof order.rushOrder !== 'boolean') {
    errors.push('rushOrder must be boolean');
  }
  if (typeof order.isArchived !== 'boolean') {
    errors.push('isArchived must be boolean');
  }
  if (typeof order.version !== 'number') {
    errors.push('version must be number');
  }

  // Line items validation
  if (!Array.isArray(order.lineItems)) {
    errors.push('lineItems must be an array');
  } else {
    order.lineItems.forEach((item, i) => {
      errors.push(...validateLineItem(item, i));
    });
  }

  // Lead info validation (required for Lead status)
  errors.push(...validateLeadInfo(order.leadInfo, order.status === 'Lead'));

  // Sub-object validations
  if (order.prepStatus) {
    errors.push(...validatePrepStatus(order.prepStatus));
  } else {
    errors.push('Missing prepStatus');
  }

  if (order.fulfillment) {
    errors.push(...validateFulfillmentStatus(order.fulfillment));
  } else {
    errors.push('Missing fulfillment');
  }

  if (order.invoiceStatus) {
    errors.push(...validateInvoiceStatus(order.invoiceStatus));
  } else {
    errors.push('Missing invoiceStatus');
  }

  if (order.closeoutChecklist) {
    errors.push(...validateCloseoutChecklist(order.closeoutChecklist));
  } else {
    errors.push('Missing closeoutChecklist');
  }

  if (order.artConfirmation) {
    errors.push(...validateArtConfirmation(order.artConfirmation));
  } else {
    errors.push('Missing artConfirmation');
  }

  // History validation
  if (!Array.isArray(order.history)) {
    errors.push('history must be an array');
  }

  // Warnings (non-critical issues)
  if (!order.dueDate && order.status !== 'Lead') {
    warnings.push('No due date set');
  }
  if (!order.customerEmail) {
    warnings.push('No customer email');
  }
  if (order.status !== 'Lead' && order.lineItems.length === 0) {
    warnings.push('No line items for non-Lead order');
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates all orders and returns comprehensive results
 */
export function validateOrders(orders: Order[]): ValidationResult {
  const orderResults = orders.map(validateOrder);
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Check for duplicate IDs
  const ids = orders.map(o => o.id);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicateIds.length > 0) {
    allErrors.push(`Duplicate order IDs found: ${duplicateIds.join(', ')}`);
  }

  // Check for duplicate order numbers
  const orderNumbers = orders.map(o => o.orderNumber);
  const duplicateNumbers = orderNumbers.filter((n, i) => orderNumbers.indexOf(n) !== i);
  if (duplicateNumbers.length > 0) {
    allErrors.push(`Duplicate order numbers found: ${duplicateNumbers.join(', ')}`);
  }

  // Aggregate errors
  orderResults.forEach(result => {
    result.errors.forEach(err => allErrors.push(`[${result.orderNumber}] ${err}`));
    result.warnings.forEach(warn => allWarnings.push(`[${result.orderNumber}] ${warn}`));
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    orderResults
  };
}

/**
 * Validates workflow stage transition
 */
export function validateStageTransition(
  currentStage: OrderStatus,
  targetStage: OrderStatus,
  order: Order
): { valid: boolean; reason?: string } {
  const currentNum = STAGE_NUMBER[currentStage];
  const targetNum = STAGE_NUMBER[targetStage];

  // Allow reopening from Closed to any stage
  if (currentStage === 'Closed') {
    return { valid: true };
  }

  // Forward only (except Closed)
  if (targetNum !== currentNum + 1 && targetStage !== 'Closed') {
    return {
      valid: false,
      reason: `Cannot skip stages. Must go from ${currentStage} (${currentNum}) to stage ${currentNum + 1}`
    };
  }

  // Gate conditions
  switch (currentStage) {
    case 'Quote':
      if (order.lineItems.length === 0) {
        return { valid: false, reason: 'Must have at least one line item' };
      }
      break;

    case 'Art Confirmation':
      if (order.artStatus !== 'Approved' && order.artConfirmation.overallStatus !== 'Approved') {
        return { valid: false, reason: 'Art must be approved before advancing' };
      }
      break;

    case 'Inventory Order':
      const allOrdered = order.lineItems.every(li => li.ordered);
      if (!allOrdered) {
        return { valid: false, reason: 'All items must be marked as ordered' };
      }
      break;

    case 'Inventory Received':
      const allReceived = order.lineItems.every(li => li.received);
      if (!allReceived) {
        return { valid: false, reason: 'All items must be marked as received' };
      }
      break;

    case 'Production':
      const allComplete = order.lineItems.every(li => li.decorated && li.packed);
      if (!allComplete) {
        return { valid: false, reason: 'All items must be decorated and packed' };
      }
      break;

    case 'Fulfillment':
      const fulfilled = order.fulfillment.shippingLabelPrinted || order.fulfillment.customerPickedUp;
      if (!fulfilled) {
        return { valid: false, reason: 'Order must be shipped or picked up' };
      }
      break;

    case 'Invoice':
      if (!order.invoiceStatus.invoiceCreated || !order.invoiceStatus.invoiceSent) {
        return { valid: false, reason: 'Invoice must be created and sent' };
      }
      break;

    case 'Closeout':
      const { filesSaved, canvaArchived, summaryUploaded } = order.closeoutChecklist;
      if (!filesSaved || !canvaArchived || !summaryUploaded) {
        return { valid: false, reason: 'All closeout tasks must be completed' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Prints validation report to console
 */
export function printValidationReport(result: ValidationResult): void {
  console.log('\n========================================');
  console.log('PALLET DATA VALIDATION REPORT');
  console.log('========================================\n');

  console.log(`Overall Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Total Orders Checked: ${result.orderResults.length}`);
  console.log(`Valid Orders: ${result.orderResults.filter(r => r.valid).length}`);
  console.log(`Invalid Orders: ${result.orderResults.filter(r => !r.valid).length}`);

  if (result.errors.length > 0) {
    console.log('\n--- ERRORS ---');
    result.errors.forEach(err => console.log(`❌ ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    result.warnings.forEach(warn => console.log(`⚠️ ${warn}`));
  }

  console.log('\n========================================\n');
}

export default {
  validateOrder,
  validateOrders,
  validateStageTransition,
  printValidationReport
};
