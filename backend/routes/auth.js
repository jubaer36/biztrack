const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Register user with Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name || email.split('@')[0]
                }
            }
        });

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: data.user?.id,
                email: data.user?.email,
                name: data.user?.user_metadata?.name
            },
            session: data.session
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error during registration'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Sign in user with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                error: error.message
            });
        }

        res.json({
            message: 'Login successful',
            user: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name
            },
            session: data.session
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error during login'
        });
    }
});

// Logout user
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No valid token provided'
            });
        }

        const token = authHeader.substring(7);

        // Set the session for this request
        const { error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: req.body.refresh_token
        });

        if (error) {
            console.log('Session error:', error.message);
        }

        // Sign out user
        await supabase.auth.signOut();

        res.json({
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Internal server error during logout'
        });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
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

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            error: 'Internal server error while fetching profile'
        });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/reset-password'
        });

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.json({
            message: 'Password reset email sent successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Internal server error during password reset'
        });
    }
});

// Verify token middleware
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No valid token provided'
            });
        }

        const token = authHeader.substring(7);

        // Verify token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            error: 'Internal server error during token verification'
        });
    }
});

module.exports = router;