/**
 * Shared branch scoping utilities.
 *
 * Usage (direct):
 *   import { applyBranchScope } from '../../utils/branchScope.js';
 *   applyBranchScope(query, branchId);
 *   applyBranchScope(query, branchId, 'from_branch_id');
 *
 * Usage (closure style, matching report.routes.js pattern):
 *   import { getBranchScopeFn } from '../../utils/branchScope.js';
 *   const applyBranch = getBranchScopeFn(req.selectedBranchId);
 *   applyBranch(query);
 *   applyBranch(query, 'from_branch_id');
 */

/**
 * Applies branch_id filtering to a Knex query builder instance.
 * No-ops when branchId is null/undefined so it is safe to call unconditionally.
 *
 * @param {import('knex').Knex.QueryBuilder} query
 * @param {string|number|null} branchId
 * @param {string} [column='branch_id']
 */
export function applyBranchScope(query, branchId, column = 'branch_id') {
  if (branchId) {
    query.where(column, branchId);
  }
}

/**
 * Returns a reusable scoping function bound to the given branchId.
 * Matches the closure style used in report.routes.js.
 *
 * @param {string|number|null} branchId
 * @returns {(query: import('knex').Knex.QueryBuilder, column?: string) => void}
 */
export function getBranchScopeFn(branchId) {
  return (query, column = 'branch_id') => {
    if (branchId) {
      query.where(column, branchId);
    }
  };
}
