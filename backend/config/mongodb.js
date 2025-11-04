const mongoose = require('mongoose');

// Validate environment variables
if (!process.env.MONGODB_URI) {
    throw new Error('Missing required MongoDB environment variable. Please check your .env file.');
}

// MongoDB connection options
const options = {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        console.log('MongoDB will retry connection...');
        // Don't exit process, let the app continue and retry
        setTimeout(connectDB, 5000); // Retry after 5 seconds
    }
};

module.exports = { connectDB, mongoose };