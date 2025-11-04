const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with extended timeout and custom fetch
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
            detectSessionInUrl: false
        },
        global: {
            fetch: (url, options = {}) => {
                return fetch(url, {
                    ...options,
                    // Increase timeout to 30 seconds
                    signal: AbortSignal.timeout(30000),
                });
            }
        }
    }
);

module.exports = supabase;