import Link from "next/link";

interface BreadcrumbProps {
  pageName: string;
  showNav?: boolean;
}

const Breadcrumb = ({ pageName, showNav }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {showNav !== false && (
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link className="font-medium" href="/">
                Dashboard /
              </Link>
            </li>
            <li className="font-medium text-primary">{pageName}</li>
          </ol>
        </nav>
      )}

      <h2 className="text-[26px] font-bold leading-[30px] text-dark dark:text-white">
        {pageName}
      </h2>
    </div>
  );
};

export default Breadcrumb;
