import * as XLSX from 'xlsx';

export const exportCallsToExcel = (calls) => {
  const data = calls.map(call => ({
    'ID': call.id,
    'Customer Name': call.customerName || '',
    'Phone': call.phone || '',
    'Email': call.email || '',
    'Address': call.address || '',
    'Problem': call.problem || '',
    'Category': call.category || '',
    'Status': call.status || '',
    'Assigned To': call.assignedTo || 'Unassigned',
    'Created By': call.createdBy || '',
    'Engineer Remark': call.engineerRemark || '',
    'Completion Remark': call.remark || '',
    'Created At': call.createdAt ? new Date(call.createdAt).toLocaleString() : '',
    'Assigned At': call.assignedAt ? new Date(call.assignedAt).toLocaleString() : '',
    'Completed At': call.completedAt ? new Date(call.completedAt).toLocaleString() : '',
    'Last Called At': call.lastCalledAt ? new Date(call.lastCalledAt).toLocaleString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Calls');

  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(Math.max(key.length, 10), maxWidth)
  }));
  worksheet['!cols'] = colWidths;

  const fileName = `Calls_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportUsersToExcel = (users, calls) => {
  const data = users.map(user => {
    const userCalls = calls.filter(call => call.assignedTo === user.username);
    const completedCalls = userCalls.filter(call => call.status === 'COMPLETED');
    
    return {
      'ID': user.id,
      'Username': user.username,
      'Role': user.role,
      'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
      'Total Assigned Calls': userCalls.length,
      'Completed Calls': completedCalls.length,
      'Pending Calls': userCalls.length - completedCalls.length
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

  const maxWidth = 30;
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(Math.max(key.length, 10), maxWidth)
  }));
  worksheet['!cols'] = colWidths;

  const fileName = `Users_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportToExcel = (data, filename, password = null) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const maxWidth = 30;
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(Math.max(key.length, 10), maxWidth)
  }));
  worksheet['!cols'] = colWidths;

  const finalFilename = `${filename}.xlsx`;
  
  if (password) {
    // Note: XLSX library doesn't support password protection in browser
    // This is a placeholder for password functionality
    console.warn('Password protection not supported in browser environment');
  }
  
  XLSX.writeFile(workbook, finalFilename);
};
