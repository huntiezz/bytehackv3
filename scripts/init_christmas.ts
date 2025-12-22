
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Running Fix Christmas Admin Script...");

    // 1. Initialize Settings
    const { error: settingsError } = await supabase
        .from('christmas_settings')
        .upsert({ id: true, is_enabled: true }, { onConflict: 'id' });

    if (settingsError) console.error("Settings Init Error:", settingsError);
    else console.log("Settings Initialized.");

    console.log("Since we can't easily alter RLS via client, we rely on the user running migrations or using the SQL editor.");
    console.log("However, inserting the row works via Service Role.");

    // Check if attempts count is visible
    const { count, error: countError } = await supabase
        .from('christmas_attempts')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error("Count Error:", countError);
    else console.log("Current Attempts Count:", count);
}

run();
