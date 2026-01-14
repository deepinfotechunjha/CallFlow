import ExcelJS from 'exceljs';

export const exportCallsToExcel = async (calls) => {
  try {
    if (!calls || calls.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Calls');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Problem', key: 'problem', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Assigned To', key: 'assignedTo', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 15 },
      { header: 'Assigned By', key: 'assignedBy', width: 15 },
      { header: 'Completed By', key: 'completedBy', width: 15 },
      { header: 'Engineer Remark', key: 'engineerRemark', width: 30 },
      { header: 'Completion Remark', key: 'remark', width: 30 },
      { header: 'Call Count', key: 'callCount', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Assigned At', key: 'assignedAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Last Called At', key: 'lastCalledAt', width: 20 }
    ];

    // Add data
    calls.forEach(call => {
      worksheet.addRow({
        id: call.id || '',
        customerName: call.customerName || '',
        phone: call.phone || '',
        email: call.email || '',
        address: call.address || '',
        problem: call.problem || '',
        category: call.category || '',
        status: call.status || '',
        assignedTo: call.assignedTo || 'Unassigned',
        createdBy: call.createdBy || '',
        assignedBy: call.assignedBy || '',
        completedBy: call.completedBy || '',
        engineerRemark: call.engineerRemark || '',
        remark: call.remark || '',
        callCount: call.callCount || 1,
        createdAt: call.createdAt ? new Date(call.createdAt).toLocaleString() : '',
        assignedAt: call.assignedAt ? new Date(call.assignedAt).toLocaleString() : '',
        completedAt: call.completedAt ? new Date(call.completedAt).toLocaleString() : '',
        lastCalledAt: call.lastCalledAt ? new Date(call.lastCalledAt).toLocaleString() : ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const fileName = `Calls_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const exportCarryInServicesToExcel = async (services) => {
  try {
    if (!services || services.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Carry-In Services');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Service Description', key: 'serviceDescription', width: 40 },
      { header: 'Status', key: 'status', width: 25 },
      { header: 'Created By', key: 'createdBy', width: 15 },
      { header: 'Completed By', key: 'completedBy', width: 15 },
      { header: 'Delivered By', key: 'deliveredBy', width: 15 },
      { header: 'Complete Remark', key: 'completeRemark', width: 30 },
      { header: 'Deliver Remark', key: 'deliverRemark', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Delivered At', key: 'deliveredAt', width: 20 }
    ];

    // Add data
    services.forEach(service => {
      worksheet.addRow({
        id: service.id || '',
        customerName: service.customerName || '',
        phone: service.phone || '',
        email: service.email || '',
        address: service.address || '',
        category: service.category || '',
        serviceDescription: service.serviceDescription || '',
        status: getCarryInServiceStatusLabel(service.status) || '',
        createdBy: service.createdBy || '',
        completedBy: service.completedBy || '',
        deliveredBy: service.deliveredBy || '',
        completeRemark: service.completeRemark || '',
        deliverRemark: service.deliverRemark || '',
        createdAt: service.createdAt ? new Date(service.createdAt).toLocaleString() : '',
        completedAt: service.completedAt ? new Date(service.completedAt).toLocaleString() : '',
        deliveredAt: service.deliveredAt ? new Date(service.deliveredAt).toLocaleString() : ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const fileName = `CarryInServices_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

const getCarryInServiceStatusLabel = (status) => {
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'COMPLETED_NOT_COLLECTED': return 'Completed (Not Collected)';
    case 'COMPLETED_AND_COLLECTED': return 'Completed & Collected';
    default: return status;
  }
};

export const exportUsersToExcel = async (users, calls) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 20 },
    { header: 'Total Assigned Calls', key: 'totalCalls', width: 20 },
    { header: 'Completed Calls', key: 'completedCalls', width: 18 },
    { header: 'Pending Calls', key: 'pendingCalls', width: 15 }
  ];

  users.forEach(user => {
    const userCalls = calls.filter(call => call.assignedTo === user.username);
    const completedCalls = userCalls.filter(call => call.status === 'COMPLETED');
    
    worksheet.addRow({
      id: user.id,
      username: user.username,
      email: user.email || 'Not provided',
      phone: user.phone || 'Not provided',
      role: user.role,
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
      totalCalls: userCalls.length,
      completedCalls: completedCalls.length,
      pendingCalls: userCalls.length - completedCalls.length
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const fileName = `Users_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportToExcel = async (data, filename, password = null) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length, 10), 30)
    }));

    data.forEach(row => worksheet.addRow(row));

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  const finalFilename = `${filename}.xlsx`;
  
  if (password) {
    console.warn('Password protection not supported in browser environment');
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  a.click();
  window.URL.revokeObjectURL(url);
};
