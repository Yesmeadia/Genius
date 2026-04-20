export interface Registration {
  id: string;
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  schoolName?: string;
  mobileNumber?: string;
  withParent: boolean;
  parentName?: string;
  parentGender?: string;
  relation?: string;
  createdAt: any;
  photoUrl?: string;
}

export interface GuestRegistration {
  id: string;
  name: string;
  gender: string;
  whatsappNumber: string;
  address: string;
  createdAt: any;
}

export interface YesianRegistration {
  id: string;
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  designation: string;
  createdAt: any;
  photoUrl?: string;
}

export interface LocalStaffRegistration {
  id: string;
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  role: "Teaching" | "Non Teaching";
  createdAt: any;
  photoUrl?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalGuests: number;
  totalYesians: number;
  totalLocalStaff: number;
  todayCount: number;
  totalParticipation: number;
  totalAccompanied: number;
  totalSchools: number;
  totalZones: number;
  availableSchoolsCount: number;
  availableZonesCount: number;
  malesCount: number;
  femalesCount: number;
  lastUpdated: string;
  trendData: { date: string; count: number }[];
  platformData: { name: string; value: number }[];
}

export interface DataTableProps {
  filteredData: Registration[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  itemsPerPage: number;
  filterZone?: string;
  setFilterZone?: (val: string) => void;
  filterClass?: string;
  setFilterClass?: (val: string) => void;
  filterOptions?: { zones: string[]; schools: string[]; classes: string[] };
  filterGender?: string;
  setFilterGender?: (val: string) => void;
  filterAccompaniment?: string;
  setFilterAccompaniment?: (val: string) => void;
  filterSchool?: string;
  setFilterSchool?: (val: string) => void;
  resetFilters?: () => void;
}
