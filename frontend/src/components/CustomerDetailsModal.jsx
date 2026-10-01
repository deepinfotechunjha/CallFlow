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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'COMPLETED_AND_COLLECTED':
        return 'bg-[#2C2C2C] text-white';
      case 'PENDING':
        return 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30';
      case 'ASSIGNED':
      case 'COMPLETED_NOT_COLLECTED':
        return 'bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5]';
      default:
        return 'bg-[#F8F9FA] text-[#666666] border border-[#E0E2E5]';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-[#E0E2E5] flex flex-col">
        {/* Header */}
        <div className="bg-[#2C2C2C] text-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-[#FF2E46] flex items-center justify-center text-lg font-bold shadow-xs">
                {customer.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A71]">CUSTOMER PROFILE</span>
                <h2 className="text-lg sm:text-xl font-bold">{customer.name}</h2>
                <p className="text-xs text-[#E0E2E5] mt-0.5">{customer.phone}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#E0E2E5] hover:text-white text-lg font-bold p-1 leading-none rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-7 h-7 border-3 border-[#FF2E46] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Information */}
              <div className="bg-[#F8F9FA] rounded-lg p-4 border border-[#E0E2E5]">
                <h3 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-2.5">
                  Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-[#666666]">Email:</span>
                    <p className="font-semibold text-[#2C2C2C] mt-0.5">{customer.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-[#666666]">Phone:</span>
                    <p className="font-semibold text-[#2C2C2C] mt-0.5">{customer.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#666666]">Address:</span>
                    <p className="font-semibold text-[#2C2C2C] mt-0.5">{customer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-lg border border-[#E0E2E5] text-center shadow-xs">
                  <div className="text-lg font-bold text-[#2C2C2C]">{customer.outsideCalls || 0}</div>
                  <div className="text-[11px] font-semibold text-[#666666] uppercase mt-0.5">Outside Calls</div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-[#E0E2E5] text-center shadow-xs">
                  <div className="text-lg font-bold text-[#2C2C2C]">{customer.carryInServices || 0}</div>
                  <div className="text-[11px] font-semibold text-[#666666] uppercase mt-0.5">Workshop Services</div>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-[#E0E2E5] text-center shadow-xs">
                  <div className="text-lg font-bold text-[#FF2E46]">{customer.totalInteractions || 0}</div>
                  <div className="text-[11px] font-semibold text-[#FF2E46] uppercase mt-0.5">Interactions</div>
                </div>
              </div>

              {/* Calls History */}
              <div>
                <h3 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Service Calls History ({customerCalls.length})
                </h3>
                {customerCalls.length === 0 ? (
                  <p className="text-xs text-[#666666] text-center py-3 bg-[#F8F9FA] rounded-lg">No recorded service calls</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-[#E0E2E5] border border-[#E0E2E5] rounded-lg p-3 bg-white">
                    {customerCalls.map((call) => (
                      <div key={call.id} className="pt-2 first:pt-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-[#2C2C2C]">{call.problem}</p>
                            <p className="text-[11px] text-[#666666]">Category: {call.category} • {new Date(call.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${getStatusBadge(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Workshop Services */}
              <div>
                <h3 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Workshop Services History ({customerServices.length})
                </h3>
                {customerServices.length === 0 ? (
                  <p className="text-xs text-[#666666] text-center py-3 bg-[#F8F9FA] rounded-lg">No workshop service jobs</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-[#E0E2E5] border border-[#E0E2E5] rounded-lg p-3 bg-white">
                    {customerServices.map((service) => (
                      <div key={service.id} className="pt-2 first:pt-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-[#2C2C2C]">{service.category}</p>
                            <p className="text-[11px] text-[#666666]">{service.serviceDescription || 'No description'} • {new Date(service.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${getStatusBadge(service.status)}`}>
                            {service.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-3.5 border-t border-[#E0E2E5] bg-[#F8F9FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;