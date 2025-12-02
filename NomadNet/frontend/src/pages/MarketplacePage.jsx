// src/pages/MarketplacePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ListingCard from '../components/marketplace/ListingCard';
import SearchFilters from '../components/marketplace/SearchFilters';
import Spinner from '../components/Spinner';
import { getAllListings } from '../services/marketplaceService';
import { isAuthenticated } from '../utils/authUtils';
import '../styles/marketplace.css';

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    priceType: searchParams.get('priceType') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1')
  });

  // Fetch listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllListings(filters);
      
      setListings(data.data.listings);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filters]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params[key] = filters[key];
      }
    });
    setSearchParams(params, { replace: true }); 
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      category: '',
      priceType: '',
      sort: 'newest',
      search: '',
      page: 1
    });
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        {/* Header */}
        <div className="marketplace-header">
          <h1 className="marketplace-title">🛍️ Marketplace</h1>
          <p className="marketplace-subtitle">
            Discover items, services, and skills from digital nomads around the world
          </p>

          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search for items, services, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              Search
            </button>
            {isAuthenticated() && (
              <Link to="/marketplace/create" className="create-listing-btn">
                + Create Listing
              </Link>
            )}
          </form>
        </div>

        {/* Content */}
        <div className="marketplace-content">
          {/* Filters */}
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {/* Listings */}
          <div className="listings-section">
            {loading ? (
              <div className="loading-container">
                <Spinner />
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h2 className="empty-state-title">Error Loading Listings</h2>
                <p className="empty-state-text">{error}</p>
                <button onClick={fetchListings} className="create-listing-btn">
                  Try Again
                </button>
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h2 className="empty-state-title">No Listings Found</h2>
                <p className="empty-state-text">
                  {filters.search 
                    ? `No results for "${filters.search}". Try different keywords.`
                    : 'Be the first to create a listing!'}
                </p>
                {isAuthenticated() && (
                  <Link to="/marketplace/create" className="create-listing-btn">
                    Create First Listing
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="listings-header">
                  <span className="listings-count">
                    {pagination.total} {pagination.total === 1 ? 'listing' : 'listings'} found
                  </span>
                </div>

                <div className="listings-grid">
                  {listings.map(listing => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;