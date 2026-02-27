import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationCreate = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
};

/**
 * Create a notification for a single user (service-role bypasses RLS).
 * Column names match the DB schema: message, read (not body, is_read)
 */
export async function notifyUser(n: NotificationCreate) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.body ?? "",   // DB column is "message"
      href: n.href ?? null,
      read: false,             // DB column is "read"
    });
    if (error) console.error("notifyUser insert error", error);
  } catch (e) {
    console.error("notifyUser failed", e);
  }
}

/**
 * Notify all users with specified roles.
 */
export async function notifyRoles(args: {
  roles: string[];
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
}) {
  try {
    const admin = createAdminClient();
    const { data: users, error } = await admin
      .from("users")
      .select("id")
      .in("role", args.roles);

    if (error) {
      console.error("notifyRoles users query error", error);
      return;
    }
    if (!users || users.length === 0) return;

    const insertRows = users.map((u) => ({
      user_id: u.id,
      type: args.type,
      title: args.title,
      message: args.body ?? "",  // DB column is "message"
      href: args.href ?? null,
      read: false,               // DB column is "read"
    }));

    const { error: insertError } = await admin
      .from("notifications")
      .insert(insertRows);

    if (insertError) console.error("notifyRoles insert error", insertError);
  } catch (e) {
    console.error("notifyRoles failed", e);
  }
}
