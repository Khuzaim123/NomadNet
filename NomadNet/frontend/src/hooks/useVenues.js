// src/hooks/useVenues.js
import { useState, useEffect, useCallback } from 'react';
import venueService from '../services/venueService';

export const useVenues = (initialFilters = {}) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFiltersState] = useState({
    category: '',
    amenities: [],
    minRating: 0,
    radius: 5000,
    search: '',
    ...initialFilters
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const fetchVenues = useCallback(
    async (customFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const mergedFilters = { ...filters, ...customFilters };
        const response = await venueService.getAllVenues(mergedFilters);

        const data = response?.data || response;
        const venuesData = data?.data?.venues || data?.venues || [];

        setVenues(venuesData);

        // Pagination may be in data.pagination or as top-level fields
        const paginationData =
          data?.pagination || {
            page: data?.page,
            totalPages: data?.totalPages,
            total: data?.total
          };

        if (
          paginationData &&
          (paginationData.page != null ||
            paginationData.totalPages != null ||
            paginationData.total != null)
        ) {
          setPagination({
            page: paginationData.page || 1,
            totalPages: paginationData.totalPages || 1,
            total: paginationData.total || 0
          });
        } else {
          // Fallback if API doesn't send pagination info
          setPagination(prev => ({
            ...prev,
            page: 1,
            totalPages: 1,
            total: venuesData.length
          }));
        }
      } catch (err) {
        console.error('Fetch venues error:', err);
        setError(err.response?.data?.message || 'Failed to fetch venues');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchNearbyVenues = useCallback(
    async (longitude, latitude, customFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const mergedFilters = { ...filters, ...customFilters };
        const response = await venueService.getNearbyVenues(
          longitude,
          latitude,
          mergedFilters
        );

        const data = response?.data || response;
        const venuesData = data?.data?.venues || data?.venues || [];

        setVenues(venuesData);
      } catch (err) {
        console.error('Fetch nearby venues error:', err);
        setError(
          err.response?.data?.message || 'Failed to fetch nearby venues'
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const updateFilters = useCallback(newFilters => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  return {
    venues,
    loading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    fetchVenues,
    fetchNearbyVenues,
    setVenues,
    refetch
  };
};

export const useVenueDetails = venueId => {
  const [venue, setVenue] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVenueDetails = useCallback(async () => {
    if (!venueId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await venueService.getVenueById(venueId);
      const data = response?.data || response;

      setVenue(data?.data?.venue || data?.venue || null);
      setCheckIns(
        data?.data?.recentCheckIns ||
          data?.recentCheckIns ||
          []
      );
    } catch (err) {
      console.error('Fetch venue details error:', err);
      setError(
        err.response?.data?.message || 'Failed to load venue details'
      );
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  const checkInToVenue = useCallback(
    async checkInData => {
      try {
        const response = await venueService.checkIn(venueId, checkInData);
        const data = response?.data || response;
        const newCheckIn = data?.data?.checkIn || data?.checkIn;

        if (newCheckIn) {
          setCheckIns(prev => [newCheckIn, ...prev]);
        }

        return newCheckIn;
      } catch (err) {
        console.error('Check in error:', err);
        throw err;
      }
    },
    [venueId]
  );

  useEffect(() => {
    fetchVenueDetails();
  }, [fetchVenueDetails]);

  return {
    venue,
    checkIns,
    loading,
    error,
    refetch: fetchVenueDetails,
    checkIn: checkInToVenue
  };
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await venueService.getVenueCategories();
        const data = response?.data || response;

        setCategories(
          data?.data?.categories ||
            data?.categories ||
            venueService.VENUE_CATEGORIES
        );
      } catch (err) {
        console.error('Fetch categories error:', err);
        // Fallback to local categories
        setCategories(venueService.VENUE_CATEGORIES);
        setError(
          err.response?.data?.message || 'Failed to fetch categories'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export default useVenues;