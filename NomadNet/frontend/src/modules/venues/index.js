// src/modules/venues/index.js
// Central export file for all venue-related modules

// Components
export { default as CheckInModal } from '../../components/venues/CheckInModal';
export { default as CreateVenue } from '../../components/venues/CreateVenue';
export { default as NearbyNomads } from '../../components/venues/NearbyNomads';
export { default as VenueCard } from '../../components/venues/VenueCard';
export { default as VenueDetail } from '../../components/venues/VenueDetail';
export { default as VenueFilters } from '../../components/venues/VenueFilters';
export { default as VenueList } from '../../components/venues/VenueList';
export { default as VenueMap } from '../../components/venues/VenueMap';

// Pages
export { default as VenuesPage } from '../../pages/venues/VenuesPage';
export { default as VenueDetailsPage } from '../../pages/venues/VenueDetails';

// Hooks
export { 
  useVenues, 
  useVenueDetails, 
  useCategories 
} from '../../hooks/useVenues';
export { useGeolocation } from '../../hooks/useGeolocation';

// Services
export { default as venueService } from '../../services/venueService';

// Constants
export {
  VENUE_CATEGORIES,
  VENUE_AMENITIES,
  DURATION_OPTIONS,
  RATING_CATEGORIES,
  DISTANCE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  VIEW_MODES,
  DEFAULT_FILTERS,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  PHOTO_CONSTRAINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  formatDistance,
  formatTimeAgo,
  isValidCoordinate,
  validatePhotoFile
} from '../../constants/VenueConstants';

/**
 * Usage Examples:
 * 
 * // Import everything you need from one place
 * import { 
 *   VenueCard, 
 *   VenueList, 
 *   useVenues, 
 *   venueService,
 *   VENUE_CATEGORIES 
 * } from './modules/venues';
 * 
 * // Or import individually
 * import { VenueCard } from './modules/venues';
 */