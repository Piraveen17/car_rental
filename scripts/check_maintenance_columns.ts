import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from("maintenance")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error querying maintenance:", error);
  } else {
    console.log("Maintenance columns:", Object.keys(data[0] || {}));
  }
}

check();
