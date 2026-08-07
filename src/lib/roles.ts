export type Role = "student" | "docent" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  student: "Member",
  docent: "Board",
  admin: "Admin",
};
