import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatEmployee(row, userRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    user: userRow ? {
      _id: String(userRow.id),
      id: userRow.id,
      username: userRow.username,
      email: userRow.email,
    } : (row.user_id ? String(row.user_id) : null),
    userId: row.user_id,
    employeeId: row.employee_id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    designation: row.designation,
    department: row.department,
    branch: row.branch || 'Main',
    salary: Number(row.salary || 0),
    joiningDate: row.joining_date,
    emergencyContact: row.emergency_contact || '',
    address: row.address || '',
    bloodGroup: row.blood_group || '',
    nidNumber: row.nid_number || '',
    isActive: Boolean(row.is_active),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where((b) => {
      b.where('employees.tenant_id', tenantId).orWhereNull('employees.tenant_id');
    });
  }
}

function mapRoleToDepartment(roleName) {
  const r = String(roleName || '').toUpperCase();
  if (r.includes('ADMIN') || r.includes('OWNER') || r.includes('MANAGER')) return 'Management';
  if (r.includes('SALES') || r.includes('CASHIER') || r.includes('POS')) return 'Sales';
  if (r.includes('TECH') || r.includes('REPAIR') || r.includes('SERVICE')) return 'Service';
  if (r.includes('ACCOUNT') || r.includes('AUDIT') || r.includes('FINANCE')) return 'Accounts';
  if (r.includes('STOCK') || r.includes('INVENTORY') || r.includes('WAREHOUSE')) return 'Inventory';
  return 'General';
}

export const syncUserToEmployee = async (userId, userData = null, tenantId = null) => {
  try {
    const uId = Number(userId);
    if (!uId || isNaN(uId)) return null;

    let user = userData;
    if (!user || !user.username) {
      user = await db('users')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .leftJoin('branches', 'users.branch_id', 'branches.id')
        .where({ 'users.id': uId })
        .select(
          'users.*',
          'roles.name as role_name_val',
          'branches.name as branch_name_val'
        )
        .first();
    }
    if (!user) return null;

    const tId = tenantId || user.tenant_id || user.tenantId || null;
    const bId = user.branch_id || user.branchId || null;
    const roleName = user.role_name || user.role_name_val || (typeof user.role === 'object' ? user.role?.name : user.role) || 'STAFF';
    const department = mapRoleToDepartment(roleName);
    const designation = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
    const branchName = user.branch_name_val || (typeof user.branch === 'object' ? user.branch?.name : user.branch) || 'Main';
    const empCode = `EMP-${tId ? tId + '-' : ''}${String(uId).padStart(4, '0')}`;
    const name = user.full_name || user.fullName || user.username || 'Employee';
    const email = user.email || null;
    const phone = user.phone || `01700${String(uId).padStart(6, '0')}`;

    const existingEmp = await db('employees').where({ user_id: uId }).first();

    if (existingEmp) {
      await db('employees')
        .where({ id: existingEmp.id })
        .update({
          name,
          email,
          phone: existingEmp.phone || phone,
          designation: existingEmp.designation || designation,
          department: existingEmp.department || department,
          branch: branchName,
          branch_id: bId || existingEmp.branch_id,
          tenant_id: tId || existingEmp.tenant_id,
          is_active: user.is_active !== undefined ? Boolean(user.is_active) : true,
          is_deleted: false,
          updated_at: new Date(),
        });
      return getEmployeeById(existingEmp.id, tId);
    } else {
      let finalEmpCode = empCode;
      let counter = 1;
      while (await db('employees').where({ employee_id: finalEmpCode }).first()) {
        finalEmpCode = `${empCode}-${counter++}`;
      }

      const [insertedId] = await db('employees').insert({
        tenant_id: tId,
        branch_id: bId,
        user_id: uId,
        employee_id: finalEmpCode,
        name,
        phone,
        email,
        designation,
        department,
        branch: branchName,
        salary: user.salary || 0,
        joining_date: user.created_at ? new Date(user.created_at) : new Date(),
        is_active: user.is_active !== undefined ? Boolean(user.is_active) : true,
        is_deleted: false,
      });
      return getEmployeeById(insertedId, tId);
    }
  } catch (err) {
    console.error(`[SYNC-EMPLOYEE] Failed to sync user ${userId} to employee:`, err.message);
    return null;
  }
};

export const getAllEmployees = async (page = 1, limit = 20, search = '', branch = '', tenantId = null, branchId = null) => {
  // Auto-sync any existing tenant users who are not yet in employees
  try {
    const userQuery = db('users')
      .leftJoin('employees', 'users.id', 'employees.user_id')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('branches', 'users.branch_id', 'branches.id')
      .where('users.is_deleted', false)
      .whereNull('employees.id')
      .select(
        'users.*',
        'roles.name as role_name_val',
        'branches.name as branch_name_val'
      );
    if (tenantId) {
      userQuery.where('users.tenant_id', tenantId);
    }
    const unsyncedUsers = await userQuery.limit(50);
    for (const u of unsyncedUsers) {
      await syncUserToEmployee(u.id, u, tenantId);
    }
  } catch (e) {
    // Non-blocking sync
  }

  const countQuery = db('employees').where('employees.is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (branch) countQuery.where('employees.branch', branch);
  if (branchId) countQuery.where('employees.branch_id', branchId);

  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('employee_id', 'like', term)
        .orWhere('designation', 'like', term)
        .orWhere('department', 'like', term);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('employees')
    .leftJoin('users', 'employees.user_id', 'users.id')
    .where('employees.is_deleted', false)
    .select(
      'employees.*',
      'users.id as u_id',
      'users.username as u_username',
      'users.email as u_email'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branch) dataQuery.where('employees.branch', branch);
  if (branchId) dataQuery.where('employees.branch_id', branchId);

  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('employees.name', 'like', term)
        .orWhere('employees.phone', 'like', term)
        .orWhere('employees.employee_id', 'like', term)
        .orWhere('employees.designation', 'like', term)
        .orWhere('employees.department', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('employees.created_at', 'desc').limit(limit).offset(offset);

  const employees = rows.map((row) => {
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username, email: row.u_email } : null;
    return formatEmployee(row, uRow);
  });

  return { employees, pagination: getPagination(total, page, limit) };
};

export const getEmployeeById = async (id, tenantId = null, branchId = null) => {
  const dataQuery = db('employees')
    .leftJoin('users', 'employees.user_id', 'users.id')
    .where({ 'employees.id': id, 'employees.is_deleted': false })
    .select(
      'employees.*',
      'users.id as u_id',
      'users.username as u_username',
      'users.email as u_email'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where('employees.branch_id', branchId);

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Employee not found');

  const uRow = row.u_id ? { id: row.u_id, username: row.u_username, email: row.u_email } : null;
  return formatEmployee(row, uRow);
};

export const createEmployee = async (data, tenantId = null) => {
  const existingIdQuery = db('employees').where({ employee_id: data.employeeId, is_deleted: false });
  applyTenantScope(existingIdQuery, tenantId);
  if (await existingIdQuery.first()) throw ApiError.conflict('Employee ID already exists');

  const existingPhoneQuery = db('employees').where({ phone: data.phone, is_deleted: false });
  applyTenantScope(existingPhoneQuery, tenantId);
  if (await existingPhoneQuery.first()) throw ApiError.conflict('Employee with this phone already exists');

  const [insertedId] = await db('employees').insert({
    tenant_id: tenantId || data.tenantId || null,
    branch_id: data.branchId || null,
    user_id: data.user || data.userId || 1,
    employee_id: data.employeeId,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    designation: data.designation,
    department: data.department,
    branch: data.branch || 'Main',
    salary: data.salary || 0,
    joining_date: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    emergency_contact: data.emergencyContact || null,
    address: data.address || null,
    blood_group: data.bloodGroup || '',
    nid_number: data.nidNumber || null,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    is_deleted: false,
  });

  return getEmployeeById(insertedId, tenantId || data.tenantId || null);
};

export const updateEmployee = async (id, data, tenantId = null, branchId = null) => {
  const employee = await getEmployeeById(id, tenantId, branchId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const updateFields = {};

  if (data.employeeId && data.employeeId !== employee.employeeId) {
    const existingQuery = db('employees').where({ employee_id: data.employeeId, is_deleted: false }).whereNot({ id });
    applyTenantScope(existingQuery, tenantId);
    if (await existingQuery.first()) throw ApiError.conflict('Employee ID already exists');
    updateFields.employee_id = data.employeeId;
  }

  if (data.phone && data.phone !== employee.phone) {
    const existingQuery = db('employees').where({ phone: data.phone, is_deleted: false }).whereNot({ id });
    applyTenantScope(existingQuery, tenantId);
    if (await existingQuery.first()) throw ApiError.conflict('Employee with this phone already exists');
    updateFields.phone = data.phone;
  }

  if (data.name !== undefined) updateFields.name = data.name;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.designation !== undefined) updateFields.designation = data.designation;
  if (data.department !== undefined) updateFields.department = data.department;
  if (data.branch !== undefined) updateFields.branch = data.branch;
  if (data.salary !== undefined) updateFields.salary = data.salary;
  if (data.joiningDate !== undefined) updateFields.joining_date = new Date(data.joiningDate);
  if (data.emergencyContact !== undefined) updateFields.emergency_contact = data.emergencyContact;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.bloodGroup !== undefined) updateFields.blood_group = data.bloodGroup;
  if (data.nidNumber !== undefined) updateFields.nid_number = data.nidNumber;
  if (data.isActive !== undefined) updateFields.is_active = Boolean(data.isActive);

  if (Object.keys(updateFields).length > 0) {
    const q = db('employees').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    if (branchId) q.andWhere('branch_id', branchId);
    await q.update(updateFields);
  }

  return getEmployeeById(id, tenantId, branchId);
};

export const deleteEmployee = async (id, tenantId = null, branchId = null) => {
  const employee = await getEmployeeById(id, tenantId, branchId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const q1 = db('employees').where({ id });
  if (tenantId) q1.andWhere('tenant_id', tenantId);
  if (branchId) q1.andWhere('branch_id', branchId);
  await q1.update({ is_deleted: true });
  return { ...employee, isDeleted: true };
};

export const getEmployeeStats = async (tenantId = null, branchId = null) => {
  const countQuery = db('employees').where({ is_deleted: false });
  applyTenantScope(countQuery, tenantId);
  if (branchId) countQuery.where('employees.branch_id', branchId);
  const totalRes = await countQuery.count({ count: '*' }).first();

  const activeQuery = db('employees').where({ is_deleted: false, is_active: true });
  applyTenantScope(activeQuery, tenantId);
  if (branchId) activeQuery.where('employees.branch_id', branchId);
  const activeRes = await activeQuery.count({ count: '*' }).first();

  const total = Number(totalRes?.count || 0);
  const active = Number(activeRes?.count || 0);
  const inactive = total - active;

  const deptQuery = db('employees').where({ is_deleted: false });
  applyTenantScope(deptQuery, tenantId);
  if (branchId) deptQuery.where('employees.branch_id', branchId);
  const departments = await deptQuery.select('department').count({ count: '*' }).groupBy('department').orderBy('count', 'desc');

  const salaryQuery = db('employees').where({ is_deleted: false });
  applyTenantScope(salaryQuery, tenantId);
  if (branchId) salaryQuery.where('employees.branch_id', branchId);
  const salaryRes = await salaryQuery.avg({ avg: 'salary' }).sum({ total: 'salary' }).first();

  return {
    total,
    active,
    inactive,
    departments,
    avgSalary: Number(salaryRes?.avg || 0),
    totalSalaryExpense: Number(salaryRes?.total || 0),
  };
};
