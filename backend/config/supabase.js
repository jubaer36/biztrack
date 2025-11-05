const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Create Supabase client for client-side operations (with RLS)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

// Create Supabase client for backend operations (bypasses RLS - we handle auth at API level)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: false,
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

module.exports = {
    supabase,
    supabaseAdmin
};