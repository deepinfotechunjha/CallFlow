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
      { header: 'Visited Status', key: 'visitedStatus', width: 15 },
      { header: 'Assigned To', key: 'assignedTo', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 15 },
      { header: 'Assigned By', key: 'assignedBy', width: 15 },
      { header: 'Completed By', key: 'completedBy', width: 15 },
      { header: 'Visited By', key: 'visitedBy', width: 15 },
      { header: 'Engineer Remark', key: 'engineerRemark', width: 30 },
      { header: 'Completion Remark', key: 'remark', width: 30 },
      { header: 'Visited Remark', key: 'visitedRemark', width: 40 },
      { header: 'DC Required', key: 'dcRequired', width: 12 },
      { header: 'DC Status', key: 'dcStatus', width: 15 },
      { header: 'DC Remark', key: 'dcRemark', width: 30 },
      { header: 'DC Completed By', key: 'dcCompletedBy', width: 15 },
      { header: 'DC Completed At', key: 'dcCompletedAt', width: 20 },
      { header: 'Call Count', key: 'callCount', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Assigned At', key: 'assignedAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Visited At', key: 'visitedAt', width: 20 },
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
        visitedStatus: call.status === 'VISITED' ? 'Yes' : 'No',
        assignedTo: call.assignedTo || 'Unassigned',
        createdBy: call.createdBy || '',
        assignedBy: call.assignedBy || '',
        completedBy: call.completedBy || '',
        visitedBy: call.visitedBy || '',
        engineerRemark: call.engineerRemark || '',
        remark: call.remark || '',
        visitedRemark: call.visitedRemark || '',
        dcRequired: call.dcRequired ? 'Yes' : 'No',
        dcStatus: call.dcRequired ? (call.dcStatus || 'PENDING') : 'Not Required',
        dcRemark: call.dcRemark || '',
        dcCompletedBy: call.dcCompletedBy || '',
        dcCompletedAt: call.dcCompletedAt ? new Date(call.dcCompletedAt).toLocaleString() : '',
        callCount: call.callCount || 1,
        createdAt: call.createdAt ? new Date(call.createdAt).toLocaleString() : '',
        assignedAt: call.assignedAt ? new Date(call.assignedAt).toLocaleString() : '',
        completedAt: call.completedAt ? new Date(call.completedAt).toLocaleString() : '',
        visitedAt: call.visitedAt ? new Date(call.visitedAt).toLocaleString() : '',
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

export const exportDeletedServicesToExcel = async (services) => {
  try {
    if (!services || services.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Deleted Services');

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

    const fileName = `deleted-services-${new Date().toISOString().split('T')[0]}.xlsx`;
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

export const exportOrdersToExcel = async (orders) => {
  try {
    if (!orders || orders.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 10 },
      { header: 'Firm Name', key: 'firmName', width: 30 },
      { header: 'GST No', key: 'gstNo', width: 18 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Area', key: 'area', width: 18 },
      { header: 'Contact Person', key: 'contactPerson', width: 25 },
      { header: 'Contact Number', key: 'contactNumber', width: 18 },
      { header: 'Order Remark', key: 'orderRemark', width: 35 },
      { header: 'Called By', key: 'calledBy', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Created By', key: 'createdBy', width: 18 },
      { header: 'Created At', key: 'createdAt', width: 22 },
      { header: 'Billing Remark', key: 'billingRemark', width: 35 },
      { header: 'Billed By', key: 'billedBy', width: 18 },
      { header: 'Billed At', key: 'billedAt', width: 22 },
      { header: 'Transport Remark', key: 'completionRemark', width: 35 },
      { header: 'Transported By', key: 'completedBy', width: 18 },
      { header: 'Transported At', key: 'completedAt', width: 22 },
      { header: 'Cancelled By', key: 'cancelledBy', width: 18 },
      { header: 'Cancelled At', key: 'cancelledAt', width: 22 },
      { header: 'Hold Count', key: 'holdCount', width: 12 },
      { header: 'Hold History', key: 'holdHistory', width: 50 },
    ];

    orders.forEach(order => {
      const holdHistory = order.holds?.length
        ? order.holds.map(h => `${h.heldBy} @ ${new Date(h.heldAt).toLocaleString()}: ${h.remark}`).join(' | ')
        : '';

      worksheet.addRow({
        id: order.id || '',
        firmName: order.salesEntry?.firmName || '',
        gstNo: order.salesEntry?.gstNo || '',
        city: order.salesEntry?.city || '',
        area: order.salesEntry?.area || '',
        contactPerson: order.salesEntry?.contactPerson1Name || '',
        contactNumber: order.salesEntry?.contactPerson1Number || '',
        orderRemark: order.orderRemark || '',
        calledBy: order.calledBy || '',
        status: order.status?.replace('_', ' ') || '',
        createdBy: order.createdBy || '',
        createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
        billingRemark: order.billingRemark || '',
        billedBy: order.billedBy || '',
        billedAt: order.billedAt ? new Date(order.billedAt).toLocaleString() : '',
        completionRemark: order.completionRemark || '',
        completedBy: order.completedBy || '',
        completedAt: order.completedAt ? new Date(order.completedAt).toLocaleString() : '',
        cancelledBy: order.cancelledBy || '',
        cancelledAt: order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : '',
        holdCount: order.holds?.length || 0,
        holdHistory,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const fileName = `Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
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

export const exportSalesEntriesToExcel = async (entries) => {
  try {
    if (!entries || entries.length === 0) {
      throw new Error('No data to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Entries');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Firm Name', key: 'firmName', width: 30 },
      { header: 'GST Number', key: 'gstNo', width: 18 },
      { header: 'Contact Person 1 Name', key: 'contactPerson1Name', width: 25 },
      { header: 'Contact Person 1 Number', key: 'contactPerson1Number', width: 18 },
      { header: 'Contact Person 2 Name', key: 'contactPerson2Name', width: 25 },
      { header: 'Contact Person 2 Number', key: 'contactPerson2Number', width: 18 },
      { header: 'Account Contact Name', key: 'accountContactName', width: 25 },
      { header: 'Account Contact Number', key: 'accountContactNumber', width: 18 },
      { header: 'WhatsApp Number', key: 'whatsappNumber', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Landmark', key: 'landmark', width: 25 },
      { header: 'Area', key: 'area', width: 20 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Visit Count', key: 'visitCount', width: 12 },
      { header: 'Call Count', key: 'callCount', width: 12 },
      { header: 'Total Logs', key: 'totalLogs', width: 12 },
      { header: 'Delay Count', key: 'delayCount', width: 12 },
      { header: 'Delayed By', key: 'delayedBy', width: 30 },
      { header: 'Reminder Date', key: 'reminderDate', width: 20 },
      { header: 'Last Activity Date', key: 'lastActivityDate', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];

    // Add data
    entries.forEach(entry => {
      worksheet.addRow({
        id: entry.id || '',
        firmName: entry.firmName || '',
        gstNo: entry.gstNo || '',
        contactPerson1Name: entry.contactPerson1Name || '',
        contactPerson1Number: entry.contactPerson1Number || '',
        contactPerson2Name: entry.contactPerson2Name || '',
        contactPerson2Number: entry.contactPerson2Number || '',
        accountContactName: entry.accountContactName || '',
        accountContactNumber: entry.accountContactNumber || '',
        whatsappNumber: entry.whatsappNumber || entry.contactPerson1Number || '',
        email: entry.email || '',
        address: entry.address || '',
        landmark: entry.landmark || '',
        area: entry.area || '',
        city: entry.city || '',
        pincode: entry.pincode || '',
        visitCount: entry.visitCount || 0,
        callCount: entry.callCount || 0,
        totalLogs: (entry.visitCount || 0) + (entry.callCount || 0),
        delayCount: entry.delayCount || 0,
        delayedBy: entry.delayedBy ? entry.delayedBy.join(', ') : '',
        reminderDate: entry.reminderDate ? new Date(entry.reminderDate).toLocaleString() : '',
        lastActivityDate: entry.lastActivityDate ? new Date(entry.lastActivityDate).toLocaleString() : '',
        createdBy: entry.createdBy || '',
        createdAt: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '',
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const fileName = `Sales_Entries_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
