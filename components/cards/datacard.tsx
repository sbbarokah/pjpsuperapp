import Link from "next/link";

type DataCardProps = {
  /** Konten di dalam kartu */
  children: React.ReactNode;
  /** Node React untuk 'aksi' (cth: tombol dropdown) */
  actions?: React.ReactNode;
  /** Jika diisi, seluruh kartu akan menjadi tautan <Link> */
  href?: string;
  /** ClassName tambahan untuk kustomisasi */
  className?: string;
};

/**
 * Komponen pembungkus kartu data dasar.
 * Menyediakan styling container (border, shadow, bg) yang konsisten
 * dengan tema Anda dan slot 'actions' di kanan atas.
 */
export function DataCard({ children, actions, href, className }: DataCardProps) {
  const commonStyles =
    "relative w-full rounded-lg border border-stroke bg-white p-4 transition-all duration-300 ease-in-out hover:shadow-md dark:border-strokedark dark:bg-boxdark";

  const content = (
    <>
      {actions && (
        <div className="absolute right-2 top-2 z-10">{actions}</div>
      )}
      <div className="relative z-0">{children}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${commonStyles} ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`${commonStyles} ${className}`}>{content}</div>;
}