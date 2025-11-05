const express = require('express');
const Business = require('../models/Business');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Middleware to verify authentication
const authenticateToken = async (req, res, next) => {
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

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

// Get all businesses for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const businesses = await Business.findByUserId(req.user.id);
        res.json({
            businesses: businesses.map(business => ({
                id: business.id,
                name: business.name,
                description: business.description,
                mongodb_link: business.mongodb_link,
                created_at: business.created_at,
                updated_at: business.updated_at
            }))
        });
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({
            error: 'Internal server error while fetching businesses'
        });
    }
});

// Get a specific business
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        // Check if business belongs to user
        if (business.user_id !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        res.json({
            business: {
                id: business.id,
                name: business.name,
                description: business.description,
                mongodb_link: business.mongodb_link,
                created_at: business.created_at,
                updated_at: business.updated_at
            }
        });
    } catch (error) {
        console.error('Error fetching business:', error);
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                error: 'Business not found'
            });
        }
        res.status(500).json({
            error: 'Internal server error while fetching business'
        });
    }
});

// Create a new business
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, mongodb_link } = req.body;

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Business name is required'
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                error: 'Business name must be less than 100 characters'
            });
        }

        if (description && description.length > 500) {
            return res.status(400).json({
                error: 'Business description must be less than 500 characters'
            });
        }

        if (mongodb_link && mongodb_link.length > 500) {
            return res.status(400).json({
                error: 'MongoDB link must be less than 500 characters'
            });
        }

        const business = await Business.create({
            name: name.trim(),
            description: description ? description.trim() : null,
            mongodb_link: mongodb_link ? mongodb_link.trim() : null,
            user_id: req.user.id
        });

        res.status(201).json({
            message: 'Business created successfully',
            business: {
                id: business.id,
                name: business.name,
                description: business.description,
                mongodb_link: business.mongodb_link,
                created_at: business.created_at,
                updated_at: business.updated_at
            }
        });
    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({
            error: 'Internal server error while creating business'
        });
    }
});

// Update a business
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, mongodb_link } = req.body;

        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(req.params.id, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Business name is required'
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                error: 'Business name must be less than 100 characters'
            });
        }

        if (description && description.length > 500) {
            return res.status(400).json({
                error: 'Business description must be less than 500 characters'
            });
        }

        if (mongodb_link && mongodb_link.length > 500) {
            return res.status(400).json({
                error: 'MongoDB link must be less than 500 characters'
            });
        }

        const business = await Business.update(req.params.id, {
            name: name.trim(),
            description: description ? description.trim() : null,
            mongodb_link: mongodb_link ? mongodb_link.trim() : null
        });

        res.json({
            message: 'Business updated successfully',
            business: {
                id: business.id,
                name: business.name,
                description: business.description,
                mongodb_link: business.mongodb_link,
                created_at: business.created_at,
                updated_at: business.updated_at
            }
        });
    } catch (error) {
        console.error('Error updating business:', error);
        res.status(500).json({
            error: 'Internal server error while updating business'
        });
    }
});

// Delete a business
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check if business exists and belongs to user
        const ownershipVerified = await Business.verifyOwnership(req.params.id, req.user.id);
        if (!ownershipVerified) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }

        await Business.delete(req.params.id);

        res.json({
            message: 'Business deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({
            error: 'Internal server error while deleting business'
        });
    }
});

module.exports = router;
