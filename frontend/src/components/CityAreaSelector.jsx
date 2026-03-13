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

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newCity = await addCity(newCityName.trim());
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
      const newArea = await addArea(newAreaName.trim(), selectedCity.id);
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
        <label className="block text-xs sm:text-sm font-medium mb-1">
          City {required && '*'}
        </label>
        <div className="relative" ref={cityDropdownRef}>
          {selectedCity ? (
            <div className="w-full p-2 border rounded bg-blue-50 flex items-center justify-between text-sm">
              <span>{selectedCity.name}</span>
              <button
                type="button"
                onClick={() => onCityChange(null)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 font-bold text-lg leading-none disabled:opacity-50"
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
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              required={required}
              disabled={disabled}
            />
          )}
          {showCityDropdown && !disabled && !selectedCity && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
              <div 
                onClick={() => handleCitySelect('ADD_NEW')}
                className="sticky top-0 px-3 py-2 bg-green-50 hover:bg-green-100 cursor-pointer font-medium text-green-700 border-b-2 border-green-200 z-10"
              >
                + Add New City
              </div>
              <div className="overflow-y-auto max-h-52">
                {loading ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                ) : filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <div
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {city.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">No cities found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area Selector */}
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1">
          Area {required && '*'}
        </label>
        <div className="relative" ref={areaDropdownRef}>
          {selectedArea ? (
            <div className="w-full p-2 border rounded bg-green-50 flex items-center justify-between text-sm">
              <span>{selectedArea.name}</span>
              <button
                type="button"
                onClick={() => onAreaChange(null)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 font-bold text-lg leading-none disabled:opacity-50"
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
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={disabled || !selectedCity}
              required={required}
            />
          )}
          {showAreaDropdown && !disabled && selectedCity && !selectedArea && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
              <div 
                onClick={() => handleAreaSelect('ADD_NEW')}
                className="sticky top-0 px-3 py-2 bg-green-50 hover:bg-green-100 cursor-pointer font-medium text-green-700 border-b-2 border-green-200 z-10"
              >
                + Add New Area
              </div>
              <div className="overflow-y-auto max-h-52">
                {loading ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                ) : filteredAreas.length > 0 ? (
                  filteredAreas.map((area) => (
                    <div
                      key={area.id}
                      onClick={() => handleAreaSelect(area)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {area.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">No areas found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Add New City</h3>
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="Enter city name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
            />
            {error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddCity}
                disabled={isSubmitting || !newCityName.trim()}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
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
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">
              Add New Area in {selectedCity?.name}
            </h3>
            <input
              type="text"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Enter area name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
            />
            {error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddArea}
                disabled={isSubmitting || !newAreaName.trim()}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
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
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
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