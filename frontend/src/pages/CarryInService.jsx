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
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Carry-In Service 🔧</h1>
          <p className="text-gray-600">Manage device repairs and service requests</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base w-full sm:w-auto shadow-sm transition-all"
        >
          + Add Service
        </button>
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
        
        {/* Search Bar and Category Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
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
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'COMPLETED_NOT_COLLECTED', 'COMPLETED_AND_COLLECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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

      {/* Services - Responsive Layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📊</span> Service Records
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
              <div className="divide-y divide-gray-200">
                {filteredServices.map((service, index) => (
                  <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors">
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
                      {service.status === 'PENDING' && (
                        <button
                          onClick={() => setShowCompleteConfirm(service.id)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex-1 sm:flex-none"
                        >
                          Complete
                        </button>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sr.No
                    </th>
                    <th onClick={() => handleSort('customer')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Customer {getSortIcon('customer')}
                    </th>
                    <th onClick={() => handleSort('phone')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Phone {getSortIcon('phone')}
                    </th>
                    <th onClick={() => handleSort('category')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Category {getSortIcon('category')}
                    </th>
                    <th onClick={() => handleSort('description')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Description {getSortIcon('description')}
                    </th>
                    <th onClick={() => handleSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Status {getSortIcon('status')}
                    </th>
                    <th onClick={() => handleSort('users')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      Users {getSortIcon('users')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service, index) => (
                    <tr key={service.id} onClick={() => setSelectedService(service)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👤</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{service.customerName}</div>
                            {service.email && <div className="text-sm text-gray-500 truncate max-w-[150px]">{service.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">📞</span>
                          {service.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                        <div className="truncate" title={service.serviceDescription}>
                          {service.serviceDescription || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(service.status)}`}>
                          {getStatusLabel(service.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="truncate" title={`Created: ${service.createdBy || 'N/A'} on ${new Date(service.createdAt).toLocaleString()}`}>Created: {service.createdBy || 'N/A'}</div>
                          {service.completedBy && <div className="truncate" title={`Completed: ${service.completedBy} ${service.completedAt ? `on ${new Date(service.completedAt).toLocaleString()}` : ''}`}>Completed: {service.completedBy}</div>}
                          {service.deliveredBy && <div className="truncate" title={`Delivered: ${service.deliveredBy} ${service.deliveredAt ? `on ${new Date(service.deliveredAt).toLocaleString()}` : ''}`}>Delivered: {service.deliveredBy}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {service.status === 'PENDING' && (
                            <button
                              onClick={() => setShowCompleteConfirm(service.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {service.status === 'COMPLETED_NOT_COLLECTED' && (
                            <button
                              onClick={() => setShowDeliverConfirm(service.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 transition-colors"
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
            
            {(selectedService.completeRemark || selectedService.deliverRemark) && (
              <div className="mt-6 space-y-4">
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
    </div>
  );
};

export default CarryInService;