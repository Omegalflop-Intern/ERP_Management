# Brothers Mobile Shop ERP — Full Project Specification

> **Client Side + Server Side Phase-by-Phase Development Plan**
> Reference: https://brothers.developitltd.com/
> Stack: **Vite + React.js (JavaScript) + Node.js/Express + MongoDB**

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vite + React.js + JavaScript | SPA, Dashboard, Sales |
| UI Library | Tailwind CSS + Shadcn/UI or Ant Design | Fully Responsive UI |
| Responsive | Mobile-first, Tailwind breakpoints | sm:md:lg:xl:2xl |
| State | Zustand | Global state management |
| Server State | TanStack Query (React Query) | API caching, refetching, optimistic updates |
| Table | AG Grid Community | Data tables (ERP-grade, sorting, filtering, grouping) |
| Toast | Sonner | Toast notifications (better than react-toastify) |
| Skeleton | react-loading-skeleton | Loading states for all pages |
| HTTP | Axios | API communication |
| Charts | Recharts or Chart.js | Analytics dashboards |
| PDF | jsPDF + jspdf-autotable | Invoice/report generation |
| Real-time | Native Browser Events (EventEmitter) | Live stock, notifications (no Socket.io) |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB + Mongoose | NoSQL data storage |
| Auth | JWT (access + refresh tokens) | Authentication & authorization |
| File Upload | Multer + Cloudinary/GridFS | Image/file storage |
| Validation | Joi or Zod | Request validation |
| Email | Nodemailer | Password reset, notifications |
| SMS | SMS Gateway API (future) | OTP, notifications to mobile |
| Offline | Service Worker + IndexedDB | Offline/online data sync |
| Deployment | Docker + PM2 + Nginx | Server deployment |

---

## Key Design Decisions

### 1. Real-time: Native Events (NOT Socket.io)
```js
// No Socket.io — use browser's built-in EventEmitter
// client/src/utils/EventEmitter.js
class EventEmitter {
  constructor() { this.events = {}; }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}
export const emitter = new EventEmitter();

// Usage in component:
// emitter.on('stock:updated', (data) => { ... });
// emitter.emit('sale:completed', { invoiceId, branch });
```

### 2. TanStack Query (Must Need for ERP)
```js
// client/src/hooks/useProducts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';

export function useProducts(filters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
    },
  });
}
```

### 3. AG Grid (Better than React Table)
```jsx
// AG Grid — ERP-grade table with:
// - Sorting, filtering, grouping
// - CSV/Excel export
// - Column pinning, resizing
// - Row selection, inline editing
// - Server-side row model for large datasets
import { AgGridReact } from 'ag-grid-react';

<AgGridReact
  rowData={products}
  columnDefs={columnDefs}
  pagination={true}
  paginationPageSize={20}
  onRowClicked={(e) => navigate(`/products/${e.data._id}`)}
/>
```

### 4. Navigation Behavior (Same Tab + Scroll)
```
- NO new tab opens — everything in same tab
- After submit/track → stays in same tab
- Table row click → scrolls to that row (highlight)
- URL-based routing (react-router-dom)
```

### 5. Skeleton Loading (Every Page)
```jsx
// Show skeleton while data loads
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

if (isLoading) return <ProductListSkeleton />;
// or inline: <Skeleton count={10} height={40} />
```

### 6. Invoice Generation (Client-side PDF)
```js
// jsPDF + jspdf-autotable
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generateInvoice = (sale) => {
  const doc = new jsPDF();
  doc.text(`Invoice #${sale.invoiceNumber}`, 14, 20);
  doc.autoTable({
    head: [['Item', 'IMEI', 'Qty', 'Price', 'Total']],
    body: sale.items.map(i => [i.product.name, i.imei.imeiNumber, i.quantity, i.unitPrice, i.total]),
  });
  doc.save(`invoice-${sale.invoiceNumber}.pdf`);
};
```

### 7. Offline/Online Sync
```js
// Service Worker + IndexedDB
// - Cache API responses
// - Queue offline actions (sales, attendance)
// - Sync when back online
// - Show offline indicator in UI
if (!navigator.onLine) {
  // Save to IndexedDB
  // Show "Offline" badge in topbar
  // Queue action for sync
}
```

### 8. SMS Integration (Future)
```js
// SMS Gateway API integration
// - OTP on login
// - Due reminder to customer
// - Sale confirmation SMS
// - Employee attendance notification
```

### 9. Sonner Toast (Better than react-toastify)
```jsx
import { toast } from 'sonner';

// Success
toast.success('Product created successfully');

// Error
toast.error('Failed to save');

// Promise
toast.promise(saveProduct(), {
  loading: 'Saving...',
  success: 'Product saved!',
  error: 'Failed to save',
});
```

---

## UI/UX Design & Color Scheme

> **Modern, minimalist design — dark/light mode — maroon/red primary — 3 button colors max**

### Color Palette
```
Primary:    #991b1b (dark maroon) / #dc2626 (light red) / #7f1d1d (darkest)
Accent:     #f59e0b (amber) — badges, highlights, warnings
Success:    #10b981 (green) — active status, completed
Danger:     #ef4444 (red) — errors, delete, critical
Info:       #3b82f6 (blue) — info messages, links
Neutral:    #6b7280 (gray) — borders, secondary text
```

### Button Colors (Max 3)
```
Primary (Maroon/Red)  → Submit, Save, Create, Confirm
Success (Green)       → Approve, Complete, Paid
Neutral (Gray)        → Cancel, Close, Back
```

### Status Badges
```
● Active / Paid / Completed / Available    → Green
● Pending / Processing / Low Stock         → Amber
● Cancelled / Overdue / Out of Stock       → Red
● Transferred / In Transit                 → Blue
```

### Dark Mode (Default)
```
Background:     #0f172a (slate-900)
Card/Surface:   #1e293b (slate-800)
Border:         #334155 (slate-700)
Text Primary:   #f8fafc (slate-50)
Text Secondary: #94a3b8 (slate-400)
```

### Light Mode
```
Background:     #f8fafc (slate-50)
Card/Surface:   #ffffff (white)
Border:         #e2e8f0 (slate-200)
Text Primary:   #0f172a (slate-900)
Text Secondary: #64748b (slate-500)
```

### Theme Toggle
```
- Topbar e theme toggle icon (sun/moon)
- localStorage e save thakbe
- System preference detect korbe (prefers-color-scheme)
```

### UI Style Guide (Modern + Minimalist)
```
Typography:    Inter (Google Fonts), JetBrains Mono (code, IMEI)
Headings:      font-weight 600-700
Body:          font-weight 400

Spacing:       Section gap 24px, Card padding 16-24px, Table row 12-16px
Borders:       Cards rounded-xl (12px), Buttons rounded-lg (8px), Badges rounded-full
Shadows:       Cards shadow-sm, Modals shadow-xl, Dropdowns shadow-lg
Animations:    200ms ease transitions, Skeleton pulse, Page fade-in
```

---

## Auth Pages — Sea Wave Animation

> **Login & Forgot Password pages e animated sea wave background thakbe**

### Auth Page Design
```
Layout:
  - Full screen (100vh)
  - Left side: Sea wave animation (CSS/SVG)
  - Right side: Login/Forgot form card
  - On mobile: Form full-width, wave at bottom

Sea Wave Animation:
  - CSS @keyframes wave animation
  - 3 wave layers (different speeds, colors)
  - Color: Primary maroon with transparency
  - Smooth infinite loop
  - 8-10 seconds duration per cycle

CSS Implementation:
  @keyframes wave {
    0% { transform: translateX(0) translateZ(0) scaleY(1); }
    50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); }
    100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
  }

  .wave {
    position: absolute;
    bottom: 0;
    width: 200%;
    height: 100%;
    animation: wave 10s linear infinite;
  }

  .wave:nth-child(1) { opacity: 0.7; animation-delay: 0s; }
  .wave:nth-child(2) { opacity: 0.5; animation-delay: -3s; }
  .wave:nth-child(3) { opacity: 0.3; animation-delay: -6s; }

Form Card:
  - Background: semi-transparent white/dark
  - Backdrop blur: blur(10px)
  - Border radius: 20px
  - Shadow: 0 25px 45px rgba(0,0,0,0.2)
  - Padding: 40px

Logo:
  - Company logo at top of form
  - "Brothers" text
  - Subtitle: "Mobile Shop ERP"
```

### Auth Page Color Scheme
```
Dark Mode:
  Wave 1: rgba(153, 27, 27, 0.7)   (maroon 70%)
  Wave 2: rgba(185, 28, 28, 0.5)   (red 50%)
  Wave 3: rgba(220, 38, 38, 0.3)   (light red 30%)
  Form BG: rgba(30, 41, 59, 0.8)   (slate-800 80%)

Light Mode:
  Wave 1: rgba(153, 27, 27, 0.6)   (maroon 60%)
  Wave 2: rgba(185, 28, 28, 0.4)   (red 40%)
  Wave 3: rgba(220, 38, 38, 0.2)   (light red 20%)
  Form BG: rgba(255, 255, 255, 0.85) (white 85%)
```

### Auth Form Fields
```
Login Page:
  - Input: Username/Email/Phone (with icon)
  - Input: Password (with EYE TOGGLE)
  - Checkbox: Remember me
  - Button: Sign In (animated hover)
  - Link: Forgot Password?

Forgot Password Page:
  - Input: Email (with icon)
  - Button: Send Reset Link (animated hover)
  - Link: Back to Login
```

---

## Password Field — Eye Toggle

> **Shob password field e eye on/off button thakbe — password dekha/jaoya jabe**

### Eye Toggle Implementation
```
Component: PasswordInput.jsx

Props:
  - value, onChange, placeholder, name, required

Features:
  - Default: password type (••••••)
  - Click eye icon → text type (visible)
  - Click eye-off icon → password type (hidden)
  - Smooth transition on icon change
  - Accessible (aria-label, tabIndex)

CSS:
  .password-input {
    position: relative;
  }

  .password-input input {
    padding-right: 45px; /* space for eye icon */
  }

  .eye-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #94a3b8;
    transition: color 200ms ease;
  }

  .eye-toggle:hover {
    color: #dc2626; /* primary red on hover */
  }

  .eye-toggle svg {
    transition: transform 300ms ease;
  }

  .eye-toggle:active svg {
    transform: scale(0.8); /* click effect */
  }

Implementation:
  import { Eye, EyeOff } from 'lucide-react';
  const [showPassword, setShowPassword] = useState(false);

  <div className="password-input">
    <input
      type={showPassword ? 'text' : 'password'}
      {...props}
    />
    <button
      type="button"
      className="eye-toggle"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>

Usage in pages:
  - Login page: password field
  - Forgot Password: new password field
  - User Form: create/edit password
  - Any form with password input
```

---

## Theme Switching — Animated Button

> **Dark/Light toggle button animated hobe — smooth transition**

### Theme Toggle Animation
```
Component: ThemeToggle.jsx

Animation Options:

Option 1: Sun/Moon Rotation
  - Sun icon rotates 360° → transforms to Moon
  - Moon icon rotates 360° → transforms to Sun
  - CSS: transition: transform 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);

Option 2: Fade Scale
  - Current icon fades out + scales down
  - New icon fades in + scales up
  - CSS: transition: all 300ms ease;

Option 3: Morphing (Best)
  - Sun rays morph into moon crescent
  - SVG path animation
  - Smooth shape transformation

Recommended: Option 1 (Sun/Moon Rotation) — simple + elegant

CSS Animation:
  .theme-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 300ms ease, transform 300ms ease;
  }

  .theme-toggle:hover {
    background: rgba(220, 38, 38, 0.1); /* primary with opacity */
    transform: rotate(15deg);
  }

  .theme-toggle:active {
    transform: rotate(360deg) scale(0.9);
  }

  .theme-toggle svg {
    transition: transform 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55),
                color 300ms ease;
    color: #f59e0b; /* amber for sun */
  }

  .theme-toggle.dark svg {
    color: #94a3b8; /* gray for moon */
  }

Implementation:
  import { Sun, Moon } from 'lucide-react';
  import { useTheme } from '../store/uiStore';

  const { theme, toggleTheme } = useTheme();

  <button
    className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`}
    onClick={toggleTheme}
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
  </button>

Position:
  - Topbar (right side, next to user avatar)
  - Auth page (top-right corner)

localStorage:
  - key: 'theme'
  - values: 'dark' | 'light'
  - Default: 'dark'
  - On load: check localStorage → apply theme
```

### Theme Transition
```
Global CSS for smooth theme switch:
  * {
    transition: background-color 300ms ease,
                color 300ms ease,
                border-color 300ms ease,
                box-shadow 300ms ease;
  }

  /* Disable transition on page load (prevent flash) */
  .no-transition * {
    transition: none !important;
  }

JavaScript:
  // On theme toggle, add no-transition class temporarily
  document.documentElement.classList.add('no-transition');
  // Apply theme
  applyTheme(newTheme);
  // Remove class after brief delay
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transition');
  });
```

---

## Invoice Sizes & Format

> **4 invoice sizes — barcode + QR code included in all**

### Invoice Size Options
```
Size 1: A4 Full (210mm × 297mm)
  - Full page invoice
  - Company header + customer info + items table + totals
  - Barcode at bottom, QR code at bottom-right

Size 2: A4 Half (210mm × 148mm)
  - A4 ke 2ta kore print kora
  - Each half = 1 invoice
  - Compact layout — smaller fonts

Size 3: Receipt (1.5" / 2-3" width × 1.75" height)
  - Thermal printer receipt
  - Compact: Company name, invoice#, items, total, due
  - Barcode + QR code at bottom

Size 4: Thermal (2" width × Unlimited height)
  - Standard thermal receipt
  - Full item list — no height restriction
  - Barcode + QR code at bottom
```

### Invoice Content (All Sizes)
```
COMPANY LOGO + NAME + Address + Phone + Branch
─────────────────────────────────────────────
Invoice #: INV-2026-00001
Date: 2026-07-20
Customer: Name, Phone
─────────────────────────────────────────────
TABLE:
│ Product  │ IMEI    │ Qty │ Price  │ Total  │
│----------│---------│-----│--------│--------│
│ iPhone   │ 123456  │  1  │ 85,000 │ 85,000 │
│ Charger  │ 789012  │  2  │  1,500 │  3,000 │
─────────────────────────────────────────────
Subtotal:    88,000
VAT (15%):   13,200
Discount:     2,000
GRAND TOTAL: 99,200
Paid:        50,000
Due:         49,200
─────────────────────────────────────────────
Payment Method: bKash/Cash
[████████████████] BARCODE
[▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄] QR CODE
Thank you!
```

### Barcode & QR Code Libraries
```
npm packages:
  jsbarcode    — Generate barcode from invoice number
  qrcode       — Generate QR code from invoice data

QR Code Data:
  - Invoice number
  - Grand total
  - Date
  - Branch name
  → Scan korle invoice detail dekha jabe
```

---

## Performance Requirements (Top Level)

> **Intern hire — company te impress korte hobe — performance must be top-level!**

### Performance Targets
```
Lighthouse Score:        90+ (all categories)
First Contentful Paint:  < 1.5s
Largest Contentful Paint: < 2.5s
Time to Interactive:     < 3.5s
Bundle Size:             < 200KB (gzipped)
API Response:            < 200ms
```

### Frontend Performance
```
1. Code Splitting      → React.lazy() + Suspense (route-based)
2. Tree Shaking        → Vite auto tree-shakes
3. Image Optimization  → WebP, lazy loading, responsive images
4. Font Loading        → font-display: swap
5. CSS Purging         → Tailwind purge unused CSS
6. Memoization         → React.memo(), useMemo(), useCallback()
7. Virtual Scrolling   → AG Grid handles large datasets
8. Skeleton Loading    → Instant UI feedback
9. Prefetching         → TanStack Query prefetch on hover
```

### Backend Performance
```
1. Indexing            → MongoDB indexes on frequent queries
2. Projection          → select() only needed fields
3. Pagination          → cursor-based or page-based
4. Caching             → TanStack Query client-side cache
5. Compression         → gzip/brotli via Nginx
6. Connection Pooling  → Mongoose connection pool
7. Rate Limiting       → Prevent abuse
8. CDN                 → Static assets via CDN
```

### Build Optimization
```
1. Vite Build          → Fast HMR, optimized builds
2. Minification        → Terser for JS, CSSNano for CSS
3. Gzip                → Enable compression
4. HTTP/2              → Multiplexed connections
5. Cache Headers       → Static assets: 1 year cache
```

---

## Complete Features List (All Modules)

> **Ekhane sob kichhu ache — tui nije customize korte parbi**

### Module 1: Auth & User Management
```
✅ Login (username/email/phone + password)
✅ Forgot password (email reset)
✅ Role-based access (Admin, Manager, Operator, Accountant)
✅ User CRUD (create, edit, delete, deactivate)
✅ Activity logs (who did what)
✅ Session management
```

### Module 2: Branch Management
```
✅ Multi-branch support
✅ Branch CRUD (create, edit, deactivate)
✅ Branch-wise stock tracking
✅ Branch-wise sales report
✅ Branch manager assignment
```

### Module 3: Product & Inventory
```
✅ Product CRUD (name, brand, model, category, specs)
✅ Category management
✅ Brand management
✅ SKU & barcode generation
✅ Cost price & selling price
✅ VAT/tax rate per product
✅ Product image upload
✅ Product search & filter
✅ Import/Export (CSV/Excel)
```

### Module 4: IMEI Tracking
```
✅ IMEI/Serial number entry
✅ IMEI status tracking (available, sold, returned, defective, transferred)
✅ IMEI per branch assignment
✅ IMEI warranty expiry tracking
✅ IMEI history (kobe kineche, kake sell hoise)
✅ Barcode/QR code per IMEI
```

### Module 5: Stock Management
```
✅ Stock level per branch
✅ Low stock alerts
✅ Stock transfer (branch-to-branch)
✅ Stock transfer approval workflow
✅ Auto-reorder threshold
✅ Stock valuation report
```

### Module 6: Sales & Invoicing
```
✅ Sales screen (IMEI scan, customer select, checkout)
✅ Invoice generation (4 sizes: A4, A4-half, receipt, thermal)
✅ Barcode + QR code on invoice
✅ Sales history & filters
✅ Sales return (partial/full)
✅ Discount & VAT/tax calculation
✅ Payment method (cash, card, bKash, Nagad, rocket)
✅ Due tracking per customer
✅ Daily/weekly/monthly sales report
✅ Branch-wise sales comparison
```

### Module 7: Wholesale
```
✅ Wholesale price tier (different from retail)
✅ Bulk order management
✅ Wholesale customer profiles
✅ Wholesale invoice format
✅ Wholesale discount rules
✅ Minimum order quantity (MOQ)
✅ Wholesale vs Retail price comparison
✅ Wholesale order history
```

### Module 8: Purchase & Supplier
```
✅ Supplier CRUD
✅ Purchase order creation
✅ Purchase order approval
✅ Goods received note (GRN)
✅ IMEI assignment on purchase receive
✅ Supplier payment tracking
✅ Supplier due/balance
✅ Purchase history per supplier
✅ Purchase report (by supplier, product, date)
```

### Module 9: Customer Management (CRM)
```
✅ Customer CRUD
✅ Customer purchase history
✅ Customer due tracking
✅ Due collection (partial payment)
✅ Customer warranty info
✅ Customer feedback/rating
✅ SMS/WhatsApp notification (future)
```

### Module 10: Warranty & Claims
```
✅ Warranty period per product (default 12 months)
✅ Warranty expiry tracking per IMEI
✅ Warranty claim creation
✅ Warranty claim status (pending, approved, rejected, completed)
✅ Warranty claim with invoice reference
✅ Warranty replacement/repair tracking
✅ Warranty report (expired, expiring soon)
✅ Customer warranty history
```

### Module 11: Product Returns
```
✅ Sales return (customer → shop)
✅ Return with reason (defective, wrong item, change of mind)
✅ Return IMEI status update (sold → returned)
✅ Return stock re-entry
✅ Return/refund processing
✅ Return report
✅ Return vs Sales ratio
```

### Module 12: HR & Payroll
```
✅ Employee CRUD
✅ Employee branch assignment
✅ Attendance (check-in/out with geolocation)
✅ Leave management (apply, approve, reject)
✅ Salary processing
✅ Salary advance/deduction
✅ Payslip generation (PDF)
✅ Payroll report
```

### Module 13: Accounting & Finance
```
✅ Chart of accounts
✅ Journal entries
✅ Income/expense tracking
✅ Balance sheet
✅ Profit & loss statement
✅ Cash/bank account management
✅ Tax reporting (VAT/GST)
✅ Due collection dashboard
```

### Module 14: Reporting & Analytics
```
✅ Sales reports (daily, weekly, monthly, by product, by branch)
✅ Inventory valuation
✅ Top selling products
✅ Branch-wise performance
✅ Purchase reports
✅ Customer reports
✅ Employee reports
✅ Export (PDF/Excel)
✅ Custom date range filter
✅ Charts & graphs (Recharts)
```

### Module 15: Settings
```
✅ Company settings (name, address, logo, phone)
✅ Branch settings
✅ User roles & permissions
✅ Tax/VAT configuration
✅ Currency settings
✅ Notification preferences
```

### Module 16: Offline & Online Sync (MUST HAVE — NOT FUTURE!)
```
✅ Service Worker for offline support
✅ IndexedDB for data caching (products, stock, customers)
✅ Queue offline actions (sales, attendance)
✅ Sync when back online
✅ Offline indicator in UI (topbar badge)
✅ Conflict resolution (last write wins)
✅ Queue retry on failure
✅ Offline sales support
✅ Offline IMEI check support
```

### Module 17: SMS Integration (Future)
```
✅ OTP on login
✅ Due reminder to customer
✅ Sale confirmation SMS
✅ Employee attendance notification
✅ Warranty expiry reminder
```

---

## Responsive Design Requirements

> **Mobile-first approach — every page must work on mobile, tablet, and desktop.**

### Breakpoints (Tailwind CSS)
```
sm: 640px    → Mobile landscape
md: 768px    → Tablet
lg: 1024px   → Desktop
xl: 1280px   → Large desktop
2xl: 1536px  → Extra large
```

### Responsive Rules
| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Sidebar | Hidden (hamburger) | Collapsed icons | Full expanded |
| Topbar | Hamburger + logo | Full menu | Full menu + user info |
| Tables | Card view (stacked) | Scrollable table | Full table |
| Forms | Single column | 2 columns | 2-3 columns |
| Dashboard | Stacked cards | 2-column grid | 4-column grid |
| POS/Sales | Full-width cart | Split view | Side-by-side |
| Modals | Full-screen | Centered modal | Centered modal |
| Search | Full-width input | Inline search | Inline + filters |

### Key Pages Responsive Behavior
```
Login         → Centered card, full width on mobile
Dashboard     → Stats cards stack vertically on mobile
Product List  → Card view on mobile, table on desktop
Sales/Invoice → Scrollable horizontally on mobile
Reports       → Charts stack vertically, full width
Settings      → Single column on mobile, multi on desktop
```

---

## API Base URL Structure

```
Production:  https://api.brothers-erp.com/api/v1
Development: http://localhost:5000/api/v1

Full URL example:
  GET  http://localhost:5000/api/v1/products
  POST http://localhost:5000/api/v1/auth/login
```

### API Response Format (Standard)
```json
// Success
{
  "success": true,
  "message": "Products fetched successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## User Login — 3-Way Authentication

Login supports **username OR email OR phone number** — user jeta diye o login korte parbe.

### Login Request
```
POST /api/v1/auth/login

Body:
{
  "login": "admin@brothers.com",   // username, email, or phone — anything works
  "password": "123456"
}
```

### Login Logic (Server Side)
```js
// auth.controller.js — login logic
const login = async (req, res) => {
  const { login, password } = req.body;

  // Step 1: Detect input type
  let query = {};
  if (login.includes('@')) {
    // Email
    query = { email: login.toLowerCase() };
  } else if (/^\d{11,15}$/.test(login)) {
    // Phone number (11-15 digits)
    query = { phone: login };
  } else {
    // Username
    query = { username: login.toLowerCase() };
  }

  // Step 2: Find user
  const user = await User.findOne(query).select('+password').populate('role').populate('branch');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Step 3: Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Step 4: Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Step 5: Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Step 6: Set cookie & respond
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, branch: user.branch },
      accessToken
    }
  });
};
```

### User Model (Updated)
```js
// models/User.js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false }
}, { timestamps: true });

// Indexes for fast login lookup
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
```

### Frontend Login Page Fields
```jsx
// pages/Auth/Login.jsx
<form onSubmit={handleLogin}>
  {/* User can type username, email, or phone — all in ONE input */}
  <input
    name="login"
    placeholder="Username, Email, or Phone Number"
    required
  />

  <input
    name="password"
    type="password"
    placeholder="Password"
    required
  />

  <button type="submit">Sign In</button>
</form>
```

---

## What You Need to Install

### Prerequisites
```
- Node.js 18+ (LTS)
- MongoDB 6+ (local or MongoDB Atlas)
- Git
- VS Code + extensions (ES7+ snippets, Prettier, ESLint)
- Postman or Thunder Client (API testing)
- npm or yarn or pnpm
```

### NPM Packages — Backend (`server/`)
```
Core:
  express           — Web framework
  mongoose          — MongoDB ODM
  cors              — Cross-origin requests
  dotenv            — Environment variables
  morgan            — HTTP request logger

Auth:
  jsonwebtoken      — JWT creation/verification
  bcryptjs          — Password hashing
  cookie-parser     — Cookie handling for refresh tokens

Validation:
  joi or zod        — Request body validation

File Upload:
  multer            — Multipart form handling
  cloudinary        — Cloud image storage (optional)

Email:
  nodemailer        — Send reset password emails

SMS (future):
  axios             — HTTP client for SMS Gateway API

Pagination & Filter:
  mongoose-paginate-v2 — Built-in pagination

Security:
  helmet            — Security headers
  express-rate-limit — Rate limiting
  mongo-sanitize    — NoSQL injection prevention

Utils:
  date-fns          — Date manipulation
  dotenv            — Env config
```

### NPM Packages — Frontend (`client/`)
```
Core:
  react             — UI library
  react-dom         — DOM rendering
  react-router-dom  — Client-side routing

State Management:
  zustand           — Lightweight global state

Server State:
  @tanstack/react-query  — API caching, refetching, mutations (MUST HAVE)

HTTP:
  axios             — API calls with interceptors

Table:
  ag-grid-react     — AG Grid React wrapper (ERP-grade table)
  ag-grid-community — Free tier features

Toast:
  sonner            — Toast notifications (better than react-toastify)

Skeleton:
  react-loading-skeleton — Loading states for all pages

UI:
  tailwindcss       — Utility-first CSS
  @headlessui/react — Accessible components
  (or antd / @mui/material)
  recharts          — Charts & graphs

Icons (Primary):
  lucide-react      — Main icon library (1000+ icons, clean, modern)

Icons (Supplementary — optional):
  react-icons       — Extra icons (Font Awesome, Material, etc.)
  @heroicons/react  — Heroicons (optional backup)

PDF & Print:
  jspdf             — Client-side PDF generation
  jspdf-autotable   — Tables in PDF (invoices)
  react-to-print    — Print invoices

Auth:
  jwt-decode        — Decode JWT on client

Sales & IMEI:
  react-qr-barcode-reader — Barcode/IMEI scanner
  react-webcam            — Camera for barcode scanning

Date:
  date-fns          — Date formatting

Excel:
  xlsx              — Export reports to Excel

Offline (MUST HAVE):
  workbox-window    — Service worker for offline sync
  idb               — IndexedDB wrapper (simpler API)

Responsive:
  tailwindcss       — Mobile-first responsive design
  @tailwindcss/forms — Form styling
```
  lucide-react      — Icons
  recharts          — Charts & graphs
  react-hook-form   — Form handling

PDF & Print:
  jspdf             — Client-side PDF
  jspdf-autotable   — Tables in PDF
  react-to-print    — Print invoices

Auth:
  jwt-decode        — Decode JWT on client

Invoice & Barcode/QR:
  jsbarcode         — Generate barcode for invoices
  qrcode            — Generate QR code for invoices

Sales & IMEI:
  react-qr-barcode-reader — Barcode/IMEI scanner
  react-webcam            — Camera for barcode scanning

Date:
  date-fns          — Date formatting

Excel:
  xlsx              — Export reports to Excel

Responsive:
  tailwindcss       — Mobile-first responsive design
  @tailwindcss/forms — Form styling
```

---

## Modules from PDF (Feature Checklist)

### Module 1: Inventory Control
- [ ] Product catalog (name, brand, model, category, specs)
- [ ] IMEI / Serial number tracking
- [ ] Multi-branch stock levels
- [ ] Stock transfer between branches
- [ ] Auto-reorder alerts
- [ ] Barcode / QR generation & printing

### Module 2: Sales Management
- [ ] Sales interface (scan IMEI, select customer, checkout)
- [ ] Invoice generation (PDF)
- [ ] Sales history & filters
- [ ] Returns & exchanges
- [ ] Discount & VAT/tax configuration
- [ ] ~~POS Master~~ (REMOVED — not in scope)

### Module 3: Purchase Management
- [ ] Supplier database
- [ ] Purchase orders
- [ ] Goods received notes (GRN)
- [ ] IMEI assignment on purchase

### Module 4: Accounting & Finance
- [ ] Income/expense tracking
- [ ] Balance sheet
- [ ] Profit & loss statement
- [ ] Due collection tracking
- [ ] Tax reporting (VAT/GST)

### Module 5: Customer Management (CRM)
- [ ] Customer profiles
- [ ] Purchase history per customer
- [ ] Due balance tracking
- [ ] Warranty tracking (per IMEI)

### Module 6: HR & Payroll
- [ ] Employee records
- [ ] Attendance (check-in/out with location)
- [ ] Leave management
- [ ] Salary processing
- [ ] Payslip generation (PDF)

### Module 7: Reporting & Analytics
- [ ] Sales reports (daily/weekly/monthly)
- [ ] Inventory valuation
- [ ] Top selling products
- [ ] Branch-wise comparison
- [ ] Export (PDF/Excel)

### Module 8: Multi-Branch & E-Commerce
- [ ] Branch management
- [ ] Role-based access per branch
- [ ] Online product catalog
- [ ] Order management

### Module 9: Security
- [ ] Role-based access control (RBAC)
- [ ] Audit logs
- [ ] Data backup
- [ ] Two-factor authentication

---

## Folder Structure

```
mobile-shop-erp/
├── client/                          # Vite + React Frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/                  # Images, logos, static files
│   │   │   ├── logo.png
│   │   │   ├── images/
│   │   │   └── icons/
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Topbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   └── AuthLayout.jsx
│   │   │   ├── ui/                 # Generic UI elements
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── PasswordInput.jsx   # Password with eye toggle
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Dropdown.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   ├── SearchInput.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   └── ThemeToggle.jsx    # Animated sun/moon toggle
│   │   │   ├── forms/              # Form components
│   │   │   │   ├── ProductForm.jsx
│   │   │   │   ├── SaleForm.jsx
│   │   │   │   ├── PurchaseForm.jsx
│   │   │   │   ├── CustomerForm.jsx
│   │   │   │   └── EmployeeForm.jsx
│   │   │   ├── charts/             # Chart components
│   │   │   │   ├── SalesChart.jsx
│   │   │   │   ├── InventoryChart.jsx
│   │   │   │   └── RevenueChart.jsx
│   │   │   └── sales/              # Sales components
│   │   │       ├── SalesCart.jsx
│   │   │       ├── ProductGrid.jsx
│   │   │       ├── IMEISelector.jsx
│   │   │       └── PaymentModal.jsx
│   │   │
│   │   ├── pages/                  # Route pages (one file per page)
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── Dashboard/
│   │   │   │   └── index.jsx       # Main dashboard
│   │   │   ├── Inventory/
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── ProductForm.jsx
│   │   │   │   ├── ProductDetail.jsx
│   │   │   │   ├── IMEITracker.jsx
│   │   │   │   ├── StockOverview.jsx
│   │   │   │   └── StockTransfer.jsx
│   │   │   ├── Sales/
│   │   │   │   ├── SalesList.jsx
│   │   │   │   ├── SalesForm.jsx
│   │   │   │   ├── InvoiceDetail.jsx
│   │   │   │   └── Returns.jsx
│   │   │   ├── Purchase/
│   │   │   │   ├── SupplierList.jsx
│   │   │   │   ├── SupplierForm.jsx
│   │   │   │   ├── PurchaseOrders.jsx
│   │   │   │   ├── PurchaseOrderForm.jsx
│   │   │   │   └── GRN.jsx
│   │   │   ├── Accounting/
│   │   │   │   ├── ChartOfAccounts.jsx
│   │   │   │   ├── JournalEntries.jsx
│   │   │   │   ├── BalanceSheet.jsx
│   │   │   │   ├── ProfitLoss.jsx
│   │   │   │   └── TaxReport.jsx
│   │   │   ├── HR/
│   │   │   │   ├── EmployeeList.jsx
│   │   │   │   ├── EmployeeForm.jsx
│   │   │   │   ├── Attendance.jsx
│   │   │   │   ├── LeaveManagement.jsx
│   │   │   │   ├── Payroll.jsx
│   │   │   │   └── Payslip.jsx
│   │   │   ├── CRM/
│   │   │   │   ├── CustomerList.jsx
│   │   │   │   ├── CustomerForm.jsx
│   │   │   │   ├── CustomerDetail.jsx
│   │   │   │   └── DueCollection.jsx
│   │   │   ├── Wholesale/
│   │   │   │   ├── WholesaleOrders.jsx
│   │   │   │   ├── WholesaleOrderForm.jsx
│   │   │   │   ├── WholesalePriceList.jsx
│   │   │   │   └── WholesaleCustomers.jsx
│   │   │   ├── Warranty/
│   │   │   │   ├── WarrantyClaims.jsx
│   │   │   │   ├── WarrantyClaimForm.jsx
│   │   │   │   └── WarrantyReport.jsx
│   │   │   ├── Returns/
│   │   │   │   ├── ReturnList.jsx
│   │   │   │   ├── ReturnForm.jsx
│   │   │   │   └── ReturnReport.jsx
│   │   │   ├── Reports/
│   │   │   │   ├── SalesReport.jsx
│   │   │   │   ├── InventoryReport.jsx
│   │   │   │   ├── BranchReport.jsx
│   │   │   │   └── DailyReport.jsx
│   │   │   └── Settings/
│   │   │       ├── BranchSettings.jsx
│   │   │       ├── UserRoles.jsx
│   │   │       └── CompanySettings.jsx
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useApi.js
│   │   │   ├── usePagination.js
│   │   │   ├── useDebounce.js
│   │   │   └── useSocket.js
│   │   │
│   │   ├── services/               # API calls (Axios)
│   │   │   ├── api.js              # Axios instance + interceptors
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── product.service.js
│   │   │   ├── imei.service.js
│   │   │   ├── stock.service.js
│   │   │   ├── sales.service.js
│   │   │   ├── purchase.service.js
│   │   │   ├── supplier.service.js
│   │   │   ├── customer.service.js
│   │   │   ├── employee.service.js
│   │   │   ├── payroll.service.js
│   │   │   ├── accounting.service.js
│   │   │   ├── report.service.js
│   │   │   └── notification.service.js
│   │   │
│   │   ├── store/                  # Zustand stores
│   │   │   ├── authStore.js
│   │   │   ├── productStore.js
│   │   │   ├── salesStore.js       # Sales cart state
│   │   │   ├── stockStore.js
│   │   │   └── uiStore.js          # Sidebar, theme, modals
│   │   │
│   │   ├── context/                # React Context
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── utils/                  # Helper functions
│   │   │   ├── constants.js        # API URLs, roles, statuses
│   │   │   ├── formatters.js       # Currency, date, number
│   │   │   ├── validators.js       # Form validation helpers
│   │   │   └── helpers.js          # Misc utilities
│   │   │   └── EventEmitter.js     # Browser EventEmitter (real-time)
│   │   │
│   │   ├── routes/                 # Route definitions
│   │   │   ├── AppRoutes.jsx       # All routes
│   │   │   ├── ProtectedRoute.jsx  # Auth guard
│   │   │   └── RoleBasedRoute.jsx  # Role guard
│   │   │
│   │   ├── App.jsx                 # Root component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles + Tailwind
│   │
│   ├── .env.example
│   ├── .env
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Node.js + Express Backend
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   ├── env.config.js        # Environment variables validation
│   │   │   ├── db.config.js         # MongoDB connection
│   │   │   ├── cors.config.js       # CORS options
│   │   │   ├── jwt.config.js        # JWT secret, expiry
│   │   │   └── email.config.js      # Nodemailer setup
│   │   │
│   │   ├── modules/                 # MODULE-BASED ARCHITECTURE
│   │   │   ├── auth/                # Authentication module
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   └── auth.validator.js
│   │   │   ├── user/                # User management module
│   │   │   │   ├── user.model.js
│   │   │   │   ├── user.routes.js
│   │   │   │   ├── user.controller.js
│   │   │   │   ├── user.service.js
│   │   │   │   └── user.validator.js
│   │   │   ├── branch/              # Branch management module
│   │   │   │   ├── branch.model.js
│   │   │   │   ├── branch.routes.js
│   │   │   │   ├── branch.controller.js
│   │   │   │   ├── branch.service.js
│   │   │   │   └── branch.validator.js
│   │   │   ├── product/             # Product management module
│   │   │   │   ├── product.model.js
│   │   │   │   ├── product.routes.js
│   │   │   │   ├── product.controller.js
│   │   │   │   ├── product.service.js
│   │   │   │   └── product.validator.js
│   │   │   ├── imei/                # IMEI tracking module
│   │   │   │   ├── imei.model.js
│   │   │   │   ├── imei.routes.js
│   │   │   │   ├── imei.controller.js
│   │   │   │   ├── imei.service.js
│   │   │   │   └── imei.validator.js
│   │   │   ├── stock/               # Stock management module
│   │   │   │   ├── stock.model.js
│   │   │   │   ├── stockTransfer.model.js
│   │   │   │   ├── stock.routes.js
│   │   │   │   ├── stock.controller.js
│   │   │   │   ├── stock.service.js
│   │   │   │   └── stock.validator.js
│   │   │   ├── sale/                # Sales & invoicing module
│   │   │   │   ├── sale.model.js
│   │   │   │   ├── saleItem.model.js
│   │   │   │   ├── invoice.model.js
│   │   │   │   ├── payment.model.js
│   │   │   │   ├── sale.routes.js
│   │   │   │   ├── sale.controller.js
│   │   │   │   ├── sale.service.js
│   │   │   │   └── sale.validator.js
│   │   │   ├── purchase/            # Purchase order module
│   │   │   │   ├── purchaseOrder.model.js
│   │   │   │   ├── purchaseItem.model.js
│   │   │   │   ├── purchase.routes.js
│   │   │   │   ├── purchase.controller.js
│   │   │   │   ├── purchase.service.js
│   │   │   │   └── purchase.validator.js
│   │   │   ├── supplier/            # Supplier management module
│   │   │   │   ├── supplier.model.js
│   │   │   │   ├── supplier.routes.js
│   │   │   │   ├── supplier.controller.js
│   │   │   │   ├── supplier.service.js
│   │   │   │   └── supplier.validator.js
│   │   │   ├── customer/            # Customer management module
│   │   │   │   ├── customer.model.js
│   │   │   │   ├── customerDue.model.js
│   │   │   │   ├── customer.routes.js
│   │   │   │   ├── customer.controller.js
│   │   │   │   ├── customer.service.js
│   │   │   │   └── customer.validator.js
│   │   │   ├── employee/            # Employee management module
│   │   │   │   ├── employee.model.js
│   │   │   │   ├── employee.routes.js
│   │   │   │   ├── employee.controller.js
│   │   │   │   ├── employee.service.js
│   │   │   │   └── employee.validator.js
│   │   │   ├── attendance/          # Attendance tracking module
│   │   │   │   ├── attendance.model.js
│   │   │   │   ├── attendance.routes.js
│   │   │   │   ├── attendance.controller.js
│   │   │   │   └── attendance.service.js
│   │   │   ├── leave/               # Leave management module
│   │   │   │   ├── leave.model.js
│   │   │   │   ├── leave.routes.js
│   │   │   │   ├── leave.controller.js
│   │   │   │   └── leave.service.js
│   │   │   ├── payroll/             # Payroll & payslip module
│   │   │   │   ├── payroll.model.js
│   │   │   │   ├── payroll.routes.js
│   │   │   │   ├── payroll.controller.js
│   │   │   │   └── payroll.service.js
│   │   │   ├── accounting/          # Accounting & finance module
│   │   │   │   ├── account.model.js
│   │   │   │   ├── journalEntry.model.js
│   │   │   │   ├── expense.model.js
│   │   │   │   ├── accounting.routes.js
│   │   │   │   ├── accounting.controller.js
│   │   │   │   ├── accounting.service.js
│   │   │   │   └── accounting.validator.js
│   │   │   ├── warranty/            # Warranty tracking module
│   │   │   │   ├── warranty.model.js
│   │   │   │   ├── warranty.routes.js
│   │   │   │   ├── warranty.controller.js
│   │   │   │   └── warranty.service.js
│   │   │   ├── wholesale/           # Wholesale management module
│   │   │   │   ├── wholesalePrice.model.js
│   │   │   │   ├── wholesaleOrder.model.js
│   │   │   │   ├── wholesale.routes.js
│   │   │   │   ├── wholesale.controller.js
│   │   │   │   ├── wholesale.service.js
│   │   │   │   └── wholesale.validator.js
│   │   │   ├── asset/               # Asset management module
│   │   │   │   ├── asset.model.js
│   │   │   │   ├── asset.routes.js
│   │   │   │   ├── asset.controller.js
│   │   │   │   └── asset.service.js
│   │   │   ├── manufacturing/       # Manufacturing & BOM module
│   │   │   │   ├── manufacturingOrder.model.js
│   │   │   │   ├── bom.model.js
│   │   │   │   ├── manufacturing.routes.js
│   │   │   │   ├── manufacturing.controller.js
│   │   │   │   └── manufacturing.service.js
│   │   │   ├── notification/        # Notification module
│   │   │   │   ├── notification.model.js
│   │   │   │   ├── notification.routes.js
│   │   │   │   ├── notification.controller.js
│   │   │   │   └── notification.service.js
│   │   │   └── report/              # Reporting module
│   │   │       ├── report.routes.js
│   │   │       ├── report.controller.js
│   │   │       └── report.service.js
│   │   │
│   │   ├── middleware/              # Global middleware
│   │   │   ├── auth.middleware.js       # JWT verification
│   │   │   ├── role.middleware.js       # Role-based access
│   │   │   ├── validate.middleware.js   # Request validation
│   │   │   ├── errorHandler.middleware.js # Global error handler
│   │   │   ├── upload.middleware.js     # Multer config
│   │   │   └── rateLimiter.middleware.js # Rate limiting
│   │   │
│   │   ├── utils/                  # Shared utilities
│   │   │   ├── ApiError.js         # Custom error class
│   │   │   ├── ApiResponse.js      # Standard response format
│   │   │   ├── generateToken.js    # JWT helpers
│   │   │   ├── invoiceGenerator.js # PDF invoice generation
│   │   │   ├── emailSender.js      # Nodemailer wrapper
│   │   │   ├── pagination.js       # Pagination helper
│   │   │   ├── validators.js       # Common validation
│   │   │   ├── constants.js        # App constants
│   │   │   └── eventEmitter.js     # Node.js EventEmitter (real-time)
│   │   │
│   │   ├── events/                  # Event handlers (real-time updates)
│   │   │   ├── stock.events.js     # Stock updated events
│   │   │   ├── sale.events.js      # Sale completed events
│   │   │   └── index.js            # Event registry
│   │   │
│   │   └── app.js                  # Express app setup
│   │
│   ├── uploads/                    # Local file uploads (gitignored)
│   │   ├── images/
│   │   ├── invoices/
│   │   └── reports/
│   │
│   ├── scripts/                    # Utility scripts
│   │   ├── seed.js                 # Database seed
│   │   └── backup.js               # Backup script
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js                   # Entry point
│
├── .gitignore
├── docker-compose.yml
├── package.json                      # Root (scripts for both)
└── PROJECT-SPEC.md
```

---

## Database Schemas (MongoDB/Mongoose)

### User
```js
{
  name: String,
  username: String (unique, indexed),      // login e accept korbe
  email: String (unique, indexed),         // login e accept korbe
  phone: String (unique, indexed),         // login e accept korbe
  password: String (hashed, select: false),
  role: ObjectId (ref: Role),
  branch: ObjectId (ref: Branch),
  avatar: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  refreshToken: String (select: false),
  passwordResetToken: String (select: false),
  passwordResetExpires: Date (select: false),
  createdAt, updatedAt
}
// Note: username, email, phone — 3 ta unique + indexed for fast login
```

### Role
```js
{
  name: String (admin, manager, operator, accountant),
  permissions: [String],
  createdAt, updatedAt
}
```

### Branch
```js
{
  name: String,
  address: String,
  phone: String,
  manager: ObjectId (ref: User),
  isActive: Boolean,
  createdAt, updatedAt
}
```

### Product
```js
{
  name: String,
  sku: String (unique),
  barcode: String,
  category: ObjectId (ref: Category),
  brand: ObjectId (ref: Brand),
  model: String,
  description: String,
  costPrice: Number,
  sellingPrice: Number,
  vatRate: Number,
  unit: String,
  image: String,
  isActive: Boolean,
  createdAt, updatedAt
}
```

### IMEI
```js
{
  imeiNumber: String (unique),
  product: ObjectId (ref: Product),
  branch: ObjectId (ref: Branch),
  status: String (available, sold, returned, defective, transferred),
  purchasePrice: Number,
  sellingPrice: Number,
  supplier: ObjectId (ref: Supplier),
  sale: ObjectId (ref: Sale),
  warrantyExpiry: Date,
  createdAt, updatedAt
}
```

### Stock
```js
{
  product: ObjectId (ref: Product),
  branch: ObjectId (ref: Branch),
  quantity: Number,
  reservedQuantity: Number,
  reorderLevel: Number,
  updatedAt
}
```

### Sale
```js
{
  invoiceNumber: String (unique),
  branch: ObjectId (ref: Branch),
  customer: ObjectId (ref: Customer),
  items: [{
    product: ObjectId,
    imei: ObjectId,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    vat: Number,
    total: Number
  }],
  subtotal: Number,
  totalDiscount: Number,
  totalVat: Number,
  grandTotal: Number,
  paidAmount: Number,
  dueAmount: Number,
  paymentMethod: String (cash, card, bkash, nagad, rocket),
  status: String (completed, returned, cancelled),
  createdBy: ObjectId (ref: User),
  createdAt, updatedAt
}
```

### PurchaseOrder
```js
{
  orderNumber: String (unique),
  supplier: ObjectId (ref: Supplier),
  branch: ObjectId (ref: Branch),
  items: [{
    product: ObjectId,
    quantity: Number,
    unitCost: Number,
    total: Number
  }],
  totalAmount: Number,
  status: String (pending, partial, received, cancelled),
  expectedDate: Date,
  receivedDate: Date,
  createdBy: ObjectId,
  createdAt, updatedAt
}
```

### Customer
```js
{
  name: String,
  phone: String (unique),
  email: String,
  address: String,
  totalDue: Number,
  totalPurchase: Number,
  createdAt, updatedAt
}
```

### Employee
```js
{
  user: ObjectId (ref: User),
  employeeId: String (unique),
  designation: String,
  department: String,
  branch: ObjectId (ref: Branch),
  salary: Number,
  joiningDate: Date,
  emergencyContact: String,
  createdAt, updatedAt
}
```

### Attendance
```js
{
  employee: ObjectId (ref: Employee),
  date: Date,
  checkIn: Date,
  checkOut: Date,
  location: { lat: Number, lng: Number },
  status: String (present, absent, late, half-day),
  createdAt, updatedAt
}
```

---

## API Endpoints

> **Base URL:** `http://localhost:5000/api/v1`

### Auth
```
POST   /api/v1/auth/login              { login, password }
POST   /api/v1/auth/logout             (requires accessToken)
POST   /api/v1/auth/refresh-token      { refreshToken }
POST   /api/v1/auth/forgot-password    { email }
POST   /api/v1/auth/reset-password/:token  { password, confirmPassword }
GET    /api/v1/auth/me                 (requires accessToken)
```

### Users
```
GET    /api/v1/users              ?page=&limit=&search=&role=&branch=
POST   /api/v1/users              { name, username, email, phone, password, role, branch }
GET    /api/v1/users/:id
PUT    /api/v1/users/:id          { name, email, phone, role, branch, isActive }
DELETE /api/v1/users/:id
```

### Products
```
GET    /api/v1/products           ?page=&limit=&search=&category=&brand=&branch=
POST   /api/v1/products           { name, sku, category, brand, model, costPrice, sellingPrice, vatRate, ... }
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/products/:id/imei
POST   /api/v1/products/import        (CSV/Excel upload)
GET    /api/v1/products/export
```

### IMEI
```
GET    /api/v1/imei               ?status=&branch=&product=
POST   /api/v1/imei               { imeiNumber, product, branch, purchasePrice, supplier, ... }
PUT    /api/v1/imei/:id           { status, sellingPrice, ... }
GET    /api/v1/imei/:imeiNumber
```

### Stocks
```
GET    /api/v1/stocks             ?branch=&product=&lowStock=true
POST   /api/v1/stocks/transfer    { fromBranch, toBranch, items: [{ product, quantity }] }
GET    /api/v1/stocks/transfers   ?branch=&status=
PUT    /api/v1/stocks/transfers/:id/approve
```

### Sales
```
GET    /api/v1/sales              ?branch=&from=&to=&status=&customer=&page=&limit=
POST   /api/v1/sales              { customer, items: [{ product, imei, quantity, unitPrice }], paymentMethod, ... }
GET    /api/v1/sales/:id
GET    /api/v1/sales/:id/invoice  (PDF download)
POST   /api/v1/sales/:id/return   { items: [{ saleItem, quantity, reason }] }
```

### Purchases
```
GET    /api/v1/purchases          ?branch=&supplier=&status=&page=&limit=
POST   /api/v1/purchases          { supplier, branch, items: [{ product, quantity, unitCost }] }
GET    /api/v1/purchases/:id
POST   /api/v1/purchases/:id/receive   { items: [{ product, imeiNumbers: [...] }] }
GET    /api/v1/purchases/:id/grn       (PDF download)
```

### Suppliers
```
GET    /api/v1/suppliers          ?search=&page=&limit=
POST   /api/v1/suppliers          { name, phone, email, address, ... }
PUT    /api/v1/suppliers/:id
DELETE /api/v1/suppliers/:id
GET    /api/v1/suppliers/:id/history   ?from=&to=
```

### Customers
```
GET    /api/v1/customers          ?search=&page=&limit=
POST   /api/v1/customers          { name, phone, email, address }
PUT    /api/v1/customers/:id
GET    /api/v1/customers/:id/history
POST   /api/v1/customers/:id/collect-due  { amount, paymentMethod }
```

### Employees
```
GET    /api/v1/employees          ?branch=&search=&page=&limit=
POST   /api/v1/employees          { userId, employeeId, designation, department, branch, salary, ... }
PUT    /api/v1/employees/:id
GET    /api/v1/employees/:id/attendance  ?from=&to=
POST   /api/v1/attendance/check-in   { employeeId, location: { lat, lng } }
POST   /api/v1/attendance/check-out  { employeeId, location: { lat, lng } }
GET    /api/v1/attendance/report      ?employee=&branch=&from=&to=
```

### Payroll
```
GET    /api/v1/payroll            ?branch=&month=&year=&page=
POST   /api/v1/payroll/process    { employeeIds, month, year }
GET    /api/v1/payroll/:id/payslip     (PDF download)
```

### Accounting
```
GET    /api/v1/accounts           ?type=&page=
POST   /api/v1/accounts           { name, type, code, parentAccount }
GET    /api/v1/journal-entries     ?from=&to=&account=&page=
POST   /api/v1/journal-entries     { entries: [{ account, debit, credit, description }] }
GET    /api/v1/reports/balance-sheet   ?asOf=&branch=
GET    /api/v1/reports/profit-loss     ?from=&to=&branch=
GET    /api/v1/reports/trial-balance   ?asOf=&branch=
```

### Reports
```
GET    /api/v1/reports/sales-summary      ?from=&to=&branch=
GET    /api/v1/reports/inventory-valuation ?branch=&category=
GET    /api/v1/reports/top-products       ?from=&to=&limit=&branch=
GET    /api/v1/reports/branch-performance ?from=&to=
GET    /api/v1/reports/daily-sales        ?date=&branch=
GET    /api/v1/reports/export/sales       ?from=&to=&branch=&format=pdf|excel
GET    /api/v1/reports/export/inventory   ?branch=&format=pdf|excel
```

### Warranty
```
GET    /api/v1/warranties              ?status=&branch=&expiringSoon=true
POST   /api/v1/warranties              { imei, customer, claimType, description }
GET    /api/v1/warranties/:id
PUT    /api/v1/warranties/:id          { status, resolution, ... }
GET    /api/v1/warranties/claim/:imei  (warranty info for IMEI)
```

### Wholesale
```
GET    /api/v1/wholesale/prices        ?product=&tier=
POST   /api/v1/wholesale/prices        { product, minQty, price, tier }
PUT    /api/v1/wholesale/prices/:id
GET    /api/v1/wholesale/orders        ?customer=&status=&page=
POST   /api/v1/wholesale/orders        { customer, items: [{ product, quantity, unitPrice }] }
GET    /api/v1/wholesale/orders/:id
PUT    /api/v1/wholesale/orders/:id    { status, ... }
```

### Settings
```
GET    /api/v1/branches
POST   /api/v1/branches            { name, address, phone, managerId }
PUT    /api/v1/branches/:id
GET    /api/v1/settings
PUT    /api/v1/settings            { companyName, vatRate, currency, ... }
```

### Notifications
```
GET    /api/v1/notifications        ?unread=true&page=
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/read-all
```

---

## Real-time Events (Native EventEmitter)

```
Server-side (Node.js EventEmitter):
  emitter.emit('stock:updated', { branch, product, quantity })
  emitter.emit('sale:completed', { invoiceId, branch, total })
  emitter.emit('notification:new', { type, message, userId })

Client-side (Browser EventEmitter):
  emitter.on('stock:updated', (data) => { updateStockUI(data) })
  emitter.on('sale:completed', (data) => { refreshSalesList(data) })
  emitter.on('notification:new', (data) => { showToast(data) })

Events List:
  stock:updated        → Stock level changed
  sale:completed       → New sale in branch
  notification:new     → Low stock, due reminder
  attendance:checked   → Employee checked in/out
  user:created         → New user added
  user:updated         → User profile updated
```

---

## Offline/Online Sync (MUST HAVE!)

```
Service Worker + IndexedDB:
  - Cache API responses (products, stock, customers)
  - Queue offline actions (sales, attendance, IMEI check)
  - Sync when back online
  - Show offline indicator in topbar
  - Conflict resolution (last write wins)
  - Queue retry on failure

IndexedDB Collections:
  - products (cached — read offline)
  - stock (cached — read offline)
  - customers (cached — read offline)
  - pendingSales (queued — sync later)
  - pendingAttendance (queued — sync later)
  - pendingIMEIChecks (queued — sync later)

Offline Features:
  ✅ View product list offline
  ✅ View stock levels offline
  ✅ View customer list offline
  ✅ Create sale offline (queue for sync)
  ✅ Check IMEI status offline (if cached)
  ✅ Record attendance offline (queue for sync)

Flow:
  1. User performs action offline
  2. Action saved to IndexedDB queue
  3. Queue badge shown in UI (with count)
  4. When online → sync queue → clear IndexedDB
  5. If sync fails → retry with exponential backoff
  6. Show success/error toast after sync

npm packages:
  workbox-window    — Service worker for offline sync
  idb               — IndexedDB wrapper (simpler API)
```

---

## Development Phases (Timeline)

### Phase 1: Foundation (Week 1–2)
- Project setup (Vite + Express + MongoDB)
- Auth system (login, JWT, roles)
- Dashboard layout (sidebar, topbar)
- User management CRUD

### Phase 2: Inventory (Week 3–5)
- Product CRUD
- IMEI tracking
- Stock management
- Stock transfer

### Phase 3: Sales & Invoicing (Week 5–8)
- Sales screen (IMEI scan, customer select, checkout)
- Invoice generation (PDF)
- Returns & exchanges
- Sales history & filters
- ~~POS Master~~ (REMOVED)

### Phase 4: Purchase (Week 8–10)
- Supplier management
- Purchase orders
- GRN
- Stock auto-update

### Phase 5: Accounting (Week 10–13)
- Chart of accounts
- Journal entries
- Balance sheet, P&L
- Tax reports

### Phase 6: HR & Payroll (Week 13–16)
- Employee CRUD
- Attendance
- Leave management
- Salary + Payslip

### Phase 7: CRM (Week 16–18)
- Customer profiles
- Due tracking
- Warranty tracking

### Phase 8: Reporting (Week 18–20)
- All report pages
- Charts & analytics
- PDF/Excel export

### Phase 9: Multi-Branch & E-Commerce (Week 20–22)
- Branch management
- Online catalog
- Payment gateway

### Phase 10: Security & Deploy (Week 22–24)
- 2FA, audit logs
- Backup system
- Docker deployment
- UAT & Go-Live

---

*Last updated: 2026-07-20*
*Status: Spec Ready — Awaiting Client Confirmation to Start*
*Deadline: 25 DAYS from kickoff*
*Stack: Vite + React (JS) + Node.js/Express + MongoDB*
*Icons: Lucide React (primary) + React Icons (supplementary)*
*Changes: POS Master REMOVED | Fully Responsive | Mobile-First | AG Grid | TanStack Query | Sonner | Skeleton | Native Events | Offline Sync (MUST HAVE) | Wholesale | Warranty | Returns | Dark/Light Mode | Invoice 4 Sizes | Barcode + QR Code | Performance Top-Level*
