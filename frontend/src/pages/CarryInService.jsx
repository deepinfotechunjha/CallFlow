import React, { useState, useEffect } from 'react';
import useCarryInServiceStore from '../store/carryInServiceStore';
import useServiceCategoryStore from '../store/serviceCategoryStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';
import ExportModal from '../components/ExportModal';
import BulkDeleteModal from '../components/BulkDeleteModal';
import ShareServiceModal from '../components/ShareServiceModal';
import { exportCarryInServicesToExcel, exportDeletedServicesToExcel } from '../utils/excelExport';
import toast from 'react-hot-toast';

const CarryInService = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showShareServiceModal, setShowShareServiceModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL_CATEGORIES');
  const [statusFilter, setStatusFilter] = useState('ALL_STATUS');
  const [userFilterType, setUserFilterType] = useState('ALL_USERS');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [dateFilter, setDateFilter] = useState({ type: '', start: '', end: '' });
  const [appliedDateFilter, setAppliedDateFilter] = useState({ type: '', start: '', end: '' });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    serviceDescription: ''
  });
  const [customerFound, setCustomerFound] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null);
  const [completeAction, setCompleteAction] = useState('complete');
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [completeRemark, setCompleteRemark] = useState('');
  const [checkRemark, setCheckRemark] = useState('');
  const [deliverRemark, setDeliverRemark] = useState('');
  const [editFormData, setEditFormData] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isWarranty, setIsWarranty] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [warrantyRemark, setWarrantyRemark] = useState('');
  const [repairingRemark, setRepairingRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { services, fetchServices, addService, updateService, completeService, deliverService, checkService, warrantyService, repairingService, findCustomerByPhone, bulkDeleteServices } = useCarryInServiceStore();
  const { serviceCategories, fetchServiceCategories } = useServiceCategoryStore();
  const { user, token } = useAuthStore();
  
  // Initialize WebSocket connection
  useSocket();

  const modalRef = useClickOutside(() => {
    if (showAddForm) {
      setShowAddForm(false);
    }
  });
  const completeConfirmRef = useClickOutside(() => {
    if (!isCompleting && !isChecking && !isWarranty && !isRepairing) {
      setShowCompleteConfirm(null);
      setCompleteRemark('');
      setCheckRemark('');
      setWarrantyRemark('');
      setRepairingRemark('');
      setCompleteAction('complete');
    }
  });
  const deliverConfirmRef = useClickOutside(() => {
    if (!isDelivering) {
      setShowDeliverConfirm(null);
      setDeliverRemark('');
    }
  });
  const editModalRef = useClickOutside(() => {
    if (!isUpdating) {
      setShowEditModal(null);
      setEditFormData({});
    }
  });
  const detailModalRef = useClickOutside(() => setSelectedService(null));

  useEffect(() => {
    if (services.length === 0) fetchServices();
    if (serviceCategories.length === 0) fetchServiceCategories();
  }, [services.length, serviceCategories.length, fetchServices, fetchServiceCategories]);

  const applyDateFilter = () => {
    setAppliedDateFilter(dateFilter);
  };

  const clearDateFilter = () => {
    setDateFilter({ type: '', start: '', end: '' });
    setAppliedDateFilter({ type: '', start: '', end: '' });
  };

  const handlePhoneChange = async (phone) => {
    setFormData(prev => ({ ...prev, phone }));
    
    if (phone.length >= 10) {
      const existingCustomer = await findCustomerByPhone(phone);
      if (existingCustomer) {
        setFormData(prev => ({
          ...prev,
          customerName: existingCustomer.name || prev.customerName,
          email: existingCustomer.email || '',
          address: existingCustomer.address || ''
        }));
        setCustomerFound(true);
      } else {
        setCustomerFound(false);
      }
    } else {
      setCustomerFound(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await addService(formData);
      setFormData({ customerName: '', phone: '', email: '', address: '', category: '', serviceDescription: '' });
      setShowAddForm(false);
      setCustomerFound(false);
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteService = async (serviceId) => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await completeService(serviceId, completeRemark);
      setShowCompleteConfirm(null);
      setCompleteRemark('');
      setCompleteAction('complete');
      setIsCompleting(false);
    } catch (error) {
      console.error('Error completing service:', error);
      setIsCompleting(false);
    }
  };

  const handleCheckService = async (serviceId) => {
    if (isChecking || !checkRemark.trim()) return;
    setIsChecking(true);
    try {
      await checkService(serviceId, checkRemark);
      setShowCompleteConfirm(null);
      setCheckRemark('');
      setCompleteAction('complete');
      setIsChecking(false);
    } catch (error) {
      console.error('Error checking service:', error);
      setIsChecking(false);
    }
  };

  const handleWarrantyService = async (serviceId) => {
    if (isWarranty || !warrantyRemark.trim()) return;
    setIsWarranty(true);
    try {
      await warrantyService(serviceId, warrantyRemark);
      setShowCompleteConfirm(null);
      setWarrantyRemark('');
      setCompleteAction('complete');
      setIsWarranty(false);
    } catch (error) {
      console.error('Error marking warranty:', error);
      setIsWarranty(false);
    }
  };

  const handleRepairingService = async (serviceId) => {
    if (isRepairing || !repairingRemark.trim()) return;
    setIsRepairing(true);
    try {
      await repairingService(serviceId, repairingRemark);
      setShowCompleteConfirm(null);
      setRepairingRemark('');
      setCompleteAction('complete');
      setIsRepairing(false);
    } catch (error) {
      console.error('Error marking repairing:', error);
      setIsRepairing(false);
    }
  };

  const handleDeliverService = async (serviceId) => {
    if (isDelivering) return;
    setIsDelivering(true);
    
    try {
      await deliverService(serviceId, deliverRemark);
      setShowDeliverConfirm(null);
      setDeliverRemark('');
      setIsDelivering(false);
    } catch (error) {
      console.error('Error delivering service:', error);
      setIsDelivering(false);
    }
  };

  const openEditModal = (service) => {
    setEditFormData({
      customerName: service.customerName || '',
      phone: service.phone || '',
      email: service.email || '',
      address: service.address || '',
      category: service.category || '',
      serviceDescription: service.serviceDescription || ''
    });
    setShowEditModal(service.id);
  };

  const handleEditSave = async (serviceId) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      await updateService(serviceId, editFormData);
      setShowEditModal(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕️';
  };

  let filteredServices = services.filter(service => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (service.customerName || '').toLowerCase().includes(query) ||
        (service.phone || '').toLowerCase().includes(query) ||
        (service.category || '').toLowerCase().includes(query) ||
        (service.serviceDescription || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Status dropdown filter
    if (statusFilter !== 'ALL_STATUS') {
      if (statusFilter === 'PENDING' && service.status !== 'PENDING') return false;
      if (statusFilter === 'COMPLETED_NOT_COLLECTED' && service.status !== 'COMPLETED_NOT_COLLECTED') return false;
      if (statusFilter === 'COMPLETED_AND_COLLECTED' && service.status !== 'COMPLETED_AND_COLLECTED') return false;
    }
    
    // Category dropdown filter
    if (categoryFilter !== 'ALL_CATEGORIES' && service.category !== categoryFilter) return false;
    
    // User-based filter
    if (userFilterType !== 'ALL_USERS' && selectedUser !== 'ALL') {
      if (userFilterType === 'CREATED_BY' && service.createdBy !== selectedUser) return false;
      if (userFilterType === 'COMPLETED_BY' && service.completedBy !== selectedUser) return false;
      if (userFilterType === 'DELIVERED_BY' && service.deliveredBy !== selectedUser) return false;
    }
    
    // Date range filter
    if (appliedDateFilter.type && appliedDateFilter.start && appliedDateFilter.end) {
      const serviceDate = service[appliedDateFilter.type];
      if (!serviceDate) return false;
      const date = new Date(serviceDate);
      const start = new Date(appliedDateFilter.start);
      const end = new Date(appliedDateFilter.end);
      end.setHours(23, 59, 59, 999);
      if (date < start || date > end) return false;
    }
    
    return true;
  });

  // Apply sorting
  if (sortConfig.key && sortConfig.direction) {
    filteredServices.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'customer': aVal = a.customerName || ''; bVal = b.customerName || ''; break;
        case 'phone': aVal = a.phone || ''; bVal = b.phone || ''; break;
        case 'category': aVal = a.category || ''; bVal = b.category || ''; break;
        case 'description': aVal = a.serviceDescription || ''; bVal = b.serviceDescription || ''; break;
        case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
        case 'users': aVal = a.createdBy || ''; bVal = b.createdBy || ''; break;
        default: return 0;
      }
      if (sortConfig.direction === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED_NOT_COLLECTED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED_AND_COLLECTED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'COMPLETED_NOT_COLLECTED': return 'Completed (Not Collected)';
      case 'COMPLETED_AND_COLLECTED': return 'Completed & Collected';
      default: return status;
    }
  };

  const getRowColor = (service) => {
    if (service.warrantyRemark) return 'bg-blue-200 hover:bg-blue-200';
    if (service.repairingRemark) return 'bg-green-200 hover:bg-green-200';
    return '';
  };

  const getFilterCounts = () => {
    return {
      ALL: services.length,
      PENDING: services.filter(s => s.status === 'PENDING').length,
      COMPLETED_NOT_COLLECTED: services.filter(s => s.status === 'COMPLETED_NOT_COLLECTED').length,
      COMPLETED_AND_COLLECTED: services.filter(s => s.status === 'COMPLETED_AND_COLLECTED').length
    };
  };

  const counts = getFilterCounts();

  // Get unique users for filtering
  const getUniqueUsers = () => {
    const allUsers = new Set();
    services.forEach(service => {
      if (service.createdBy && service.createdBy !== 'Share Link') {
        allUsers.add(service.createdBy);
      }
      if (service.completedBy && service.completedBy !== 'Share Link') {
        allUsers.add(service.completedBy);
      }
      if (service.deliveredBy && service.deliveredBy !== 'Share Link') {
        allUsers.add(service.deliveredBy);
      }
    });
    return Array.from(allUsers).sort();
  };
  
  const uniqueUsers = getUniqueUsers();

  const deliveredServices = filteredServices.filter(s => s.status === 'COMPLETED_AND_COLLECTED');
  const isAllSelected = deliveredServices.length > 0 && selectedServices.length === deliveredServices.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedServices([]);
    } else {
      setSelectedServices(deliveredServices.map(s => s.id));
    }
  };

  const handleSelectService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleBulkDelete = async (secretPassword) => {
    try {
      const response = await bulkDeleteServices(selectedServices, secretPassword);
      if (response.servicesData) {
        await exportDeletedServicesToExcel(response.servicesData);
      }
      setSelectedServices([]);
      setShowBulkDeleteModal(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleExport = async (exportType, password) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/verify-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secretPassword: password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.hasAccess) {
        const dataToExport = exportType === 'filtered' ? filteredServices : services;
        
        if (dataToExport.length === 0) {
          toast.error('No data to export');
          return;
        }
        
        await exportCarryInServicesToExcel(dataToExport);
        toast.success(`Successfully exported ${dataToExport.length} services to Excel`);
        setShowExportModal(false);
      } else {
        toast.error('Invalid secret password');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Carry-In Service 🔧</h1>
          <p className="text-gray-600">Manage device repairs and service requests</p>
        </div>
        <div className={`flex gap-3 w-full sm:w-auto ${selectedServices.length > 0 ? 'flex-wrap' : ''}`}>
          {user?.role === 'HOST' && selectedServices.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 sm:px-6 py-3 rounded-xl font-medium text-sm sm:text-base whitespace-nowrap flex items-center gap-2 shadow-sm transition-all bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              🗑️ Delete ({selectedServices.length})
            </button>
          )}
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm sm:text-base whitespace-nowrap flex items-center gap-2 shadow-sm transition-all ${
                isExporting 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
              }`}
            >
              {isExporting ? '⏳ Exporting...' : '📊 Export'}
            </button>
          )}
          <button
            onClick={() => setShowShareServiceModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium text-sm sm:text-base whitespace-nowrap shadow-sm transition-all flex items-center gap-2"
          >
            🔗 Share
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base whitespace-nowrap shadow-sm transition-all"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-blue-700 mb-1">All Services</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-800">{counts.ALL}</p>
            </div>
            <div className="text-blue-500 text-2xl">📊</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-yellow-700 mb-1">Pending</h3>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-800">{counts.PENDING}</p>
            </div>
            <div className="text-yellow-500 text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-xl shadow-sm border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-indigo-700 mb-1">Completed</h3>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-800">{counts.COMPLETED_NOT_COLLECTED}</p>
            </div>
            <div className="text-indigo-500 text-2xl">🔧</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-green-700 mb-1">Delivered</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-800">{counts.COMPLETED_AND_COLLECTED}</p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Search & Filters
        </h2>
        
        {/* Date Filter */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Type</label>
              <select
                value={dateFilter.type}
                onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                <option value="createdAt">Created Date</option>
                <option value="completedAt">Completed Date</option>
                <option value="deliveredAt">Delivered Date</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!dateFilter.type}
              />
            </div>
            
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!dateFilter.type}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={applyDateFilter}
                disabled={!dateFilter.type || !dateFilter.start || !dateFilter.end}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
              
              {appliedDateFilter.type && (
                <button
                  onClick={clearDateFilter}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {appliedDateFilter.type && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Active Filter:</span> {appliedDateFilter.type === 'createdAt' ? 'Created' : appliedDateFilter.type === 'completedAt' ? 'Completed' : 'Delivered'} between {new Date(appliedDateFilter.start).toLocaleDateString()} and {new Date(appliedDateFilter.end).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Search Bar and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by customer, phone, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl transition-colors"
              >
                ×
              </button>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED_NOT_COLLECTED">Completed</option>
            <option value="COMPLETED_AND_COLLECTED">Delivered</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {serviceCategories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={userFilterType}
            onChange={(e) => {
              setUserFilterType(e.target.value);
              setSelectedUser('ALL');
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors min-w-[120px]"
          >
            <option value="ALL_USERS">All Users</option>
            <option value="CREATED_BY">Created By</option>
            <option value="COMPLETED_BY">Completed By</option>
            <option value="DELIVERED_BY">Delivered By</option>
          </select>
          
          {userFilterType !== 'ALL_USERS' && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors min-w-[120px]"
            >
              <option value="ALL">All</option>
              {uniqueUsers.map((user, index) => (
                <option key={index} value={user}>{user}</option>
              ))}
            </select>
          )}
          
          {(searchQuery || categoryFilter !== 'ALL_CATEGORIES' || statusFilter !== 'ALL_STATUS' || appliedDateFilter.type || userFilterType !== 'ALL_USERS') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL_CATEGORIES');
                setStatusFilter('ALL_STATUS');
                setUserFilterType('ALL_USERS');
                setSelectedUser('ALL');
                clearDateFilter();
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Services - Responsive Layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2"><span>📊</span> Service Records</span>
            <span className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-200"></span> Warranty</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-200"></span> Repairing</span>
            </span>
          </h2>
        </div>

        {filteredServices.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-4">🔧</div>
            <p className="text-lg font-medium">No services found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              {user?.role === 'HOST' && deliveredServices.length > 0 && (
                <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="font-medium text-gray-700">Select All Delivered ({deliveredServices.length})</span>
                  </label>
                  {selectedServices.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedServices.length} selected
                    </span>
                  )}
                </div>
              )}
              <div className="divide-y divide-gray-200">
                {filteredServices.map((service, index) => (
                  <div key={service.id} className={`p-4 transition-colors ${getRowColor(service) || 'hover:bg-gray-50'}`}>
                    {user?.role === 'HOST' && service.status === 'COMPLETED_AND_COLLECTED' && (
                      <div className="flex justify-end mb-2">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleSelectService(service.id)}
                          className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                            {getStatusLabel(service.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">👤</span>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{service.customerName}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span className="text-gray-400">📞</span>
                              {service.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedService(service)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Category</div>
                        <div className="text-sm text-gray-900">{service.category}</div>
                      </div>
                      {service.email && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Email</div>
                          <div className="text-sm text-gray-600 break-all">{service.email}</div>
                        </div>
                      )}
                    </div>

                    {service.serviceDescription && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Description</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{service.serviceDescription}</div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-1">Timeline</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Created: {service.createdBy || 'N/A'} on {new Date(service.createdAt).toLocaleString()}</div>
                        {service.completedBy && <div>Completed: {service.completedBy} {service.completedAt && `on ${new Date(service.completedAt).toLocaleString()}`}</div>}
                        {service.deliveredBy && <div>Delivered: {service.deliveredBy} {service.deliveredAt && `on ${new Date(service.deliveredAt).toLocaleString()}`}</div>}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {(['HOST', 'ADMIN'].includes(user?.role)) && service.status === 'PENDING' && (
                        <button
                          onClick={() => openEditModal(service)}
                          className="bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors flex-1 sm:flex-none"
                        >
                          Edit
                        </button>
                      )}
                      {service.status === 'PENDING' && (
                        <>
                          {service.checkRemark && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 self-center">
                              Checks: {service.checkRemark.split('\n').length}
                            </span>
                          )}
                          <button
                            onClick={() => { setCompleteAction('complete'); setShowCompleteConfirm(service.id); }}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex-1 sm:flex-none"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {service.status === 'COMPLETED_NOT_COLLECTED' && (
                        <button
                          onClick={() => setShowDeliverConfirm(service.id)}
                          className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex-1 sm:flex-none"
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              {user?.role === 'HOST' && deliveredServices.length > 0 && (
                <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="font-medium text-gray-700">Select All Delivered ({deliveredServices.length})</span>
                  </label>
                  {selectedServices.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedServices.length} selected
                    </span>
                  )}
                </div>
              )}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Sr.No
                    </th>
                    {user?.role === 'HOST' && (
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        ✓
                      </th>
                    )}
                    <th onClick={() => handleSort('customer')} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-48">
                      Customer {getSortIcon('customer')}
                    </th>
                    <th onClick={() => handleSort('phone')} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32">
                      Phone {getSortIcon('phone')}
                    </th>
                    <th onClick={() => handleSort('category')} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28">
                      Category {getSortIcon('category')}
                    </th>
                    <th onClick={() => handleSort('description')} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-40">
                      Description {getSortIcon('description')}
                    </th>
                    <th onClick={() => handleSort('status')} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28">
                      Status {getSortIcon('status')}
                    </th>
                    <th onClick={() => handleSort('date')} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32">
                      Date & Time {getSortIcon('date')}
                    </th>
                    <th onClick={() => handleSort('users')} className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24">
                      Users {getSortIcon('users')}
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service, index) => (
                    <tr key={service.id} onClick={() => setSelectedService(service)} className={`cursor-pointer transition-colors ${getRowColor(service) || 'hover:bg-gray-50'}`}>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500 w-16">
                        {index + 1}
                      </td>
                      {user?.role === 'HOST' && (
                        <td className="px-1 py-3 border-r border-gray-200 text-center w-12" onClick={(e) => e.stopPropagation()}>
                          {service.status === 'COMPLETED_AND_COLLECTED' ? (
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.id)}
                              onChange={() => handleSelectService(service.id)}
                              className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                            />
                          ) : (
                            <div className="w-4 h-4"></div>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-3 w-48">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👤</span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{service.customerName}</div>
                            {service.email && <div className="text-xs text-gray-500 truncate">{service.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 w-32">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">📞</span>
                          <span className="truncate">{service.phone}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 w-28">
                        <div className="truncate" title={service.category}>{service.category}</div>
                      </td>
                      <td className="px-2 py-3 text-sm text-gray-500 w-40">
                        <div className="text-xs text-gray-900 bg-yellow-50 p-1 rounded leading-tight" style={{maxHeight: '60px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'}} title={service.serviceDescription}>
                          {service.serviceDescription || '-'}
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap w-28">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(service.status)}`}>
                          {service.status === 'PENDING' ? 'Pending' :
                           service.status === 'COMPLETED_NOT_COLLECTED' ? 'Completed' :
                           'Delivered'}
                        </span>
                      </td>
                      <td className="px-1 py-3 border-r border-gray-200 w-32">
                        <div className="bg-gray-100 p-1 rounded space-y-1">
                          <div className="text-xs font-medium text-gray-900">{new Date(service.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-600">{new Date(service.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: true})}</div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-500 w-24">
                        <div className="space-y-1">
                          <div className="truncate" title={`Created: ${service.createdBy || 'N/A'}`}>C: {service.createdBy || 'N/A'}</div>
                          {service.checkedBy && <div className="truncate text-purple-600" title={`Checked: ${service.checkedBy}`}>✓: {service.checkedBy}</div>}
                          {service.completedBy && <div className="truncate" title={`Completed: ${service.completedBy}`}>✓: {service.completedBy}</div>}
                          {service.deliveredBy && <div className="truncate" title={`Delivered: ${service.deliveredBy}`}>D: {service.deliveredBy}</div>}
                        </div>
                      </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm font-medium w-32" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 flex-wrap items-center">
                          {(['HOST', 'ADMIN'].includes(user?.role)) && service.status === 'PENDING' && (
                            <button
                              onClick={() => openEditModal(service)}
                              className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {service.status === 'PENDING' && (
                            <>
                              {service.checkRemark && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {service.checkRemark.split('\n').length}✓
                                </span>
                              )}
                              <button
                                onClick={() => { setCompleteAction('complete'); setShowCompleteConfirm(service.id); }}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {service.status === 'COMPLETED_NOT_COLLECTED' && (
                            <button
                              onClick={() => setShowDeliverConfirm(service.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Add New Service</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                {customerFound && <p className="text-green-600 text-xs sm:text-sm">✓ Customer found! Fields auto-filled</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  {serviceCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Service Description</label>
                <textarea
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="3"
                  placeholder="Additional details about the service..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 rounded font-medium text-sm ${
                    isSubmitting
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Edit Service</h2>
              <button 
                onClick={() => {
                  setShowEditModal(null);
                  setEditFormData({});
                }} 
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditSave(showEditModal);
            }} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={editFormData.customerName || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Address *</label>
                <textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Category *</label>
                <select
                  value={editFormData.category || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  {serviceCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Service Description</label>
                <textarea
                  value={editFormData.serviceDescription || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 text-sm"
                  rows="3"
                  placeholder="Additional details about the service..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`flex-1 py-2 rounded font-medium text-sm ${
                    isUpdating
                      ? 'bg-orange-400 text-white cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(null);
                    setEditFormData({});
                  }}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete / Check Service Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={completeConfirmRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Service Action</h2>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="completeAction" value="complete"
                  checked={completeAction === 'complete'}
                  onChange={(e) => setCompleteAction(e.target.value)} className="mr-2" />
                Complete
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="completeAction" value="check"
                  checked={completeAction === 'check'}
                  onChange={(e) => setCompleteAction(e.target.value)} className="mr-2" />
                Check
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="completeAction" value="warranty"
                  checked={completeAction === 'warranty'}
                  onChange={(e) => setCompleteAction(e.target.value)} className="mr-2" />
                <span className="text-amber-700 font-medium">Warranty</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="completeAction" value="repairing"
                  checked={completeAction === 'repairing'}
                  onChange={(e) => setCompleteAction(e.target.value)} className="mr-2" />
                <span className="text-rose-700 font-medium">Repairing</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {completeAction === 'complete' ? 'Complete Remark (optional)'
                  : completeAction === 'check' ? 'Check Remark *'
                  : completeAction === 'warranty' ? 'Warranty Remark *'
                  : 'Repairing Remark *'}
              </label>
              <textarea
                value={
                  completeAction === 'complete' ? completeRemark
                  : completeAction === 'check' ? checkRemark
                  : completeAction === 'warranty' ? warrantyRemark
                  : repairingRemark
                }
                onChange={(e) => {
                  if (completeAction === 'complete') setCompleteRemark(e.target.value);
                  else if (completeAction === 'check') setCheckRemark(e.target.value);
                  else if (completeAction === 'warranty') setWarrantyRemark(e.target.value);
                  else setRepairingRemark(e.target.value);
                }}
                className={`w-full p-2 border rounded focus:ring-2 text-sm ${
                  completeAction === 'warranty' ? 'focus:ring-amber-500 border-amber-200'
                  : completeAction === 'repairing' ? 'focus:ring-rose-500 border-rose-200'
                  : 'focus:ring-blue-500'
                }`}
                rows="3"
                placeholder={
                  completeAction === 'complete' ? 'Add any notes about the completion...'
                  : completeAction === 'check' ? 'Describe what was checked...'
                  : completeAction === 'warranty' ? 'Describe the warranty details...'
                  : 'Describe what needs repairing...'
                }
                required={completeAction !== 'complete'}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  if (completeAction === 'complete') handleCompleteService(showCompleteConfirm);
                  else if (completeAction === 'check') handleCheckService(showCompleteConfirm);
                  else if (completeAction === 'warranty') handleWarrantyService(showCompleteConfirm);
                  else handleRepairingService(showCompleteConfirm);
                }}
                disabled={
                  completeAction === 'complete' ? isCompleting
                  : completeAction === 'check' ? (isChecking || !checkRemark.trim())
                  : completeAction === 'warranty' ? (isWarranty || !warrantyRemark.trim())
                  : (isRepairing || !repairingRemark.trim())
                }
                className={`flex-1 py-2 rounded font-medium text-sm ${
                  completeAction === 'warranty'
                    ? (isWarranty || !warrantyRemark.trim() ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600')
                  : completeAction === 'repairing'
                    ? (isRepairing || !repairingRemark.trim() ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700')
                  : completeAction === 'check'
                    ? (isChecking || !checkRemark.trim() ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700')
                  : (isCompleting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')
                }`}
              >
                {completeAction === 'complete' ? (isCompleting ? 'Processing...' : 'Yes, Complete')
                  : completeAction === 'check' ? (isChecking ? 'Processing...' : 'Mark as Checked')
                  : completeAction === 'warranty' ? (isWarranty ? 'Processing...' : 'Mark as Warranty')
                  : (isRepairing ? 'Processing...' : 'Mark as Repairing')}
              </button>
              <button
                onClick={() => {
                  setShowCompleteConfirm(null);
                  setCompleteRemark('');
                  setCheckRemark('');
                  setWarrantyRemark('');
                  setRepairingRemark('');
                  setCompleteAction('complete');
                }}
                disabled={isCompleting || isChecking || isWarranty || isRepairing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Service Confirmation Modal */}
      {showDeliverConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={deliverConfirmRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Deliver Service</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to mark this service as delivered to the customer?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Deliver Remark (optional)</label>
              <textarea
                value={deliverRemark}
                onChange={(e) => setDeliverRemark(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 text-sm"
                rows="3"
                placeholder="Add any notes about the delivery..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleDeliverService(showDeliverConfirm)}
                disabled={isDelivering}
                className={`flex-1 py-2 rounded font-medium text-sm ${
                  isDelivering
                    ? 'bg-green-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isDelivering ? 'Processing...' : 'Yes, Deliver'}
              </button>
              <button
                onClick={() => setShowDeliverConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={detailModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Service Details</h2>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <div className="p-3 bg-gray-50 rounded-lg border text-sm sm:text-base">{selectedService.customerName}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="p-3 bg-blue-50 rounded-lg border text-sm sm:text-base">{selectedService.phone}</div>
                </div>
                
                {selectedService.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-3 bg-green-50 rounded-lg border break-all text-sm sm:text-base">{selectedService.email}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="p-3 bg-indigo-50 rounded-lg border text-sm sm:text-base">{selectedService.category}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(selectedService.status)}`}>
                      {getStatusLabel(selectedService.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedService.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="p-3 bg-gray-50 rounded-lg border text-sm sm:text-base">{selectedService.address}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <div className="p-3 bg-gray-100 rounded-lg border text-sm sm:text-base">{selectedService.createdBy}</div>
                </div>
                
                {selectedService.completedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Completed By</label>
                    <div className="p-3 bg-blue-100 rounded-lg border text-sm sm:text-base">{selectedService.completedBy}</div>
                  </div>
                )}
                
                {selectedService.deliveredBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivered By</label>
                    <div className="p-3 bg-green-100 rounded-lg border text-sm sm:text-base">{selectedService.deliveredBy}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <div className="p-3 bg-gray-100 rounded-lg border text-sm sm:text-base">
                    {new Date(selectedService.createdAt).toLocaleString()}
                  </div>
                </div>
                
                {selectedService.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                    <div className="p-3 bg-blue-100 rounded-lg border text-sm sm:text-base">
                      {new Date(selectedService.completedAt).toLocaleString()}
                    </div>
                  </div>
                )}
                
                {selectedService.deliveredAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivered At</label>
                    <div className="p-3 bg-green-100 rounded-lg border text-sm sm:text-base">
                      {new Date(selectedService.deliveredAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {selectedService.serviceDescription && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Description</label>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-sm sm:text-base">{selectedService.serviceDescription}</div>
              </div>
            )}
            
            {(selectedService.completeRemark || selectedService.deliverRemark || selectedService.checkRemark || selectedService.warrantyRemark || selectedService.repairingRemark) && (
              <div className="mt-6 space-y-4">
                {selectedService.checkRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check History</label>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 max-h-32 overflow-y-auto">
                      {selectedService.checkRemark.split('\n').map((entry, index) => (
                        <div key={index} className="text-sm text-purple-800 mb-1 last:mb-0">{entry}</div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedService.warrantyRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Remark</label>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                      <p>{selectedService.warrantyRemark}</p>
                      {selectedService.warrantyBy && (
                        <p className="text-xs text-amber-600 mt-1">By {selectedService.warrantyBy}{selectedService.warrantyAt ? ` on ${new Date(selectedService.warrantyAt).toLocaleString()}` : ''}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedService.repairingRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repairing Remark</label>
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-sm">
                      <p>{selectedService.repairingRemark}</p>
                      {selectedService.repairingBy && (
                        <p className="text-xs text-rose-600 mt-1">By {selectedService.repairingBy}{selectedService.repairingAt ? ` on ${new Date(selectedService.repairingAt).toLocaleString()}` : ''}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedService.completeRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complete Remark</label>
                    <div className="p-3 bg-blue-50 rounded-lg border text-sm sm:text-base">{selectedService.completeRemark}</div>
                  </div>
                )}
                {selectedService.deliverRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deliver Remark</label>
                    <div className="p-3 bg-green-50 rounded-lg border text-sm sm:text-base">{selectedService.deliverRemark}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showShareServiceModal && (
        <ShareServiceModal
          isOpen={showShareServiceModal}
          onClose={() => setShowShareServiceModal(false)}
        />
      )}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={services.length}
          filteredCount={filteredServices.length}
          title="Export Carry-In Services to Excel"
        />
      )}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          selectedCount={selectedServices.length}
        />
      )}
    </div>
  );
};

export default CarryInService;