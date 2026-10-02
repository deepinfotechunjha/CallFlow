import React, { useState, useEffect, useRef } from 'react';
import useCarryInServiceStore from '../store/carryInServiceStore';
import useServiceCategoryStore from '../store/serviceCategoryStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';
import ExportModal from '../components/ExportModal';
import BulkDeleteModal from '../components/BulkDeleteModal';
import ShareServiceModal from '../components/ShareServiceModal';
import AnimatedCounter from '../components/AnimatedCounter';
import { exportCarryInServicesToExcel, exportDeletedServicesToExcel } from '../utils/excelExport';
import { animatePageHeader, animateStaggerCascade, animateTableRows } from '../utils/animations';
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
  
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const tbodyRef = useRef(null);

  useEffect(() => {
    animatePageHeader(headerRef.current);
    animateStaggerCascade(statsRef.current, '> div');
  }, []);

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

  useEffect(() => {
    if (tbodyRef.current && filteredServices.length > 0) {
      animateTableRows(tbodyRef.current);
    }
  }, [filteredServices.length, filter, statusFilter, categoryFilter]);

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-secret`, {
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
        toast.error(data.error || 'Invalid secret password');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Header & Action Controls */}
      <div ref={headerRef} className="bg-white p-5 sm:p-6 rounded-xl border border-[#E0E2E5] shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-2 border border-[#FF2E46]/20">
            Workshop &bull; Hardware Service Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]">
            Carry-In Service
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Manage bench repairs, intake diagnostics, parts replacement, and customer deliveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {user?.role === 'HOST' && selectedServices.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shadow-xs transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedServices.length})
            </button>
          )}

          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-white border border-[#E0E2E5] text-[#2C2C2C] hover:border-[#FF2E46] hover:text-[#FF2E46] hover:bg-[#FFE8EB]/20 shadow-xs transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}

          <button
            onClick={() => setShowShareServiceModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-[#2C2C2C]/5 hover:bg-[#2C2C2C]/10 text-[#2C2C2C] border border-[#2C2C2C]/20 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Intake
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm text-[#FF2E46] bg-[#FF2E46]/10 hover:bg-[#FF2E46]/20 border border-[#FF2E46]/25 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Service Ticket
          </button>
        </div>
      </div>

      {/* Enterprise Stats Cards Grid */}
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">All Services</span>
            <div className="w-7 h-7 rounded-md bg-[#F8F9FA] text-[#2C2C2C] flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mt-2"><AnimatedCounter value={counts.ALL} /></p>
          <p className="text-[11px] text-gray-500 mt-0.5">Total registered tickets</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">In Progress / Pending</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2"><AnimatedCounter value={counts.PENDING} /></p>
          <p className="text-[11px] text-amber-700/70 mt-0.5">Active under bench service</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Ready for Pickup</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2"><AnimatedCounter value={counts.COMPLETED_NOT_COLLECTED} /></p>
          <p className="text-[11px] text-blue-700/70 mt-0.5">Completed, awaiting collection</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Delivered / Closed</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2"><AnimatedCounter value={counts.COMPLETED_AND_COLLECTED} /></p>
          <p className="text-[11px] text-emerald-700/70 mt-0.5">Collected by customer</p>
        </div>
      </div>

      {/* Filter & Search Toolbar Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-[#E0E2E5] space-y-4">
        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#E0E2E5]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2C2C2C]">Date Filtering</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={dateFilter.type}
              onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-1.5 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#FF2E46] focus:border-[#FF2E46] bg-white text-gray-800"
            >
              <option value="">Select Date Field</option>
              <option value="createdAt">Created Date</option>
              <option value="completedAt">Completed Date</option>
              <option value="deliveredAt">Delivered Date</option>
            </select>

            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1.5 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#FF2E46] focus:border-[#FF2E46] bg-white text-gray-800 disabled:bg-gray-50"
              disabled={!dateFilter.type}
            />

            <span className="text-xs text-gray-400">to</span>

            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1.5 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#FF2E46] focus:border-[#FF2E46] bg-white text-gray-800 disabled:bg-gray-50"
              disabled={!dateFilter.type}
            />

            <button
              onClick={applyDateFilter}
              disabled={!dateFilter.type || !dateFilter.start || !dateFilter.end}
              className="px-4 py-1.5 bg-[#FF2E46] hover:bg-[#FF5A71] text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:cursor-not-allowed"
            >
              Apply
            </button>

            {appliedDateFilter.type && (
              <button
                onClick={clearDateFilter}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] rounded-lg text-xs sm:text-sm font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Bar and Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search customer, phone, category, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] bg-white text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base"
              >
                &times;
              </button>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] bg-white text-gray-800 min-w-[130px]"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED_NOT_COLLECTED">Ready for Pickup</option>
            <option value="COMPLETED_AND_COLLECTED">Delivered</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] bg-white text-gray-800 min-w-[140px]"
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
            className="px-3 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] bg-white text-gray-800 min-w-[130px]"
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
              className="px-3 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] bg-white text-gray-800 min-w-[130px]"
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
              className="px-3.5 py-2 bg-[#F8F9FA] hover:bg-gray-200 text-[#2C2C2C] border border-[#E0E2E5] rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Services - Responsive Layout */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2C2C2C] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Service Records
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-200"></span> Warranty</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-200"></span> Repairing</span>
            </div>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="w-12 h-12 rounded-xl bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-base font-bold text-[#2C2C2C]">No service tickets found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or filters</p>
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
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${getStatusColor(service.status)}`}>
                            {getStatusLabel(service.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center text-xs">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{service.customerName}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                              {service.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedService(service)}
                        className="text-xs font-bold text-[#FF2E46] hover:underline"
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
                          className="bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none"
                        >
                          Edit
                        </button>
                      )}
                      {service.status === 'PENDING' && (
                        <>
                          {service.checkRemark && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 self-center">
                              Checks: {service.checkRemark.split('\n').length}
                            </span>
                          )}
                          <button
                            onClick={() => { setCompleteAction('complete'); setShowCompleteConfirm(service.id); }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {service.status === 'COMPLETED_NOT_COLLECTED' && (
                        <button
                          onClick={() => setShowDeliverConfirm(service.id)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none"
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
              <table className="min-w-full divide-y divide-[#E0E2E5]">
                <thead className="bg-[#2C2C2C]">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-16 border-r border-[#3D3D3D]">
                      #
                    </th>
                    {user?.role === 'HOST' && (
                      <th className="px-1 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-12 border-r border-[#3D3D3D]">
                        ✓
                      </th>
                    )}
                    <th onClick={() => handleSort('customer')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-48 border-r border-[#3D3D3D]">
                      Customer {getSortIcon('customer')}
                    </th>
                    <th onClick={() => handleSort('phone')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-32 border-r border-[#3D3D3D]">
                      Phone {getSortIcon('phone')}
                    </th>
                    <th onClick={() => handleSort('category')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-28 border-r border-[#3D3D3D]">
                      Category {getSortIcon('category')}
                    </th>
                    <th onClick={() => handleSort('description')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-40 border-r border-[#3D3D3D]">
                      Description {getSortIcon('description')}
                    </th>
                    <th onClick={() => handleSort('status')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-28 border-r border-[#3D3D3D]">
                      Status {getSortIcon('status')}
                    </th>
                    <th onClick={() => handleSort('date')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-32 border-r border-[#3D3D3D]">
                      Date & Time {getSortIcon('date')}
                    </th>
                    <th onClick={() => handleSort('users')} className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] w-24 border-r border-[#3D3D3D]">
                      Users {getSortIcon('users')}
                    </th>
                    <th className="px-3 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} className="bg-white divide-y divide-gray-200">
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
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${getStatusColor(service.status)}`}>
                          {service.status === 'PENDING' ? 'Pending' :
                           service.status === 'COMPLETED_NOT_COLLECTED' ? 'Completed' :
                           'Delivered'}
                        </span>
                      </td>
                      <td className="px-1 py-3 border-r border-gray-200 w-32">
                        <div className="bg-[#F8F9FA] p-1.5 rounded-md border border-[#E0E2E5] space-y-0.5">
                          <div className="text-xs font-semibold text-gray-900">{new Date(service.createdAt).toLocaleDateString()}</div>
                          <div className="text-[11px] text-gray-600 font-mono">{new Date(service.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: true})}</div>
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
                              className="bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {service.status === 'PENDING' && (
                            <>
                              {service.checkRemark && (
                                <span className="px-1.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800">
                                  {service.checkRemark.split('\n').length}✓
                                </span>
                              )}
                              <button
                                onClick={() => { setCompleteAction('complete'); setShowCompleteConfirm(service.id); }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {service.status === 'COMPLETED_NOT_COLLECTED' && (
                            <button
                              onClick={() => setShowDeliverConfirm(service.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
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

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-[#E0E2E5]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs disabled:shadow-none ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#FF2E46] text-white hover:bg-[#E02038]'
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-white border border-[#E0E2E5] text-[#2C2C2C] py-2.5 px-4 rounded-lg hover:bg-[#F8F9FA] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
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

              <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-[#E0E2E5]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(null);
                    setEditFormData({});
                  }}
                  disabled={isUpdating}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
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

            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-[#E0E2E5]">
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
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
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
                className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
              >
                {completeAction === 'complete' ? (isCompleting ? 'Processing...' : 'Yes, Complete')
                  : completeAction === 'check' ? (isChecking ? 'Processing...' : 'Mark as Checked')
                  : completeAction === 'warranty' ? (isWarranty ? 'Processing...' : 'Mark as Warranty')
                  : (isRepairing ? 'Processing...' : 'Mark as Repairing')}
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
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-[#E0E2E5]">
              <button
                onClick={() => setShowDeliverConfirm(null)}
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeliverService(showDeliverConfirm)}
                disabled={isDelivering}
                className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
              >
                {isDelivering ? 'Processing...' : 'Yes, Deliver'}
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
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-md border ${getStatusColor(selectedService.status)}`}>
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