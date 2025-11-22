// src/components/marketplace/SearchFilters.jsx
import React from 'react';
import { CATEGORIES, TYPES, PRICE_TYPES } from '../../services/marketplaceService';

const SearchFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className="filters-sidebar">
      <h3 className="filters-title">Filters</h3>

      {/* Type Filter */}
      <div className="filter-group">
        <label>Type</label>
        <div className="filter-chips">
          <button
            className={`filter-chip ${!filters.type ? 'active' : ''}`}
            onClick={() => onFilterChange('type', '')}
          >
            All
          </button>
          {TYPES.map(type => (
            <button
              key={type.value}
              className={`filter-chip ${filters.type === type.value ? 'active' : ''}`}
              onClick={() => onFilterChange('type', type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={filters.category || ''}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Price Type Filter */}
      <div className="filter-group">
        <label>Price</label>
        <div className="filter-chips">
          <button
            className={`filter-chip ${!filters.priceType ? 'active' : ''}`}
            onClick={() => onFilterChange('priceType', '')}
          >
            All
          </button>
          {PRICE_TYPES.map(price => (
            <button
              key={price.value}
              className={`filter-chip ${filters.priceType === price.value ? 'active' : ''}`}
              onClick={() => onFilterChange('priceType', price.value)}
            >
              {price.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Filter */}
      <div className="filter-group">
        <label htmlFor="sort">Sort By</label>
        <select
          id="sort"
          value={filters.sort || 'newest'}
          onChange={(e) => onFilterChange('sort', e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="views">Most Viewed</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Filters */}
      <button className="clear-filters-btn" onClick={onClearFilters}>
        Clear All Filters
      </button>
    </div>
  );
};

export default SearchFilters;