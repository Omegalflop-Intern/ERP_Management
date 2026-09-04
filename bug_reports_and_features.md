# System Bug Reports & Feature Modification Requirements

This document summarizes the reported bugs and requested system modifications based on user input and notes.

---

## 1. System Modifications & Feature Changes (Features / Refactoring)

1. **Remove Wildcard Section / Domain Configuration**
   - **Requirement:** Completely remove the wildcard section.
   - **Reasoning:** Session and application conflicts are occurring due to domain wildcard setups.

2. **Simplify Outlet Management (Single Store Model)**
   - **Requirement:** Remove the multiple-outlet functionality.
   - **Reasoning:** The system should operate solely for a single main shop. *(Note: Resolves notebook Bug #6 regarding multi-outlet selection).*

3. **Consolidate Employee & User Creation**
   - **Requirement:** Merge user creation and employee creation into a single unified option/interface.
   - **Employee Management Page:** Should exclusively serve to display the list of active employees.
   - **Attendance Tracking:** Implement **Check-in** and **Check-out** functionality for employee attendance management.

---

## 2. Reported Bugs (Bug Reports)

### Bug 1: Manual Product Entry Validation Failure
* **Description:** Adding a product manually via "Add Manually" during a new product entry and attempting to sell it results in a `Validation Failed` error.

### Bug 2: Retail Customer Due Amount Missing in Dashboard
* **Description:** When sales are made on credit / due (`বাকিতে sell`), calculations work properly in the backend, but the overall due amount is not reflected in the Dashboard summary.

### Bug 3: Newly Added Stock Not Showing in New Sale
* **Description:** Adding a new product via the **Product and Stock Page** successfully registers the item, but it fails to appear or render under the **New Sale** item selection/search.

### Bug 4: Retail Due vs. B2B Dealer Due Discrepancy on Dashboard
* **Description:** Due amounts for normal retail customers are shown across other sections but are omitted from the Dashboard. The Dashboard currently only reflects due balances for B2B Dealers.

### Bug 5: Normal Retail Customer Module Malfunction
* **Description:** While the **Customer Section** for B2B Dealers functions as expected (handling credit/due purchases, payment completions, and sales), transactions involving normal retail customers do not process or function properly.

---

> **Note on Bugs 2, 3 & 4:** These issues specifically apply when performing transactions with **Retail / New Customers** on the Sale Page.
