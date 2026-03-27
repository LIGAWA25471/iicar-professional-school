import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[v0] Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCertificate() {
  try {
    console.log("[v0] Checking for certificate: IICAR-2026-L05O8E7M");

    const { data, error, status } = await supabase
      .from("certificates")
      .select("*")
      .ilike("cert_id", "IICAR-2026-L05O8E7M");

    console.log("[v0] Query status:", status);
    console.log("[v0] Query error:", error);
    console.log("[v0] Found certificates:", data?.length);

    if (data && data.length > 0) {
      console.log("[v0] Certificate found:");
      console.log(JSON.stringify(data[0], null, 2));
      return true;
    } else {
      console.log("[v0] Certificate NOT found in database");
      return false;
    }
  } catch (err) {
    console.error("[v0] Error checking certificate:", err);
    return false;
  }
}

checkCertificate();
