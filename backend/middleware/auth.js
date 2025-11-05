const { supabase } = require('../config/supabase');

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No valid token provided'
            });
        }

        const token = authHeader.substring(7);

        // Get user from token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

module.exports = { authenticateUser };