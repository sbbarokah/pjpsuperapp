import { cn } from "@/lib/utils"; // Asumsi Anda punya cn dari template

type RoleBadgeProps = {
  role: string;
  className?: string;
};

/**
 * Menampilkan 'badge' berwarna berdasarkan peran pengguna.
 */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  let colorClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"; // Default

  // Kustomisasi warna berdasarkan peran
  switch (role.toLowerCase()) {
    case "superadmin":
      colorClasses = "bg-danger/10 text-danger-dark dark:bg-danger/20 dark:text-danger";
      break;
    case "admin_village":
    case "admin_group":
      colorClasses = "bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary";
      break;
    case "parent":
      colorClasses = "bg-warning/10 text-warning-dark dark:bg-warning/20 dark:text-warning";
      break;
    case "user":
      colorClasses = "bg-success/10 text-success-dark dark:bg-success/20 dark:text-success";
      break;
  }

  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-medium capitalize",
        colorClasses,
        className
      )}
    >
      {role.replace("_", " ")}
    </span>
  );
}