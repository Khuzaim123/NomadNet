// config/socket.js

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// ======================
// 🔌 Initialize Socket.IO
// ======================
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  console.log('🔌 Socket.IO initialized');

  // ======================
  // 🔐 Authentication Middleware
  // ======================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      
      console.log(`✅ Socket authenticated: ${user.username} (${socket.id})`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // ======================
  // 📡 Connection Handler
  // ======================
  io.on('connection', (socket) => {
    console.log(`\n🔗 New socket connection: ${socket.user.username} (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Set user online
    setUserOnline(socket.userId);

    // ======================
    // 📍 Location-Based Rooms
    // ======================
    
    // Join geographic area room
    socket.on('map:join', async ({ longitude, latitude, radius = 5000 }) => {
      try {
        console.log(`📍 ${socket.user.username} joining map area: [${longitude}, ${latitude}] radius: ${radius}m`);

        // Create room name based on geohash or grid
        const gridRoom = getGeographicRoom(longitude, latitude);
        
        // Leave previous map rooms
        const currentRooms = Array.from(socket.rooms);
        currentRooms.forEach(room => {
          if (room.startsWith('map:')) {
            socket.leave(room);
          }
        });

        // Join new map room
        socket.join(gridRoom);
        socket.currentMapRoom = gridRoom;
        socket.mapCenter = { longitude, latitude, radius };

        console.log(`✅ Joined map room: ${gridRoom}`);

        // Send initial nearby data
        socket.emit('map:joined', {
          room: gridRoom,
          center: { longitude, latitude },
          radius
        });

        // Broadcast user joined to others in the area
        socket.to(gridRoom).emit('map:user-entered', {
          userId: socket.userId,
          username: socket.user.username,
          displayName: socket.user.displayName,
          avatar: socket.user.avatar,
          location: { longitude, latitude }
        });
      } catch (error) {
        console.error('Map join error:', error);
        socket.emit('error', { message: 'Failed to join map area' });
      }
    });

    // ======================
    // 📍 Real-Time Location Updates
    // ======================
    
    socket.on('map:update-location', async ({ longitude, latitude }) => {
      try {
        console.log(`📍 Location update from ${socket.user.username}: [${longitude}, ${latitude}]`);

        // Update user's location in database
        await User.findByIdAndUpdate(socket.userId, {
          currentLocation: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          lastActive: Date.now()
        });

        // Check if user needs to switch map rooms
        const newGridRoom = getGeographicRoom(longitude, latitude);
        
        if (newGridRoom !== socket.currentMapRoom) {
          // Leave old room
          if (socket.currentMapRoom) {
            socket.to(socket.currentMapRoom).emit('map:user-left', {
              userId: socket.userId
            });
            socket.leave(socket.currentMapRoom);
          }

          // Join new room
          socket.join(newGridRoom);
          socket.currentMapRoom = newGridRoom;

          // Notify new room
          socket.to(newGridRoom).emit('map:user-entered', {
            userId: socket.userId,
            username: socket.user.username,
            displayName: socket.user.displayName,
            avatar: socket.user.avatar,
            profession: socket.user.profession,
            location: { longitude, latitude }
          });
        } else {
          // Broadcast location update to current room
          if (socket.currentMapRoom) {
            socket.to(socket.currentMapRoom).emit('map:location-updated', {
              userId: socket.userId,
              location: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            });
          }
        }

        socket.emit('map:location-update-success');
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // ======================
    // 🔔 Request Nearby Updates
    // ======================
    
    socket.on('map:request-updates', () => {
      if (socket.currentMapRoom) {
        socket.emit('map:updates-enabled', {
          room: socket.currentMapRoom
        });
      }
    });

    // ======================
    // 💬 Ping/Pong for Connection Health
    // ======================
    
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // ======================
    // 👋 Disconnect Handler
    // ======================
    
    socket.on('disconnect', async () => {
      console.log(`❌ Socket disconnected: ${socket.user.username} (${socket.id})`);

      // Set user offline after 30 seconds (grace period)
      setTimeout(async () => {
        const userSockets = await io.in(`user:${socket.userId}`).fetchSockets();
        
        if (userSockets.length === 0) {
          await setUserOffline(socket.userId);
          
          // Notify map room
          if (socket.currentMapRoom) {
            io.to(socket.currentMapRoom).emit('map:user-offline', {
              userId: socket.userId
            });
          }
        }
      }, 30000);

      // Notify map room user left
      if (socket.currentMapRoom) {
        socket.to(socket.currentMapRoom).emit('map:user-left', {
          userId: socket.userId
        });
      }
    });

    // ======================
    // ❌ Error Handler
    // ======================
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// ======================
// 🌍 Geographic Room Helper (Grid-based)
// ======================
const getGeographicRoom = (longitude, latitude) => {
  // Create a grid system (e.g., 0.1 degree squares ≈ 11km)
  const gridSize = 0.1;
  const gridLng = Math.floor(longitude / gridSize) * gridSize;
  const gridLat = Math.floor(latitude / gridSize) * gridSize;
  
  return `map:${gridLat.toFixed(1)}_${gridLng.toFixed(1)}`;
};

// ======================
// 👤 User Status Helpers
// ======================
const setUserOnline = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastActive: Date.now()
    });
    console.log(`✅ User ${userId} is now online`);
  } catch (error) {
    console.error('Set user online error:', error);
  }
};

const setUserOffline = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastActive: Date.now()
    });
    console.log(`⚪ User ${userId} is now offline`);
  } catch (error) {
    console.error('Set user offline error:', error);
  }
};

// ======================
// 📤 Get Socket Instance
// ======================
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// ======================
// 📤 Exports
// ======================
module.exports = {
  initializeSocket,
  getIO,
  getGeographicRoom
};