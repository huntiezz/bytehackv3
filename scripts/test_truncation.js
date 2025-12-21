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

async function checkSchema() {
    const supabase = createClient(
        envVars.NEXT_PUBLIC_SUPABASE_URL,
        envVars.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'invite_codes' });

    if (error) {
        // Fallback: try to just select the column info via pg_catalog if we have a way?
        // Usually we don't have a direct RPC for this unless defined.
        // Let's try to just insert a long code and see if it fails/truncates.
        console.log('No RPC found, trying to insert a long code...');
        const longCode = 'TEST_LONG_CODE_123456789';
        const { data: insertData, error: insertError } = await supabase
            .from('invite_codes')
            .insert({ code: longCode, uses: 0 })
            .select();

        if (insertError) {
            console.error('Insert Error:', insertError);
        } else {
            console.log('Insert Result:', insertData[0].code);
            if (insertData[0].code !== longCode) {
                console.log('TRUNCATION DETECTED!');
            } else {
                console.log('No truncation detected.');
            }
            // Cleanup
            await supabase.from('invite_codes').delete().eq('code', insertData[0].code);
        }
    } else {
        console.log('Table Info:', data);
    }
}

checkSchema();
