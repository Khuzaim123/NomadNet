// src/context/VenueContext.jsx
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useSocket } from './SocketContext'; // Assuming you have this
import { useVenues } from '../hooks/useVenues';

const VenueContext = createContext(null);

export const VenueProvider = ({ children }) => {
  const socket = useSocket();
  const venueHook = useVenues();
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    amenities: [],
    minRating: 0,
    radius: 5000,
  });

  // Listen for real-time venue updates
  useEffect(() => {
    if (!socket) return;

    socket.on('venue:new', (venue) => {
      venueHook.setVenues((prev) => [venue, ...prev]);
    });

    socket.on('venue:update', (updatedVenue) => {
      venueHook.setVenues((prev) =>
        prev.map((v) => (v._id === updatedVenue._id ? updatedVenue : v))
      );
    });

    socket.on('venue:delete', ({ venueId }) => {
      venueHook.setVenues((prev) => prev.filter((v) => v._id !== venueId));
    });

    return () => {
      socket.off('venue:new');
      socket.off('venue:update');
      socket.off('venue:delete');
    };
  }, [socket, venueHook.setVenues]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const value = {
    ...venueHook,
    selectedVenue,
    setSelectedVenue,
    filters,
    updateFilters,
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
};

export const useVenueContext = () => {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error('useVenueContext must be used within a VenueProvider');
  }
  return context;
};

export default VenueContext;