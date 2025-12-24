import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const CustomerDetailsModal = ({ customer, isOpen, onClose }) => {
  const [customerCalls, setCustomerCalls] = useState([]);
  const [customerServices, setCustomerServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      fetchCustomerDetails();
    }
  }, [isOpen, customer]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const [callsResponse, servicesResponse] = await Promise.all([
        apiClient.get('/calls').then(res => 
          res.data.filter(call => call.phone === customer.phone)
        ),
        apiClient.get('/carry-in-services').then(res => 
          res.data.filter(service => service.phone === customer.phone)
        )
      ]);
      
      setCustomerCalls(callsResponse);
      setCustomerServices(servicesResponse);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED_NOT_COLLECTED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED_AND_COLLECTED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <p className="text-gray-100 flex items-center gap-2">
                  <span>📞</span> {customer.phone}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg text-gray-500">Loading customer details...</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>👤</span> Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-800">{customer.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-800">{customer.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-800">{customer.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Since</label>
                    <p className="text-gray-800">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Activity</label>
                    <p className="text-gray-800">
                      {customer.lastActivityDate 
                        ? new Date(customer.lastActivityDate).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-gray-600 text-2xl mb-2">📞</div>
                  <div className="text-2xl font-bold text-gray-800">{customer.outsideCalls || 0}</div>
                  <div className="text-sm text-gray-700 font-medium">Outside Calls</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-gray-600 text-2xl mb-2">🔧</div>
                  <div className="text-2xl font-bold text-gray-800">{customer.carryInServices || 0}</div>
                  <div className="text-sm text-gray-700 font-medium">Carry-In Services</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-gray-600 text-2xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-gray-800">{customer.totalInteractions || 0}</div>
                  <div className="text-sm text-gray-700 font-medium">Total Interactions</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📞</span> Recent Calls ({customerCalls.length})
                </h3>
                {customerCalls.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No calls found</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {customerCalls.slice(0, 10).map((call) => (
                      <div key={call.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{call.problem}</h4>
                            <p className="text-sm text-gray-600">Category: {call.category}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Created: {new Date(call.createdAt).toLocaleDateString()}</span>
                          {call.assignedTo && <span>Assigned to: {call.assignedTo}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🔧</span> Recent Services ({customerServices.length})
                </h3>
                {customerServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No services found</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {customerServices.slice(0, 10).map((service) => (
                      <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{service.category}</h4>
                            {service.serviceDescription && (
                              <p className="text-sm text-gray-600">{service.serviceDescription}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                            {service.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Created: {new Date(service.createdAt).toLocaleDateString()}</span>
                          {service.completedAt && (
                            <span>Completed: {new Date(service.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;