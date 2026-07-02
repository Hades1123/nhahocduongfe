import { navMenuGroups } from "@/constants/defines";
import { slugs } from "@/constants/slugs";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
import { Link, useLocation } from "react-router-dom";

// ---------------------------------------------------------------------------
// Breadcrumb mapping – derives the trail from navMenuGroups automatically.
//
// For every child in navMenuGroups we generate a breadcrumb entry that includes
// the parent group label as an intermediate crumb.  Additional sub-routes
// (e.g. /patient/create, /exam-campaign/:id/schedule) that are NOT in the
// dropdown children are handled by the `extraBreadcrumbs` table below.
// ---------------------------------------------------------------------------

interface BreadcrumbEntry {
  /** Display name */
  name: string;
  /** Route to link to (empty string = non-navigable crumb) */
  path: string;
}

/**
 * Build a lookup map:  slug → { groupLabel, childTitle }
 * This is derived once at module load from `navMenuGroups`.
 */
const slugToGroupMap = new Map<
  string,
  { groupLabel: string; childTitle: string }
>();

navMenuGroups.forEach((group) => {
  group.children.forEach((child) => {
    slugToGroupMap.set(child.slug, {
      groupLabel: group.label,
      childTitle: child.title,
    });
  });
});

/**
 * Extra breadcrumbs for sub-routes that don't appear in the dropdown menus
 * but still need a full trail.  Each key is matched by `pathname.startsWith`.
 */
const extraBreadcrumbs: {
  match: (pathname: string) => boolean;
  crumbs: (pathname: string) => BreadcrumbEntry[];
}[] = [
  // /patient/create
  {
    match: (p) => p === "/patient/create",
    crumbs: () => [
      { name: "Học Sinh", path: "" },
      { name: "Danh sách", path: slugs.patients },
      { name: "Thêm mới", path: "" },
    ],
  },
  // /patient/detail/:id
  {
    match: (p) => /^\/patient\/detail\/.+/.test(p),
    crumbs: () => [
      { name: "Học Sinh", path: "" },
      { name: "Danh sách", path: slugs.patients },
      { name: "Chi tiết", path: "" },
    ],
  },
  // /patient/:id/healthCheckHistory
  {
    match: (p) => /^\/patient\/.+\/healthCheckHistory/.test(p),
    crumbs: () => [
      { name: "Học Sinh", path: "" },
      { name: "Danh sách", path: slugs.patients },
      { name: "Lịch sử khám", path: "" },
    ],
  },
  // /exam-campaign/:campaignId/schedule
  {
    match: (p) => /^\/exam-campaign\/.+\/schedule/.test(p),
    crumbs: () => [
      { name: "Bác Sĩ", path: "" },
      { name: "Đợt khám", path: slugs.examCampaign },
      { name: "Lịch khám", path: "" },
    ],
  },
  // /dental-record/create
  {
    match: (p) => p === "/dental-record/create",
    crumbs: () => [
      { name: "Bệnh án", path: slugs.dentalRecord },
      { name: "Thêm mới", path: "" },
    ],
  },
];

/**
 * Build the breadcrumb trail for the given pathname.
 */
function buildBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  // 1. Home page
  if (pathname === "/") {
    return [{ name: "Dashboard", path: slugs.home }];
  }

  // 2. Check extra (sub-route) breadcrumbs first – they're more specific
  for (const extra of extraBreadcrumbs) {
    if (extra.match(pathname)) {
      return extra.crumbs(pathname);
    }
  }

  // 3. Look up in the navMenuGroups slug map
  const entry = slugToGroupMap.get(pathname);
  if (entry) {
    return [
      { name: entry.groupLabel, path: "" },
      { name: entry.childTitle, path: pathname },
    ];
  }

  // 4. Standalone pages not in any group
  const standalonePages: Record<string, string> = {
    [slugs.dentalRecord]: "Bệnh án",
    [slugs.report1]: "Báo cáo",
    [slugs.dentalArticles]: "Bài viết khoa học",
  };

  if (standalonePages[pathname]) {
    return [{ name: standalonePages[pathname], path: pathname }];
  }

  // 5. Fallback – show the raw path segment as a breadcrumb
  return [{ name: pathname.replace(/^\//, "").replace(/-/g, " "), path: "" }];
}

// ---------------------------------------------------------------------------
// Separator SVG
// ---------------------------------------------------------------------------
function Separator() {
  return (
    <ChevronRightIcon
      className="h-5 w-5 flex-shrink-0 text-gray-400"
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb component
// ---------------------------------------------------------------------------
export default function Breadcrumb() {
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        {/* Home icon – always present */}
        <li>
          <div>
            <Link
              to={slugs.home}
              className="flex text-sm font-medium text-gray-400 hover:text-gray-500"
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </li>

        {/* Dynamic crumbs */}
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.name}-${index}`}>
            <div className="flex items-center">
              <Separator />
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {crumb.name}
                </Link>
              ) : (
                <span className="ml-2 text-sm font-medium text-gray-500">
                  {crumb.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
