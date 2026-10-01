import React, { useState, useEffect } from 'react';
import useCitiesAndAreas from '../hooks/useCitiesAndAreas';
import useClickOutside from '../hooks/useClickOutside';

const CityAreaSelector = ({ 
  selectedCity, 
  selectedArea, 
  onCityChange, 
  onAreaChange, 
  required = false,
  disabled = false 
}) => {
  const {
    cities,
    areas,
    loading,
    error,
    fetchAreas,
    addCity,
    addArea,
    setError
  } = useCitiesAndAreas();

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cityDropdownRef = useClickOutside(() => setShowCityDropdown(false));
  const areaDropdownRef = useClickOutside(() => setShowAreaDropdown(false));

  // Filter cities based on search
  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Filter areas based on selected city and search
  const filteredAreas = areas.filter(area => {
    const matchesCity = selectedCity ? area.cityId === selectedCity.id : true;
    const matchesSearch = area.name.toLowerCase().includes(areaSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  // Fetch areas when city changes
  useEffect(() => {
    if (selectedCity) {
      fetchAreas(selectedCity.id);
      // Clear area selection when city changes
      if (selectedArea && selectedArea.cityId !== selectedCity.id) {
        onAreaChange(null);
      }
    } else {
      onAreaChange(null);
    }
  }, [selectedCity]);

  const handleCitySelect = (city) => {
    if (city === 'ADD_NEW') {
      setShowAddCityModal(true);
      setShowCityDropdown(false);
    } else {
      onCityChange(city);
      setShowCityDropdown(false);
      setCitySearch('');
    }
  };

  const handleAreaSelect = (area) => {
    if (area === 'ADD_NEW') {
      if (!selectedCity) {
        alert('Please select a city first');
        return;
      }
      setShowAddAreaModal(true);
      setShowAreaDropdown(false);
    } else {
      onAreaChange(area);
      setShowAreaDropdown(false);
      setAreaSearch('');
    }
  };

  const capitalize = (s) => s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase();

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newCity = await addCity(capitalize(newCityName));
      onCityChange(newCity);
      setNewCityName('');
      setShowAddCityModal(false);
      setError(null);
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName.trim() || !selectedCity) return;
    
    setIsSubmitting(true);
    try {
      const newArea = await addArea(capitalize(newAreaName), selectedCity.id);
      onAreaChange(newArea);
      setNewAreaName('');
      setShowAddAreaModal(false);
      setError(null);
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* City Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
          City {required && <span className="text-[#FF2E46]">*</span>}
        </label>
        <div className="relative" ref={cityDropdownRef}>
          {selectedCity ? (
            <div className="w-full px-3.5 py-2.5 border border-[#FF2E46]/30 rounded-xl bg-[#FFE8EB]/20 flex items-center justify-between text-sm">
              <span className="font-bold text-[#2C2C2C]">{selectedCity.name}</span>
              <button
                type="button"
                onClick={() => onCityChange(null)}
                disabled={disabled}
                className="w-6 h-6 rounded-full bg-white text-gray-400 hover:text-[#FF2E46] flex items-center justify-center font-bold text-sm leading-none border border-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              onClick={() => setShowCityDropdown(true)}
              placeholder="Select or search city"
              className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all placeholder:text-gray-400"
              required={required}
              disabled={disabled}
            />
          )}
          {showCityDropdown && !disabled && !selectedCity && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
              <div 
                onClick={() => handleCitySelect('ADD_NEW')}
                className="sticky top-0 px-3.5 py-2.5 bg-[#FFE8EB]/50 hover:bg-[#FFE8EB] cursor-pointer font-bold text-xs uppercase tracking-wider text-[#FF2E46] border-b border-[#FF2E46]/20 z-10 transition-colors"
              >
                + Add New City
              </div>
              <div className="overflow-y-auto max-h-52">
                {loading ? (
                  <div className="px-3.5 py-2.5 text-gray-400 text-xs">Loading...</div>
                ) : filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <div
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className="px-3.5 py-2 hover:bg-[#FFE8EB]/20 cursor-pointer text-sm font-medium text-[#2C2C2C] transition-colors"
                    >
                      {city.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3.5 py-2.5 text-gray-400 text-xs">No cities found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
          Area {required && <span className="text-[#FF2E46]">*</span>}
        </label>
        <div className="relative" ref={areaDropdownRef}>
          {selectedArea ? (
            <div className="w-full px-3.5 py-2.5 border border-[#FF2E46]/30 rounded-xl bg-[#FFE8EB]/20 flex items-center justify-between text-sm">
              <span className="font-bold text-[#2C2C2C]">{selectedArea.name}</span>
              <button
                type="button"
                onClick={() => onAreaChange(null)}
                disabled={disabled}
                className="w-6 h-6 rounded-full bg-white text-gray-400 hover:text-[#FF2E46] flex items-center justify-center font-bold text-sm leading-none border border-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={areaSearch}
              onChange={(e) => {
                setAreaSearch(e.target.value);
                setShowAreaDropdown(true);
              }}
              onFocus={() => setShowAreaDropdown(true)}
              onClick={() => setShowAreaDropdown(true)}
              placeholder={selectedCity ? "Select or search area" : "Select city first"}
              className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all placeholder:text-gray-400 disabled:opacity-50"
              disabled={disabled || !selectedCity}
              required={required}
            />
          )}
          {showAreaDropdown && !disabled && selectedCity && !selectedArea && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
              <div 
                onClick={() => handleAreaSelect('ADD_NEW')}
                className="sticky top-0 px-3.5 py-2.5 bg-[#FFE8EB]/50 hover:bg-[#FFE8EB] cursor-pointer font-bold text-xs uppercase tracking-wider text-[#FF2E46] border-b border-[#FF2E46]/20 z-10 transition-colors"
              >
                + Add New Area
              </div>
              <div className="overflow-y-auto max-h-52">
                {loading ? (
                  <div className="px-3.5 py-2.5 text-gray-400 text-xs">Loading...</div>
                ) : filteredAreas.length > 0 ? (
                  filteredAreas.map((area) => (
                    <div
                      key={area.id}
                      onClick={() => handleAreaSelect(area)}
                      className="px-3.5 py-2 hover:bg-[#FFE8EB]/20 cursor-pointer text-sm font-medium text-[#2C2C2C] transition-colors"
                    >
                      {area.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3.5 py-2.5 text-gray-400 text-xs">No areas found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#2C2C2C] mb-4">Add New City</h3>
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="Enter city name"
              className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all mb-4 placeholder:text-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
              autoFocus
            />
            {error && (
              <div className="text-[#FF2E46] text-xs font-semibold mb-4 bg-[#FFE8EB] p-2.5 rounded-lg border border-[#FF2E46]/20">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAddCity}
                disabled={isSubmitting || !newCityName.trim()}
                className="flex-1 bg-[#FF2E46] text-white py-2.5 px-4 rounded-full hover:bg-[#FF5A71] disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isSubmitting ? 'Adding...' : 'Add City'}
              </button>
              <button
                onClick={() => {
                  setShowAddCityModal(false);
                  setNewCityName('');
                  setError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 text-[#2C2C2C] py-2.5 px-4 rounded-full hover:bg-gray-200 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#2C2C2C] mb-4">
              Add New Area in <span className="text-[#FF2E46]">{selectedCity?.name}</span>
            </h3>
            <input
              type="text"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Enter area name"
              className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all mb-4 placeholder:text-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
              autoFocus
            />
            {error && (
              <div className="text-[#FF2E46] text-xs font-semibold mb-4 bg-[#FFE8EB] p-2.5 rounded-lg border border-[#FF2E46]/20">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAddArea}
                disabled={isSubmitting || !newAreaName.trim()}
                className="flex-1 bg-[#FF2E46] text-white py-2.5 px-4 rounded-full hover:bg-[#FF5A71] disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isSubmitting ? 'Adding...' : 'Add Area'}
              </button>
              <button
                onClick={() => {
                  setShowAddAreaModal(false);
                  setNewAreaName('');
                  setError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 text-[#2C2C2C] py-2.5 px-4 rounded-full hover:bg-gray-200 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityAreaSelector;