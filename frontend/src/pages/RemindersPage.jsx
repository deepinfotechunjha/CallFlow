import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import ReminderCard from '../components/ReminderCard';
import ReminderTable from '../components/ReminderTable';
import DelayModal from '../components/DelayModal';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const { user } = useAuthStore();

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sales-reminders');
      setReminders(response.data);
    } catch (error) {
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAction = async (entryId, actionType) => {
    try {
      await apiClient.post(`/sales-entries/${entryId}/reminder-action`, {
        actionType,
        remark: `${actionType} action from reminders`
      });
      toast.success(`${actionType} logged successfully! Reminder reset to 15 days.`);
      fetchReminders();
    } catch (error) {
      toast.error(`Failed to log ${actionType}`);
    }
  };

  const handleDelayClick = (entry) => {
    setSelectedEntry(entry);
    setShowDelayModal(true);
  };

  const handleDelaySubmit = async (delayDate) => {
    try {
      await apiClient.post(`/sales-entries/${selectedEntry.id}/delay`, {
        delayDate: delayDate.toISOString()
      });
      toast.success('Reminder delayed successfully!');
      setShowDelayModal(false);
      setSelectedEntry(null);
      fetchReminders();
    } catch (error) {
      toast.error('Failed to delay reminder');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🔔</span> Reminders
          </h1>
          <p className="text-gray-600">
            Follow-up required for <span className="font-semibold text-red-600">{reminders.length}</span> entries
          </p>
        </div>
        <button
          onClick={fetchReminders}
          className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-blue-700 font-medium text-sm sm:text-base whitespace-nowrap shadow-sm transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 text-lg">🎉 No pending reminders!</p>
            <p className="text-gray-400 text-sm mt-2">All entries are up to date</p>
          </div>
        ) : (
          <ReminderTable
            reminders={reminders}
            onCallClick={(entry) => handleAction(entry.id, 'CALL')}
            onVisitClick={(entry) => handleAction(entry.id, 'VISIT')}
            onDelayClick={handleDelayClick}
          />
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reminders...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 text-lg">🎉 No pending reminders!</p>
              <p className="text-gray-400 text-sm mt-2">All entries are up to date</p>
            </div>
          ) : (
            reminders.map(entry => (
              <ReminderCard
                key={entry.id}
                entry={entry}
                onCallClick={() => handleAction(entry.id, 'CALL')}
                onVisitClick={() => handleAction(entry.id, 'VISIT')}
                onDelayClick={() => handleDelayClick(entry)}
              />
            ))
          )}
        </div>
      </div>

      {showDelayModal && selectedEntry && (
        <DelayModal
          entry={selectedEntry}
          onClose={() => {
            setShowDelayModal(false);
            setSelectedEntry(null);
          }}
          onSubmit={handleDelaySubmit}
        />
      )}
    </div>
  );
};

export default RemindersPage;
