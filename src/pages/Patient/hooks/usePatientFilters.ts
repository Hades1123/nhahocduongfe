/**
 * usePatientFilters — Custom hook for cascading patient list filters.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ARCHITECTURE OVERVIEW                                                  ║
 * ║                                                                         ║
 * ║  This hook manages two layers of filter state:                          ║
 * ║                                                                         ║
 * ║  1. DRAFT state  — what the user is currently picking in dropdowns.     ║
 * ║     Changes here do NOT fire API calls.                                 ║
 * ║                                                                         ║
 * ║  2. COMMITTED state — the last set of filters applied via the "Lọc"    ║
 * ║     button. Only committed state is used to build API queries.          ║
 * ║                                                                         ║
 * ║  Flow:  User picks Province → School → Class  (draft updates only)     ║
 * ║         User clicks "Lọc"  → draft copied to committed → onCommit()   ║
 * ║         User clicks "Đặt lại" → everything cleared → onCommit()       ║
 * ║                                                                         ║
 * ║  Cascading logic:                                                       ║
 * ║    Province change → reset School & Class drafts                        ║
 * ║    School change   → reset Class draft                                  ║
 * ║                                                                         ║
 * ║  Data loading:                                                          ║
 * ║    - Provinces: lazy-loaded from /api/areas/lookup on first dropdown    ║
 * ║      open (via onMouseDown trigger in the panel component).             ║
 * ║    - Organizations: loaded once from /api/organization/search?size=1000 ║
 * ║      then filtered CLIENT-SIDE by province areaCode.                    ║
 * ║    - Classes: derived from selected school's `classes` map (no API).    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback } from "react";
import { api } from "@/api/api";

// ═══════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

/** Represents a province/city option from /api/areas/lookup */
export interface ProvinceOption {
  value: string;     // Display name after stripping prefixes (e.g. "Hồ Chí Minh")
  label: string;     // Same as value — used by <Select> component for display
  item: {
    code?: string;   // Area code used for filtering (e.g. "24" for HCM)
    name?: string;   // Raw name from API (e.g. "Thành phố Hồ Chí Minh")
    [key: string]: any;
  };
}

/** Represents a school option derived from organization data */
export interface SchoolOption {
  value: any;        // The full organization object (OrganizationDTO shape)
  label: string;     // Organization name (e.g. "Trường TH ABC")
}

/** Represents a class option derived from selected school's classes map */
export interface ClassOption {
  value: string;     // Class name (e.g. "1A", "2B")
  label: string;     // Same as value — displayed in dropdown
}

/**
 * The filter state shape, used for both draft and committed layers.
 *
 * - province: selected province/city (null = "Tất cả" / none selected)
 * - school: selected school within the province (null = "Tất cả")
 * - classValue: selected class within the school (null = "Tất cả")
 *
 * Why "classValue" instead of "class"?  → "class" is a JS reserved word.
 */
export interface FilterState {
  province: ProvinceOption | null;
  school: SchoolOption | null;
  classValue: ClassOption | null;
}

/** Configuration for the hook */
interface UsePatientFiltersConfig {
  /**
   * Called when the user clicks "Lọc" or "Đặt lại".
   * Receives the newly-committed filter state so the parent can
   * build query params and fire the API request.
   */
  onCommit: (committed: FilterState) => void;

  /**
   * If truthy, the user belongs to a specific school (organizationType user).
   * In this case, province and school dropdowns are skipped — only the class
   * dropdown is shown, derived from the user's own organization.
   */
  organizationType?: string | null;

  /**
   * The user's own organization object (from getLocalUserInfo()).
   * Used when organizationType is truthy to derive class options.
   */
  userOrganization?: any;
}

/** Return type of the hook — everything the PatientFilterPanel needs */
export interface UsePatientFiltersReturn {
  // ── Draft state (what user is currently picking) ──
  draft: FilterState;

  // ── Committed state (what was last applied via "Lọc") ──
  committed: FilterState;

  // ── Dropdown options ──
  provinceOptions: ProvinceOption[];
  schoolOptions: SchoolOption[];
  classOptions: ClassOption[];

  // ── Loading states ──
  provincesLoading: boolean;
  schoolsLoading: boolean;

  // ── Event handlers for dropdown changes ──
  onProvinceChange: (province: ProvinceOption | null) => void;
  onSchoolChange: (school: SchoolOption | null) => void;
  onClassChange: (classValue: ClassOption | null) => void;

  // ── Action buttons ──
  commitFilters: () => void;
  resetFilters: () => void;

  // ── Lazy loading triggers (called onMouseDown on dropdown wrappers) ──
  loadProvinces: () => void;
  loadSchools: () => void;

  // ── For organizationType users ──
  organizationType: string | null | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Strip Vietnamese administrative prefixes from province/district names
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Removes common Vietnamese administrative prefixes from area names.
 * e.g. "Thành phố Hồ Chí Minh" → "Hồ Chí Minh"
 *      "Tỉnh Bình Dương"       → "Bình Dương"
 *
 * NOTE: The original PatientList.tsx had this logic inline in formatList().
 *       Extracted here for reuse and clarity.
 */
const AREA_PREFIXES_TO_STRIP = [
  "Tỉnh ",
  "Thành phố ",
  "Thị xã ",
  "Quận ",
  "Huyện ",
  "Phường ",
  "Xã ",
];

function stripAreaPrefix(name: string): string {
  let result = name;
  AREA_PREFIXES_TO_STRIP.forEach((prefix) => {
    result = result.replace(prefix, "");
  });
  return result;
}

/**
 * Converts raw area API response into deduplicated, sorted ProvinceOption[].
 *
 * Original code reference (from PatientList.tsx `formatList()`):
 * ```
 *   function formatList(list) {
 *     const uniqueMap = new Map();
 *     list.forEach((item) => {
 *       let result = item.name;
 *       listRemove.forEach((element) => { result = result.replace(element, ""); });
 *       if (!uniqueMap.has(result)) {
 *         uniqueMap.set(result, { value: result, label: result, item: item });
 *       }
 *     });
 *     return Array.from(uniqueMap.values()).sort(...);
 *   }
 * ```
 */
function formatProvinceList(rawAreas: any[]): ProvinceOption[] {
  const uniqueMap = new Map<string, ProvinceOption>();

  rawAreas.forEach((item: any) => {
    const displayName = stripAreaPrefix(item.name);
    if (!uniqueMap.has(displayName)) {
      uniqueMap.set(displayName, {
        value: displayName,
        label: displayName,
        item: item,
      });
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Flatten organization classes map into a flat array
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Converts an organization's `classes` map (e.g. { "GRADE_1": ["1A","1B"], "GRADE_2": ["2A"] })
 * into a flat array of ClassOption[].
 *
 * Original code reference (from PatientList.tsx):
 * ```
 *   function flattenObject(obj) {
 *     const flattenedArray = [];
 *     for (const key in obj) {
 *       if (obj.hasOwnProperty(key)) {
 *         const value = obj[key];
 *         if (Array.isArray(value)) { flattenedArray.push(...value); }
 *       }
 *     }
 *     return flattenedArray;
 *   }
 * ```
 */
function flattenClassesMap(classesMap: Record<string, string[]> | null | undefined): ClassOption[] {
  if (!classesMap) return [];

  const allClasses: string[] = [];
  for (const key in classesMap) {
    if (Object.prototype.hasOwnProperty.call(classesMap, key)) {
      const value = classesMap[key];
      if (Array.isArray(value)) {
        allClasses.push(...value);
      }
    }
  }

  return allClasses.map((className) => ({
    value: className,
    label: className,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// The Hook
// ═══════════════════════════════════════════════════════════════════════════

const EMPTY_FILTER_STATE: FilterState = {
  province: null,
  school: null,
  classValue: null,
};

export function usePatientFilters({
  onCommit,
  organizationType,
  userOrganization,
}: UsePatientFiltersConfig): UsePatientFiltersReturn {
  // ─────────────────────────────────────────────────────────────────────
  // Core filter state: draft (user-facing) and committed (query-facing)
  // ─────────────────────────────────────────────────────────────────────

  const [draft, setDraft] = useState<FilterState>({ ...EMPTY_FILTER_STATE });
  const [committed, setCommitted] = useState<FilterState>({ ...EMPTY_FILTER_STATE });

  // ─────────────────────────────────────────────────────────────────────
  // Province data — lazy-loaded from /api/areas/lookup
  // ─────────────────────────────────────────────────────────────────────

  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const provincesLoaded = useRef(false);
  const [provincesLoading, setProvincesLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────
  // Organization data — loaded once, then filtered client-side
  // ─────────────────────────────────────────────────────────────────────

  /** All organizations from the API (unfiltered cache) */
  const [allOrganizations, setAllOrganizations] = useState<any[]>([]);
  const schoolsLoaded = useRef(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────
  // Derived dropdown options (school and class)
  // ─────────────────────────────────────────────────────────────────────

  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);

  // ═══════════════════════════════════════════════════════════════════════
  // Data Loading Functions
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Load provinces from /api/areas/lookup (lazy, on first dropdown open).
   *
   * Called via onMouseDown on the province dropdown wrapper in the panel.
   * Only fetches once — subsequent calls are no-ops.
   */
  const loadProvinces = useCallback(() => {
    if (provincesLoaded.current) return;
    provincesLoaded.current = true;
    setProvincesLoading(true);

    api
      .get("/api/areas/lookup")
      .then((result) => {
        if (result?.data) {
          const formatted = formatProvinceList(result.data);
          // Prepend "Tất cả" option so user can clear the province filter
          setProvinceOptions([
            { value: "", label: "Tất cả", item: {} },
            ...formatted,
          ]);
        }
      })
      .catch((err) => {
        console.error("Cannot fetch /api/areas/lookup:", err);
        // Reset loaded flag so user can retry
        provincesLoaded.current = false;
      })
      .finally(() => {
        setProvincesLoading(false);
      });
  }, []);

  /**
   * Load all organizations from /api/organization/search?size=1000 (lazy, once).
   *
   * Called via onMouseDown on the school dropdown wrapper OR automatically
   * after provinces load (so school filtering works immediately).
   *
   * After loading, if a province is already selected in draft, the school
   * options are filtered by that province's areaCode.
   */
  const loadSchools = useCallback(() => {
    if (schoolsLoaded.current) return;
    schoolsLoaded.current = true;
    setSchoolsLoading(true);

    api
      .get("/api/organization/search?size=1000")
      .then((response) => {
        const orgs = response.data.content || [];
        setAllOrganizations(orgs);

        // Build initial school options based on current draft province
        // (If no province selected, show all schools)
        const filtered = draft.province?.item?.code
          ? orgs.filter((org: any) => org.areaCode === draft.province!.item.code)
          : orgs;

        const formatted: SchoolOption[] = filtered.map((org: any) => ({
          value: org,
          label: org.name,
        }));

        setSchoolOptions([{ value: "", label: "Tất cả" } as any, ...formatted]);
      })
      .catch((err) => {
        console.error("Cannot fetch organizations:", err);
        // Reset loaded flag so user can retry
        schoolsLoaded.current = false;
      })
      .finally(() => {
        setSchoolsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // Client-Side Filtering Helpers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Re-derive school options from the cached allOrganizations array,
   * filtered by the given province's areaCode.
   *
   * If province is null or "Tất cả", show all organizations.
   */
  const updateSchoolOptions = useCallback(
    (province: ProvinceOption | null) => {
      const code = province?.item?.code;
      const filtered = code
        ? allOrganizations.filter((org: any) => org.areaCode === code)
        : allOrganizations;

      const formatted: SchoolOption[] = filtered.map((org: any) => ({
        value: org,
        label: org.name,
      }));

      setSchoolOptions([{ value: "", label: "Tất cả" } as any, ...formatted]);
    },
    [allOrganizations],
  );

  /**
   * Re-derive class options from the selected school's `classes` map.
   *
   * Organization.classes shape: { "GRADE_1": ["1A","1B"], "GRADE_2": ["2A"] }
   * We flatten all values into a single list of ClassOption[].
   */
  const updateClassOptions = useCallback((school: SchoolOption | null) => {
    if (!school?.value?.classes) {
      setClassOptions([]);
      return;
    }

    const flattened = flattenClassesMap(school.value.classes);
    setClassOptions([{ value: "", label: "Tất cả" }, ...flattened]);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // Cascading Dropdown Handlers
  //
  // These update DRAFT state only — no API calls are fired here.
  // The "Lọc" button (commitFilters) is the only trigger for API calls.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Handle province dropdown change.
   *
   * Cascading effect:
   *   1. Update draft.province
   *   2. Reset draft.school → null (cascade)
   *   3. Reset draft.classValue → null (cascade)
   *   4. Re-filter school options by new province's areaCode
   *   5. Clear class options (no school selected anymore)
   */
  const onProvinceChange = useCallback(
    (province: ProvinceOption | null) => {
      // If user selected "Tất cả" (value === ""), treat as null/clear
      const effectiveProvince =
        province && province.value !== "" ? province : null;

      setDraft((prev) => ({
        ...prev,
        province: effectiveProvince,
        school: null,      // ← cascade reset
        classValue: null,  // ← cascade reset
      }));

      // Re-filter schools for this province (client-side from cached orgs)
      updateSchoolOptions(effectiveProvince);

      // Clear class options since school was reset
      setClassOptions([]);
    },
    [updateSchoolOptions],
  );

  /**
   * Handle school dropdown change.
   *
   * Cascading effect:
   *   1. Update draft.school
   *   2. Reset draft.classValue → null (cascade)
   *   3. Derive class options from selected school's classes map
   */
  const onSchoolChange = useCallback(
    (school: SchoolOption | null) => {
      // If user selected "Tất cả" (value === ""), treat as null/clear
      const effectiveSchool =
        school && school.value !== "" ? school : null;

      setDraft((prev) => ({
        ...prev,
        school: effectiveSchool,
        classValue: null,  // ← cascade reset
      }));

      // Derive class options from the selected school
      updateClassOptions(effectiveSchool);
    },
    [updateClassOptions],
  );

  /**
   * Handle class dropdown change.
   *
   * No cascading effects — class is the leaf of the cascade chain.
   */
  const onClassChange = useCallback((classValue: ClassOption | null) => {
    // If user selected "Tất cả" (value === ""), treat as null/clear
    const effectiveClass =
      classValue && classValue.value !== "" ? classValue : null;

    setDraft((prev) => ({
      ...prev,
      classValue: effectiveClass,
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // Action Buttons
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * "Lọc" button handler — commits the draft state.
   *
   * 1. Copies draft → committed
   * 2. Calls onCommit() so the parent (PatientList) can fire the API request
   *
   * This is the ONLY path that triggers an API call from filter changes.
   * (Text search has its own independent debounced path.)
   */
  const commitFilters = useCallback(() => {
    const newCommitted = { ...draft };
    setCommitted(newCommitted);
    onCommit(newCommitted);
  }, [draft, onCommit]);

  /**
   * "Đặt lại" button handler — clears all filters.
   *
   * 1. Resets both draft and committed to empty state
   * 2. Clears school and class options (since province is cleared)
   * 3. Calls onCommit() with empty state → parent fetches unfiltered data
   */
  const resetFilters = useCallback(() => {
    const empty: FilterState = { ...EMPTY_FILTER_STATE };
    setDraft(empty);
    setCommitted(empty);

    // Reset derived options — show all schools (no province filter)
    const allSchools: SchoolOption[] = allOrganizations.map((org: any) => ({
      value: org,
      label: org.name,
    }));
    setSchoolOptions([{ value: "", label: "Tất cả" } as any, ...allSchools]);
    setClassOptions([]);

    onCommit(empty);
  }, [allOrganizations, onCommit]);

  // ═══════════════════════════════════════════════════════════════════════
  // OrganizationType Branch (School-level users)
  //
  // When the logged-in user belongs to a specific school, we skip the
  // province and school dropdowns entirely. Only the class dropdown is
  // shown, with options derived from the user's own organization.
  //
  // Original code reference (from PatientList.tsx):
  // ```
  //   if (organizationType) {
  //     useEffect(() => {
  //       setClasses("");
  //       let temp = flattenObject(userInfor.organization.classes);
  //       temp = [temp.join(","), ...temp].map((schoolClass, index) => {
  //         if (index === 0) return {};
  //         else return { value: schoolClass, label: schoolClass };
  //       });
  //       setClassOptions(temp);
  //     }, [organizationType]);
  //   }
  // ```
  // ═══════════════════════════════════════════════════════════════════════

  // For organizationType users, derive class options from userOrganization
  // This runs synchronously during render (no useEffect needed since it's
  // derived from props, not async data)
  const effectiveClassOptions = organizationType
    ? [
        { value: "", label: "Tất cả" },
        ...flattenClassesMap(userOrganization?.classes),
      ]
    : classOptions;

  // ═══════════════════════════════════════════════════════════════════════
  // Return all state and handlers for the PatientFilterPanel component
  // ═══════════════════════════════════════════════════════════════════════

  return {
    draft,
    committed,
    provinceOptions,
    schoolOptions,
    classOptions: effectiveClassOptions,
    provincesLoading,
    schoolsLoading,
    onProvinceChange,
    onSchoolChange,
    onClassChange,
    commitFilters,
    resetFilters,
    loadProvinces,
    loadSchools,
    organizationType,
  };
}
