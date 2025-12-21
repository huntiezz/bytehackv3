const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envFile = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^"|"$/g, '');
    }
});

async function checkInvites() {
    const supabase = createClient(
        envVars.NEXT_PUBLIC_SUPABASE_URL,
        envVars.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking invites with URL:', envVars.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching invites:', error);
    } else {
        console.log('Recent Invite Codes:', JSON.stringify(data, null, 2));
    }
}

checkInvites();
