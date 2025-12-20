import React, { useState, useEffect } from 'react';
import useCarryInServiceStore from '../store/carryInServiceStore';
import useServiceCategoryStore from '../store/serviceCategoryStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';

const CarryInService = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL_CATEGORIES');
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
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(null);
  const [completeRemark, setCompleteRemark] = useState('');
  const [deliverRemark, setDeliverRemark] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);

  const { services, fetchServices, addService, completeService, deliverService, findCustomerByPhone } = useCarryInServiceStore();
  const { serviceCategories, fetchServiceCategories } = useServiceCategoryStore();
  const { user } = useAuthStore();
  
  // Initialize WebSocket connection
  useSocket();

  const modalRef = useClickOutside(() => {
    if (showAddForm) {
      setShowAddForm(false);
    }
  });
  const completeConfirmRef = useClickOutside(() => {
    if (!isCompleting) {
      setShowCompleteConfirm(null);
      setCompleteRemark('');
    }
  });
  const deliverConfirmRef = useClickOutside(() => {
    if (!isDelivering) {
      setShowDeliverConfirm(null);
      setDeliverRemark('');
    }
  });
  const detailModalRef = useClickOutside(() => setSelectedService(null));

  useEffect(() => {
    if (services.length === 0) fetchServices();
    if (serviceCategories.length === 0) fetchServiceCategories();
  }, [services.length, serviceCategories.length, fetchServices, fetchServiceCategories]);

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
    try {
      await addService(formData);
      setFormData({ customerName: '', phone: '', email: '', address: '', category: '', serviceDescription: '' });
      setShowAddForm(false);
      setCustomerFound(false);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleCompleteService = async (serviceId) => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      await completeService(serviceId, completeRemark);
      setShowCompleteConfirm(null);
      setCompleteRemark('');
      setIsCompleting(false);
    } catch (error) {
      console.error('Error completing service:', error);
      setIsCompleting(false);
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
    // Status filter
    if (filter === 'ALL') ;
    else if (filter === 'PENDING' && service.status !== 'PENDING') return false;
    else if (filter === 'COMPLETED_NOT_COLLECTED' && service.status !== 'COMPLETED_NOT_COLLECTED') return false;
    else if (filter === 'COMPLETED_AND_COLLECTED' && service.status !== 'COMPLETED_AND_COLLECTED') return false;
    
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
    
    // Category filter
    if (categoryFilter !== 'ALL_CATEGORIES' && service.category !== categoryFilter) return false;
    
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

  const getFilterCounts = () => {
    return {
      ALL: services.length,
      PENDING: services.filter(s => s.status === 'PENDING').length,
      COMPLETED_NOT_COLLECTED: services.filter(s => s.status === 'COMPLETED_NOT_COLLECTED').length,
      COMPLETED_AND_COLLECTED: services.filter(s => s.status === 'COMPLETED_AND_COLLECTED').length
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700">Carry-In Service</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base w-full sm:w-auto"
        >
          + Add Service
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">All Services</h3>
          <p className="text-xl sm:text-3xl font-bold text-blue-600">{counts.ALL}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Pending</h3>
          <p className="text-xl sm:text-3xl font-bold text-yellow-600">{counts.PENDING}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-xl sm:text-3xl font-bold text-blue-600">{counts.COMPLETED_NOT_COLLECTED}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Delivered</h3>
          <p className="text-xl sm:text-3xl font-bold text-green-600">{counts.COMPLETED_AND_COLLECTED}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        {/* Search Bar and Category Filter - Side by Side */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by customer, phone, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                ×
              </button>
            )}
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {serviceCategories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          
          {(searchQuery || categoryFilter !== 'ALL_CATEGORIES') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL_CATEGORIES');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="border-t pt-4 -mx-4 px-4">
          <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'COMPLETED_NOT_COLLECTED', 'COMPLETED_AND_COLLECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'ALL' ? 'All' : 
               f === 'PENDING' ? 'Pending' :
               f === 'COMPLETED_NOT_COLLECTED' ? 'Completed' :
               'Delivered'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sr.No
              </th>
              <th onClick={() => handleSort('customer')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Customer {getSortIcon('customer')}
              </th>
              <th onClick={() => handleSort('phone')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Phone {getSortIcon('phone')}
              </th>
              <th onClick={() => handleSort('category')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Category {getSortIcon('category')}
              </th>
              <th onClick={() => handleSort('description')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Description {getSortIcon('description')}
              </th>
              <th onClick={() => handleSort('status')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Status {getSortIcon('status')}
              </th>
              <th onClick={() => handleSort('users')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Users {getSortIcon('users')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No services found
                </td>
              </tr>
            ) : (
              filteredServices.map((service, index) => (
                <tr key={service.id} onClick={() => setSelectedService(service)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.customerName}</div>
                      {service.email && <div className="text-sm text-gray-500">{service.email}</div>}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.phone}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.category}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">{service.serviceDescription || '-'}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                      {getStatusLabel(service.status)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    <div className="space-y-1">
                      <div>Created: {service.createdBy || 'N/A'}</div>
                      {service.completedBy && <div>Completed: {service.completedBy}</div>}
                      {service.deliveredBy && <div>Delivered: {service.deliveredBy}</div>}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {service.status === 'PENDING' && (
                        <button
                          onClick={() => setShowCompleteConfirm(service.id)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Complete
                        </button>
                      )}
                      {service.status === 'COMPLETED_NOT_COLLECTED' && (
                        <button
                          onClick={() => setShowDeliverConfirm(service.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                <label className="block text-xs sm:text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="2"
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
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium text-sm"
                >
                  Add Service
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Service Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={completeConfirmRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Complete Service</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to mark this service as completed?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Complete Remark (optional)</label>
              <textarea
                value={completeRemark}
                onChange={(e) => setCompleteRemark(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                rows="3"
                placeholder="Add any notes about the completion..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleCompleteService(showCompleteConfirm)}
                disabled={isCompleting}
                className={`flex-1 py-2 rounded font-medium text-sm ${
                  isCompleting
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCompleting ? 'Processing...' : 'Yes, Complete'}
              </button>
              <button
                onClick={() => setShowCompleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
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
          <div ref={detailModalRef} className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Service Details</h2>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">{selectedService.customerName}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 p-2 bg-blue-50 rounded border">{selectedService.phone}</div>
                </div>
                
                {selectedService.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-2 bg-green-50 rounded border break-all">{selectedService.email}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1 p-2 bg-indigo-50 rounded border">{selectedService.category}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedService.status)}`}>
                      {getStatusLabel(selectedService.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedService.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border">{selectedService.address}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded border">{selectedService.createdBy}</div>
                </div>
                
                {selectedService.completedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed By</label>
                    <div className="mt-1 p-2 bg-blue-100 rounded border">{selectedService.completedBy}</div>
                  </div>
                )}
                
                {selectedService.deliveredBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivered By</label>
                    <div className="mt-1 p-2 bg-green-100 rounded border">{selectedService.deliveredBy}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded border">
                    {new Date(selectedService.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            {selectedService.serviceDescription && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Service Description</label>
                <div className="mt-1 p-3 bg-yellow-50 rounded border border-yellow-200">{selectedService.serviceDescription}</div>
              </div>
            )}
            
            {(selectedService.completeRemark || selectedService.deliverRemark) && (
              <div className="mt-4 space-y-3">
                {selectedService.completeRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complete Remark</label>
                    <div className="mt-1 p-2 bg-blue-50 rounded border">{selectedService.completeRemark}</div>
                  </div>
                )}
                {selectedService.deliverRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deliver Remark</label>
                    <div className="mt-1 p-2 bg-green-50 rounded border">{selectedService.deliverRemark}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarryInService;