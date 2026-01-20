# Pallet Application - Test and Update Procedures

## Version: 2.1.0
## Last Updated: 2025-01-20

---

## Table of Contents
1. [Data Structure Overview](#data-structure-overview)
2. [Update Procedures](#update-procedures)
3. [Testing Procedures](#testing-procedures)
4. [Validation Checklist](#validation-checklist)
5. [Troubleshooting](#troubleshooting)

---

## Data Structure Overview

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| Order | Primary job tracking entity | id, orderNumber, customer, status, lineItems |
| LineItem | Individual product in an order | id, itemNumber, qty, decorationType, ordered/received/decorated/packed |
| LeadInfo | Sales funnel data | source, temperature, estimatedValue |
| ArtConfirmation | Art approval workflow | overallStatus, placements, revisionHistory |
| PrepStatus | Production prep checklist | gangSheetCreated, artworkDigitized, screensBurned |
| FulfillmentStatus | Shipping/pickup tracking | method, trackingNumber, customerPickedUp |
| InvoiceStatus | Invoice tracking | invoiceCreated, invoiceSent, paymentReceived |
| CloseoutChecklist | Project closure tasks | filesSaved, canvaArchived, summaryUploaded |
| User | System user account | id, username, password, displayName, role, isActive |
| OrgHierarchy | Organization structure | users, departments, lastUpdatedAt |
| ProductivityEntry | Production floor tracking | operatorName, itemsDecorated, itemsPacked |

### User Roles & Permissions

| Role | Level | Description |
|------|-------|-------------|
| Admin | Owner | Full access - manage users, settings, all stages |
| Manager | Admin | Manage users (no delete), access all stages/reports |
| Sales | Operator | Create orders, access sales stages, view reports |
| Production | Operator | Access production stages, Production Floor dashboard |
| Fulfillment | Operator | Access fulfillment stages and tracking |
| ReadOnly | Operator | View-only access to all areas |

### Workflow Stages (12 Total)

| Stage | Number | Gate Condition |
|-------|--------|----------------|
| Lead | 0 | Customer info captured |
| Quote | 1 | Line items added with pricing |
| Approval | 2 | Customer approves quote |
| Art Confirmation | 3 | Art status = Approved |
| Inventory Order | 4 | All line items ordered |
| Production Prep | 5 | All prep tasks complete |
| Inventory Received | 6 | All line items received |
| Production | 7 | All items decorated and packed |
| Fulfillment | 8 | Shipped or picked up |
| Invoice | 9 | Invoice created and sent |
| Closeout | 10 | All closeout tasks complete |
| Closed | 11 | Order completed |

---

## Update Procedures

### Before Making Schema Changes

1. **Backup Current Data**
   ```typescript
   // Export current orders to JSON
   const backup = JSON.stringify(orders, null, 2);
   localStorage.setItem('pallet-backup-' + Date.now(), backup);
   ```

2. **Document Schema Version**
   - Update `SCHEMA_DEFINITION.version` in `types.ts`
   - Add migration notes to this document

3. **Create Migration Script**
   ```typescript
   // Example migration for adding new field
   const migrateOrders = (orders: Order[]): Order[] => {
     return orders.map(order => ({
       ...order,
       newField: order.newField ?? defaultValue,
       version: order.version + 1
     }));
   };
   ```

### Adding New Fields to Order

1. Add type definition in `types.ts`
2. Add default value in `constants.tsx`
3. Update `SCHEMA_DEFINITION` documentation
4. Create migration for existing data
5. Update UI components that use the field
6. Run validation tests

### Adding New Workflow Stage

1. Update `OrderStatus` type in `types.ts`
2. Update `STAGE_NUMBER` mapping
3. Update `ALLOWED_TRANSITIONS`
4. Add to `ORDER_STAGES` array in `constants.tsx`
5. Update workflow documentation in `SCHEMA_DEFINITION`
6. Add UI handling in `OrderSlideOver.tsx`
7. Update `WorkflowSidebar.tsx` if needed
8. Run full workflow tests

### Modifying Existing Fields

1. **Non-breaking changes** (adding optional fields):
   - Add with `?:` optional modifier
   - Provide default value in constants
   - No migration required for existing data

2. **Breaking changes** (renaming, removing, changing types):
   - Create migration function
   - Update all references across codebase
   - Test with existing data
   - Document in changelog

---

## Testing Procedures

### Authentication Tests

1. **Login Page**
   - [ ] Login page displays on unauthenticated access
   - [ ] Default credentials work (admin/admin)
   - [ ] Invalid credentials show error message
   - [ ] Deactivated user cannot login
   - [ ] Session persists after page refresh

2. **Password Management**
   - [ ] User can change their own password (requires current password)
   - [ ] Admin can reset any user's password (no current password needed)
   - [ ] Password validation works (min 4 chars, must match confirm)
   - [ ] Password change success/error messages display

3. **User Management (Admin Only)**
   - [ ] Can add new users with all roles
   - [ ] Can deactivate users (soft delete)
   - [ ] Can import users via CSV
   - [ ] CSV template download works
   - [ ] Cannot delete last admin user

4. **Role-Based Access Control**
   - [ ] Sales users see only sales-related stages
   - [ ] Production users see Production Floor
   - [ ] Fulfillment users see Fulfillment Tracking
   - [ ] ReadOnly users cannot edit
   - [ ] Non-admin users cannot access Settings
   - [ ] Sidebar items hidden based on permissions

### Quick Validation Test

Run this in browser console to validate all orders:

```typescript
// Paste validateOrders function from testUtils.ts
// Then run:
const results = validateOrders(orders);
console.log('Valid:', results.valid);
console.log('Errors:', results.errors);
```

### Manual Workflow Test

For each test order, verify:

1. **Lead Stage**
   - [ ] Lead info displays correctly
   - [ ] Temperature/source badges show
   - [ ] Can convert to Quote

2. **Quote Stage**
   - [ ] Can add line items
   - [ ] Pricing calculates correctly
   - [ ] Can advance to Approval

3. **Approval Stage**
   - [ ] Quote summary displays
   - [ ] Can advance to Art Confirmation

4. **Art Confirmation Stage**
   - [ ] Can add placements
   - [ ] Can upload files
   - [ ] Can create/send proofs
   - [ ] Can record feedback
   - [ ] Can approve artwork
   - [ ] Revision history tracks changes

5. **Inventory Order Stage**
   - [ ] Line items show ordered status
   - [ ] Can mark items as ordered
   - [ ] Gate blocks until all ordered

6. **Production Prep Stage**
   - [ ] Shows correct prep tasks based on decoration types
   - [ ] Can complete prep checklist
   - [ ] Gate validates all required tasks

7. **Inventory Received Stage**
   - [ ] Shows receiving checklist
   - [ ] Can mark items received
   - [ ] Gate blocks until all received

8. **Production Stage**
   - [ ] Shows decoration progress
   - [ ] Can mark items decorated
   - [ ] Can mark items packed
   - [ ] Gate validates completion

9. **Fulfillment Stage**
   - [ ] Can select shipping or pickup
   - [ ] Can enter tracking number
   - [ ] Can confirm pickup
   - [ ] Appears in Fulfillment Tracking page

10. **Invoice Stage**
    - [ ] Can create invoice
    - [ ] Can send invoice
    - [ ] Can record payment
    - [ ] Payment methods work

11. **Closeout Stage**
    - [ ] Shows closeout checklist
    - [ ] Can complete all tasks
    - [ ] Can close order

12. **Closed Stage**
    - [ ] Order appears in Closed section
    - [ ] Can reopen to previous stage
    - [ ] Closed info displays correctly

### Production Floor Tests

1. **Dashboard**
   - [ ] In Production count accurate
   - [ ] Due in 7 Days shows correct orders
   - [ ] Coming Up shows prep/received orders

2. **TV Display Mode**
   - [ ] Full screen works
   - [ ] All columns display
   - [ ] Large fonts readable
   - [ ] Auto-updates working

3. **Productivity Worksheet**
   - [ ] Can add entries
   - [ ] Order dropdown populated
   - [ ] Totals calculate correctly
   - [ ] Entries persist

### Reports/Analytics Tests

1. **Reports Page**
   - [ ] All charts render
   - [ ] Data accurate to orders
   - [ ] Filters work

2. **Customer Search**
   - [ ] Finds customers by name
   - [ ] Shows order counts
   - [ ] Filter applies correctly

### Data Backup & Export Tests

1. **Excel System Backup**
   - [ ] Download button works
   - [ ] File opens in Excel
   - [ ] README sheet has instructions
   - [ ] Users sheet contains all users with passwords
   - [ ] Orders sheet contains all order data
   - [ ] LineItems sheet has all line items
   - [ ] History sheet has audit trail
   - [ ] ArtPlacements sheet has art data
   - [ ] Fulfillment sheet has shipping info

2. **JSON Exports**
   - [ ] Full Database Export downloads
   - [ ] Orders JSON downloads
   - [ ] Schema JSON downloads

3. **CSV Exports**
   - [ ] Analytics CSV contains order summaries
   - [ ] Line Items CSV contains all items

---

## Validation Checklist

### Data Integrity Checks

```typescript
// Run these checks before/after updates

// 1. All orders have required fields
orders.every(o => o.id && o.orderNumber && o.customer && o.status);

// 2. All line items have required fields
orders.flatMap(o => o.lineItems).every(li =>
  li.id && li.itemNumber && li.qty > 0 && li.decorationType
);

// 3. Status is valid
const validStatuses = ['Lead', 'Quote', 'Approval', 'Art Confirmation',
  'Inventory Order', 'Production Prep', 'Inventory Received',
  'Production', 'Fulfillment', 'Invoice', 'Closeout', 'Closed'];
orders.every(o => validStatuses.includes(o.status));

// 4. Dates are valid
orders.every(o => o.createdAt instanceof Date || !isNaN(new Date(o.createdAt)));

// 5. No duplicate IDs
const ids = orders.map(o => o.id);
ids.length === new Set(ids).size;
```

### Performance Checks

- [ ] App loads in < 3 seconds
- [ ] Stage transitions < 500ms
- [ ] Order list scrolls smoothly with 100+ orders
- [ ] Search responds in < 200ms

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Troubleshooting

### Common Issues

**Issue: Orders not displaying**
- Check browser console for errors
- Verify order data structure matches types
- Check isArchived flag is false

**Issue: Stage transition blocked**
- Check gate conditions for stage
- Verify all required checkboxes complete
- Check order has required fields

**Issue: Art files not showing**
- Verify file URLs are accessible
- Check file structure matches ArtFile interface
- Verify uploadedAt is valid Date

**Issue: Production floor counts wrong**
- Check order status values exactly match
- Verify dueDate format (YYYY-MM-DD)
- Check isArchived flag

### Debug Mode

Add to browser console:
```typescript
// Enable debug logging
window.DEBUG_PALLET = true;

// Log all state changes
window.logStateChanges = true;
```

### Data Recovery

```typescript
// List all backups
Object.keys(localStorage).filter(k => k.startsWith('pallet-backup'));

// Restore from backup
const backup = localStorage.getItem('pallet-backup-TIMESTAMP');
const orders = JSON.parse(backup);
```

---

## Changelog

### v2.1.0 (2025-01-20)
- Added authentication system with login requirement
- Added role-based access control (RBAC) with 6 user roles
- Added user management with CSV bulk import
- Added password management (self-service and admin reset)
- Added comprehensive Excel backup export for disaster recovery
- Added audit trail with user attribution on all changes
- Updated documentation for all new features
- Added xlsx library for Excel export

### v2.0.0 (2024-01-20)
- Added 12-stage workflow (Lead through Closed)
- Added art confirmation workflow with file uploads
- Added Invoice stage with payment tracking
- Added Closeout stage for project archival
- Added Production Floor dashboard with TV mode
- Added Productivity worksheet for operators
- Added Fulfillment tracking page

### Migration from v2.0.x to v2.1.x
```typescript
// No order schema changes - only auth system added
// Default admin user created automatically on first run
// localStorage keys:
// - pallet-auth: Current user session
// - pallet-org-hierarchy: User/department data
```

### Migration from v1.x to v2.0.x
```typescript
// Orders from v1.x need these fields added:
const migrateFromV1 = (order) => ({
  ...order,
  invoiceStatus: DEFAULT_INVOICE_STATUS,
  closeoutChecklist: DEFAULT_CLOSEOUT,
  artConfirmation: order.artConfirmation || DEFAULT_ART_CONFIRMATION,
  closedAt: undefined,
  closedReason: undefined,
  reopenedFrom: undefined
});
```
