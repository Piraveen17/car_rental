import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationCreate = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
};

/**
 * Create a notification for a single user using the service-role client.
 * This bypasses RLS and is safe to call from server route handlers.
 */
export async function notifyUser(n: NotificationCreate) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      href: n.href ?? null,
      is_read: false,
    });
    if (error) console.error("notifyUser insert error", error);
  } catch (e) {
    console.error("notifyUser failed", e);
  }
}

/**
 * Notify all users whose `public.users.role` is in `roles`.
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
    const rows = (users || []).map((u: any) => ({
      user_id: u.id,
      type: args.type,
      title: args.title,
      body: args.body ?? null,
      href: args.href ?? null,
      is_read: false,
    }));
    if (rows.length === 0) return;

    const { error: insertError } = await admin.from("notifications").insert(rows);
    if (insertError) console.error("notifyRoles insert error", insertError);
  } catch (e) {
    console.error("notifyRoles failed", e);
  }
}
