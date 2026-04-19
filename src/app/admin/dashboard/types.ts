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
