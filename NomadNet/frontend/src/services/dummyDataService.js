// src/services/dummyDataService.js

/**
 * Generate dummy users near a given location
 * @param {number} longitude - User's longitude
 * @param {number} latitude - User's latitude
 * @param {number} count - Number of dummy users to generate (default: 8)
 * @param {number} maxRadiusMeters - Maximum distance from user in meters (default: 500)
 * @returns {Array} Array of dummy user objects
 */
export const generateDummyUsers = (longitude, latitude, count = 8, maxRadiusMeters = 500) => {
    const dummyNames = [
        { first: 'Alex', last: 'Morgan', profession: 'Digital Nomad' },
        { first: 'Sarah', last: 'Chen', profession: 'Software Developer' },
        { first: 'Mike', last: 'Johnson', profession: 'UX Designer' },
        { first: 'Emma', last: 'Williams', profession: 'Content Creator' },
        { first: 'James', last: 'Brown', profession: 'Marketing Consultant' },
        { first: 'Olivia', last: 'Davis', profession: 'Freelance Writer' },
        { first: 'Daniel', last: 'Martinez', profession: 'Data Scientist' },
        { first: 'Sophia', last: 'Garcia', profession: 'Product Manager' },
        { first: 'Lucas', last: 'Anderson', profession: 'Photographer' },
        { first: 'Ava', last: 'Taylor', profession: 'Web Developer' }
    ];

    const avatarColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];

    const dummyUsers = [];

    for (let i = 0; i < Math.min(count, dummyNames.length); i++) {
        const person = dummyNames[i];

        // Generate random offset within specified radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * maxRadiusMeters;

        // Convert meters to degrees (approximate)
        // 1 degree latitude ≈ 111,320 meters
        // 1 degree longitude ≈ 111,320 * cos(latitude) meters
        const latOffset = (distance * Math.cos(angle)) / 111320;
        const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(latitude * Math.PI / 180));

        const newLat = latitude + latOffset;
        const newLng = longitude + lngOffset;

        dummyUsers.push({
            _id: `dummy-user-${i + 1}`,
            type: 'user',
            username: `${person.first.toLowerCase()}${person.last.toLowerCase()}`,
            displayName: `${person.first} ${person.last}`,
            avatar: null, // Could use a placeholder avatar service
            avatarColor: avatarColors[i % avatarColors.length],
            profession: person.profession,
            bio: `Passionate ${person.profession.toLowerCase()} exploring the world.`,
            location: {
                type: 'Point',
                coordinates: [newLng, newLat]
            },
            isDummy: true // Flag to identify dummy data
        });
    }

    return dummyUsers;
};

/**
 * Calculate distance between two coordinates in meters
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export default {
    generateDummyUsers,
    calculateDistance
};
