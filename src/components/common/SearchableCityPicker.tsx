import React, { useState, useEffect, useMemo } from 'react';
import { cityService } from '../../services/cityService';
import { City } from '../../types';
import { Search, MapPin, Check, Loader2 } from 'lucide-react';
import { Badge } from './Badge';

export interface SearchableCityPickerProps {
  label?: string;
  selectedCityId?: string;
  onSelectCity: (city: City) => void;
  error?: string;
}

export const SearchableCityPicker: React.FC<SearchableCityPickerProps> = ({
  label = 'Select Destination City',
  selectedCityId,
  onSelectCity,
  error,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadCities = async () => {
      setIsLoading(true);
      try {
        const data = await cityService.getCities();
        if (isMounted) {
          setCities(data.cities);
        }
      } catch (err) {
        console.error('Failed to load city picker catalog', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadCities();
    return () => {
      isMounted = false;
    };
  }, []);

  const regions = useMemo(() => {
    const set = new Set(cities.map((c) => c.region).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [cities]);

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      const matchesSearch =
        city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.country.toLowerCase().includes(search.toLowerCase()) ||
        city.region.toLowerCase().includes(search.toLowerCase());
      const matchesRegion = selectedRegion === 'ALL' || city.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [cities, search, selectedRegion]);

  const selectedCity = useMemo(() => {
    return cities.find((c) => c._id === selectedCityId);
  }, [cities, selectedCityId]);

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#2F2930] font-display">
            {label}
          </label>
          {selectedCity && (
            <span className="text-[11px] font-bold text-[#017E84] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Selected: {selectedCity.name}
            </span>
          )}
        </div>
      )}

      {/* Search & Region Chips */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F6A70]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Type city name (e.g. Udaipur, Manali, Goa, Varanasi, Paris)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E5E1E4] bg-white pl-9 pr-3 py-2 text-sm text-[#2F2930] placeholder-[#6F6A70]/60 focus:border-[#714B67] focus:outline-none focus:ring-1 focus:ring-[#714B67] font-medium"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6F6A70]">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Region Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {regions.slice(0, 6).map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setSelectedRegion(region)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRegion === region
                  ? 'bg-[#714B67] text-white shadow-2xs'
                  : 'bg-[#F4EEF3] text-[#6F6A70] hover:bg-[#EAE1E8] hover:text-[#2F2930] border border-[#E5E1E4]'
              }`}
            >
              {region === 'ALL' ? 'All Regions' : region}
            </button>
          ))}
        </div>
      </div>

      {/* City Option Grid */}
      <div className="border border-[#E5E1E4] rounded-xl p-2 bg-[#F7F7F6]/50 max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {filteredCities.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#6F6A70] font-medium">
            {isLoading ? 'Loading catalog cities...' : 'No destination cities found.'}
          </div>
        ) : (
          filteredCities.map((city) => {
            const isSelected = city._id === selectedCityId;
            return (
              <div
                key={city._id}
                onClick={() => onSelectCity(city)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#F4EEF3] border border-[#714B67]/40 shadow-xs'
                    : 'bg-white hover:bg-[#F4EEF3]/50 border border-[#E5E1E4]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-9 h-9 rounded-md object-cover ring-1 ring-[#E5E1E4]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#2F2930] font-display">{city.name}</span>
                      <span className="text-[10px] text-[#6F6A70] font-medium">• {city.country}</span>
                    </div>
                    <p className="text-[10px] text-[#6F6A70] flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-[#017E84]" /> {city.region}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={city.costIndex === 'Budget' ? 'success' : city.costIndex === 'Luxury' ? 'warning' : 'teal'} size="sm">
                    {city.costIndex}
                  </Badge>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#714B67] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="text-xs text-[#B85C5C] font-medium">{error}</p>}
    </div>
  );
};
