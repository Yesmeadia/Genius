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

export interface AlumniRegistration {
  id: string;
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  category: string;
  className: string;
  createdAt: any;
  photoUrl?: string;
}

export interface VolunteerRegistration {
  id: string;
  volunteerName: string;
  parentage: string;
  gender: string;
  whatsappNumber?: string;
  mobileNumber?: string;
  zone: string;
  school: string;
  className: string;
  createdAt: any;
  photoUrl?: string;
}

export interface AwardeeRegistration {
  id: string;
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  school: string;
  category: string;
  className: string;
  rank: string;
  selectionType: string;
  createdAt: any;
  photoUrl?: string;
}

export interface DriverStaffRegistration {
  id: string;
  name: string;
  gender: string;
  whatsappNumber: string;
  zone: string;
  staffType: "DRIVER" | "SUPPORT STAFF";
  vehicleNumber?: string;
  vehicleType?: string;
  photoUrl: string;
  createdAt: any;
}

export interface DashboardStats {
  totalStudents: number;
  totalGuests: number;
  totalYesians: number;
  totalStaff: number;
  totalAlumni: number;
  totalVolunteers: number;
  totalAwardees: number;
  totalDriverStaff: number;
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

export interface DashboardDataContextType {
  registrations: Registration[];
  guestRegistrations: GuestRegistration[];
  yesianRegistrations: YesianRegistration[];
  localStaffRegistrations: LocalStaffRegistration[];
  alumniRegistrations: AlumniRegistration[];
  volunteerRegistrations: VolunteerRegistration[];
  awardeeRegistrations: AwardeeRegistration[];
  driverStaffRegistrations: DriverStaffRegistration[];
  stats: DashboardStats;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
