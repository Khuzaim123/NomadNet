// src/components/Dashboard/FilterPanel.jsx
import React from 'react';
import { FiUsers, FiMapPin, FiShoppingBag, FiCheckCircle, FiSliders, FiX } from 'react-icons/fi'; // ✅ ADD FiX
import { RADIUS_OPTIONS } from '../../config/mapbox';

// ✅ UPDATE: Add isOpen and onClose props
const FilterPanel = ({ filters, radius, onFilterChange, onRadiusChange, summary, isOpen, onClose }) => {
  return (
    <div className={`filter-panel ${isOpen ? 'open' : ''}`}> {/* ✅ ADD open class */}
      <div className="filter-header">
        <div className="filter-header-title">
          <FiSliders />
          <h3>Filters</h3>
        </div>
        
        {/* ✅ ADD: Close button (mobile only) */}
        <button className="filter-close-btn" onClick={onClose} aria-label="Close filters">
          <FiX />
        </button>
      </div>

      <div className="filter-group">
        <label>Search Radius</label>
        <select 
          value={radius} 
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="radius-select"
        >
          {RADIUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Show on Map</label>
        
        <div className="filter-options">
          <FilterToggle
            icon={<FiUsers />}
            label="Users"
            count={summary.users}
            active={filters.users}
            color="#3b82f6"
            onChange={() => onFilterChange('users')}
          />

          <FilterToggle
            icon={<FiMapPin />}
            label="Venues"
            count={summary.venues}
            active={filters.venues}
            color="#10b981"
            onChange={() => onFilterChange('venues')}
          />

          <FilterToggle
            icon={<FiShoppingBag />}
            label="Marketplace"
            count={summary.marketplace}
            active={filters.marketplace}
            color="#f59e0b"
            onChange={() => onFilterChange('marketplace')}
          />

          <FilterToggle
            icon={<FiCheckCircle />}
            label="Check-ins"
            count={summary.checkIns}
            active={filters.checkIns}
            color="#ef4444"
            onChange={() => onFilterChange('checkIns')}
          />
        </div>
      </div>

      <div className="filter-summary">
        <p>
          Showing <strong>{summary.users + summary.venues + summary.marketplace + summary.checkIns}</strong> items
        </p>
      </div>
    </div>
  );
};

const FilterToggle = ({ icon, label, count, active, color, onChange }) => (
  <button
    className={`filter-toggle ${active ? 'active' : ''}`}
    onClick={onChange}
    style={{
      borderColor: active ? color : 'var(--border)',
      backgroundColor: active ? `${color}20` : 'transparent'
    }}
  >
    <div className="filter-toggle-icon" style={{ color: active ? color : 'var(--text-secondary)' }}>
      {icon}
    </div>
    <div className="filter-toggle-info">
      <span className="filter-toggle-label">{label}</span>
      <span className="filter-toggle-count" style={{ color: active ? color : 'var(--text-secondary)' }}>
        {count}
      </span>
    </div>
  </button>
);

export default FilterPanel;