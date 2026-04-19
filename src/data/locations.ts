export interface School {
  id: string;
  name: string;
}

export interface Zone {
  id: string;
  name: string;
  schools: School[];
}

export const locations: Zone[] = [
  {
    id: "Srinagar",
    name: "Srinagar",
    schools: [
      { id: "sch-1", name: "YASEEN ENGLISH SCHOOL - MALOORA" },
      { id: "sch-2", name: "YES SOLAH IDARATHUL ALOOM SCHOOL - NARBAL" },
      { id: "sch-3", name: "YES DARUL ULOOM JAMIA ZAINUL ISLAM - PAHALGHAM" },
    ],
  },
  {
    id: "Poonch",
    name: "Poonch",
    schools: [
      { id: "sch-4", name: " YES RAZA UL ULOOM ISLAMIA HSS - POONCH" },
      { id: "sch-5", name: "YASEEN ENGLISH SCHOOL - TERWAN" },
      { id: "sch-6", name: "YASEEN ENGLISH SCHOOL - MALDIYALAN" },
      { id: "sch-7", name: "YASEEN ENGLISH SCHOOL - CHANDAK" },
      { id: "sch-8", name: "YES JAMEEL PABLIC ACADEMY - DARADULLIAN" },
    ],
  },
  {
    id: "Mandi",
    name: "Mandi",
    schools: [
      { id: "sch-9", name: "YES NATIONAL PUBLIC SCHOOL - RAJPURA" },
      { id: "sch-10", name: "YASEEN ENGLISH SCHOOL - LORAN" },
      { id: "sch-11", name: "YASEEN ISLAMIA ENGLISH MEDIUM SCHOOL - SAWJIAN" },
      { id: "sch-12", name: "YES BABA NAZAM UD DIN EDU TRUST - CHAKTROO" },
      { id: "sch-13", name: "YASEEN COLLEGE OF INTEGRATED STUDIES - MANDI" },
    ],
  },
  {
    id: "Rajouri",
    name: "Rajouri",
    schools: [
      { id: "sch-14", name: "YES DS EDUCATION INSTITUTE - RAJOURI" },
      { id: "sch-15", name: "NEW YASEEN ENGLISH SCHOOL - RAJOURI" },
      { id: "sch-16", name: "YASEEN ENGLISH SCHOOL - SHAHDARA SHARIEF" },
      { id: "sch-17", name: "EC YES RAJOURI - RAJOURI" },
    ],
  },
  {
    id: "Surankote",
    name: "Surankote",
    schools: [
      { id: "sch-18", name: "YASEEN ENGLISH SCHOOL - SERIKHAWAJA" },
      { id: "sch-19", name: "YASEEN ENGLISH SCHOOL - SURANKOTE" },
      { id: "sch-20", name: "YASEEN ENGLISH SCHOOL - DHUNDAK" },
      { id: "sch-21", name: "YES MODEL INSTITUTE OF EDUCATION - DROGIAN" },
      { id: "sch-22", name: "YASEEN COLLEGE OF INTEGRATED STUDIES - SANGIOTE" },
      { id: "sch-23", name: "YASEEN COLLEGE OF INTEGRATED STUDIES - DHUNDAK" },
      { id: "sch-24", name: "YASEEN ENGLISH SCHOOL - TRARANWALI" },
    ],
  },
  {
    id: "Jammu",
    name: "Jammu",
    schools: [
      { id: "sch-25", name: "YES NEW TAJ PUBLIC SCHOOL - BATHINDI" },
      { id: "sch-26", name: "YASEEN COLLEGE OF INTEGRATED STUDIES - SUJUMA" },
    ],
  },
  {
    id: "Mendar",
    name: "Mendar",
    schools: [
      { id: "sch-27", name: "YASEEN ENGLISH SCHOOL - GALHUTA-HARNI" },
      { id: "sch-28", name: "YASEEN ENGLISH SCHOOL - MENDAR" },
    ],
  },
  {
    id: "Doda",
    name: "Doda",
    schools: [
      { id: "sch-29", name: "YES LITTILE ANGEL ACADEMY - DODA" },
    ],
  },
  {
    id: "Rajasthan",
    name: "Rajasthan",
    schools: [
      { id: "sch-30", name: "YES SARWAR SHIKSHAN SANSTHAN SR.SEC. SCHOOL - SERWA" },
      { id: "sch-31", name: "YES DESERT BLOOM SCHOOL- PHALODI" },
      { id: "sch-32", name: "YES PUBLIC ENGLISH MEDIUM SCHOOL - BALOTRA" },
      { id: "sch-33", name: "YES ENGLISH SCHOOL SUJON KA NIVAN - SUJA SHERIEF" },
      { id: "sch-34", name: "YES FAIZ-E-SIDDIQUIA SR.SEC SCHOOL - SUJA SHERIEF" },
    ],
  },
  {
    id: "South",
    name: "South",
    schools: [
      { id: "sch-35", name: "YESUQ HS SCHOOL - MONGAM" },
      { id: "sch-36", name: "YES SIR HIND ENGLISH MEDIUM SCHOOL - KARKALAM" },
      { id: "sch-37", name: "YES SOOFI ENGLISH SCHOOL - LAXMESHWAR" },
      { id: "sch-38", name: "YES INDIA PUBLIC SCHOOL - MALEBENNUR" },
      { id: "sch-39", name: "YASEEN ENGLISH MEDIUM HIGH SCHOOL - ANANTHAPUR" },
      { id: "sch-40", name: "YASEEN COLLEGE OF INTEGRATED STUDIES - TADIPATRI" },
      { id: "sch-41", name: "YASEEN COLLEGE OF INTEGRATED STUDIES - ANANTHAPUR" },
      { id: "sch-42", name: "SCHOOL OF HIFZ-UL-QUR'AN - ANANTHAPUR" },
    ],
  },
  {
    id: "North East",
    name: "North East",
    schools: [
      { id: "sch-43", name: "YES HASAN FATIMA ENGLISH SCHOOL - BISFI" },
      { id: "sch-44", name: "YASEEN ENGLISH SCHOOL - KARISHAL" },
      { id: "sch-45", name: "YES INDIA PUBLIC SCHOOL - MATHABHANGA" },
    ],
  },
  {
    id: "Maharashtra",
    name: "Maharashtra",
    schools: [
      { id: "sch-46", name: "YES PA INAMDAR ENGLISH MEDIUM SCHOOL - AHMADNAGAR" },
      { id: "sch-47", name: "YES H.U.H MUNDIA PUBLIC SCHOOL - CHALISGAON" },
      { id: "sch-48", name: "YES RAZA ENGLISH MEDIUM SCHOOL - KHAIRGAON" },
    ],
  },
];
