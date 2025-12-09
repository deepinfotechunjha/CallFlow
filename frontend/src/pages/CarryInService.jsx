import React, { useState, useEffect } from 'react';
import useCarryInServiceStore from '../store/carryInServiceStore';
import useAuthStore from '../store/authStore';
import useClickOutside from '../hooks/useClickOutside';

const CarryInService = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    serviceType: ''
  });
  const [customerFound, setCustomerFound] = useState(false);

  const { services, fetchServices, addService, completeService, deliverService, findCustomerByPhone } = useCarryInServiceStore();
  const { user } = useAuthStore();

  const modalRef = useClickOutside(() => {
    if (showAddForm) {
      setShowAddForm(false);
    }
  });

  useEffect(() => {
    fetchServices();
  }, []);

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
      setFormData({ customerName: '', phone: '', email: '', address: '', serviceType: '' });
      setShowAddForm(false);
      setCustomerFound(false);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const filteredServices = services.filter(service => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return service.status === 'PENDING';
    if (filter === 'COMPLETED_NOT_COLLECTED') return service.status === 'COMPLETED_NOT_COLLECTED';
    if (filter === 'COMPLETED_AND_COLLECTED') return service.status === 'COMPLETED_AND_COLLECTED';
    return true;
  });

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

      {/* Filter Buttons */}
      <div className="mb-6">
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

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No services found
                </td>
              </tr>
            ) : (
              filteredServices.map((service) => (
                <tr key={service.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.customerName}</div>
                      {service.email && <div className="text-sm text-gray-500">{service.email}</div>}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.phone}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.serviceType}</td>
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {service.status === 'PENDING' && (
                        <button
                          onClick={() => completeService(service.id)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Complete
                        </button>
                      )}
                      {service.status === 'COMPLETED_NOT_COLLECTED' && (
                        <button
                          onClick={() => deliverService(service.id)}
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
                <label className="block text-xs sm:text-sm font-medium mb-1">Service Type *</label>
                <input
                  type="text"
                  value={formData.serviceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Laptop Repair, Phone Screen Replacement"
                  required
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
    </div>
  );
};

export default CarryInService;