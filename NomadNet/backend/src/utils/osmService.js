// utils/osmService.js
const axios = require('axios');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Build Overpass QL query based on category
function buildOverpassQuery({ latitude, longitude, radius, category }) {
  const lat = latitude;
  const lon = longitude;
  const R = radius;

  // Decide which OSM tags to query based on your category
  // You can tune this mapping over time
  let filters = [];

  if (!category || category === '') {
    // All relevant types
    filters = [
      'node(around:R,lat,lon)[amenity=cafe]',
      'node(around:R,lat,lon)[amenity=restaurant]',
      'node(around:R,lat,lon)[amenity=bar]',
      'node(around:R,lat,lon)[amenity=pub]',
      'node(around:R,lat,lon)[leisure=park]',
      'node(around:R,lat,lon)[amenity=library]',
      'node(around:R,lat,lon)[tourism=hotel]',
      'node(around:R,lat,lon)[office=coworking]'
    ];
  } else {
    switch (category) {
      case 'cafe':
        filters = ['node(around:R,lat,lon)[amenity=cafe]'];
        break;
      case 'coworking':
        filters = ['node(around:R,lat,lon)[office=coworking]'];
        break;
      case 'restaurant':
        filters = ['node(around:R,lat,lon)[amenity=restaurant]'];
        break;
      case 'bar':
        filters = [
          'node(around:R,lat,lon)[amenity=bar]',
          'node(around:R,lat,lon)[amenity=pub]'
        ];
        break;
      case 'park':
        filters = ['node(around:R,lat,lon)[leisure=park]'];
        break;
      case 'library':
        filters = ['node(around:R,lat,lon)[amenity=library]'];
        break;
      case 'hotel':
        filters = ['node(around:R,lat,lon)[tourism=hotel]'];
        break;
      default:
        // Fallback: any amenity
        filters = ['node(around:R,lat,lon)[amenity]'];
        break;
    }
  }

  const filterBlock = filters
    .map(f => f.replace('lat', lat).replace('lon', lon).replace('R', R))
    .join(';\n  ');

  // out center; if we also queried ways/relations; but here we only use nodes
  const query = `
[out:json][timeout:25];
(
  ${filterBlock};
);
out body;
`;

  return query;
}

/**
 * Fetch places from Overpass around a location.
 *
 * @param {Object} options
 * @param {number} options.latitude
 * @param {number} options.longitude
 * @param {number} options.radius - in meters
 * @param {string} [options.category] - your internal category
 */
async function fetchOSMPlaces({ latitude, longitude, radius, category }) {
  const query = buildOverpassQuery({ latitude, longitude, radius, category });

  const res = await axios.post(OVERPASS_URL, query, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'User-Agent': 'NomadNet/1.0 (your-email-or-url-here)'
    }
  });

  return res.data.elements || [];
}

module.exports = {
  fetchOSMPlaces
};