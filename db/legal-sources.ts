export type LegalSource = {
  id: string;
  name: string;
  publisher: string;
  url: string;
  authority: "Official government" | "Official court" | "Open-access repository";
  jurisdiction: string;
  coverage: string;
  usePolicy: string;
  status: "Approved" | "Catalogued" | "Licence required";
  priority: number;
};

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: "fmoj-law-reporting",
    name: "Law Reporting & Publication",
    publisher: "Federal Ministry of Justice",
    url: "https://justice.gov.ng/law-reporting/",
    authority: "Official government",
    jurisdiction: "Federal",
    coverage: "Laws of the Federation, All Nigeria Law Reports, specialised law reports and justice publications.",
    usePolicy: "Catalogue official editions; obtain permission or a subscription before reproducing commercial publications.",
    status: "Licence required",
    priority: 1,
  },
  {
    id: "national-assembly-acts",
    name: "Legislative Publications & Acts",
    publisher: "National Assembly of Nigeria",
    url: "https://nass.gov.ng/documents/magazine",
    authority: "Official government",
    jurisdiction: "Federal",
    coverage: "Enacted Acts, legislative publications, bills, Hansards and parliamentary records.",
    usePolicy: "Use enacted and authenticated Acts; do not treat bills as law.",
    status: "Approved",
    priority: 2,
  },
  {
    id: "federal-gazette",
    name: "Federal Republic of Nigeria Official Gazette",
    publisher: "National Library of Nigeria",
    url: "https://nigeriareposit.nln.gov.ng/collections/246c6469-f257-4c57-8859-72d9002f2919",
    authority: "Official government",
    jurisdiction: "Federal",
    coverage: "Gazetted Acts, regulations, statutory instruments, notices and government publications.",
    usePolicy: "Preserve issue date, volume, notice number and page references with every extracted provision.",
    status: "Approved",
    priority: 3,
  },
  {
    id: "supreme-court-judgments",
    name: "Judgments",
    publisher: "Supreme Court of Nigeria",
    url: "https://supremecourt.gov.ng/?title=Judgements",
    authority: "Official court",
    jurisdiction: "Federal / appellate",
    coverage: "Civil, criminal and ruling or judgment materials published by Nigeria's apex court.",
    usePolicy: "Store the full citation, suit number, decision date, coram and subsequent treatment.",
    status: "Approved",
    priority: 4,
  },
  {
    id: "nlrc-downloads",
    name: "Acts, Bills & Reform Materials",
    publisher: "Nigerian Law Reform Commission",
    url: "https://nlrc.gov.ng/downloads/",
    authority: "Official government",
    jurisdiction: "Federal",
    coverage: "Acts, bills, policy documents, reform reports and justice-sector materials.",
    usePolicy: "Label reform proposals and bills separately from law currently in force.",
    status: "Catalogued",
    priority: 5,
  },
  {
    id: "lagos-laws",
    name: "Lagos State Laws & Resources",
    publisher: "Lagos State Government",
    url: "https://lagosstate.gov.ng/resources/",
    authority: "Official government",
    jurisdiction: "Lagos State",
    coverage: "State laws, gazettes, regulations and guidance, including tenancy and land-related material.",
    usePolicy: "Verify commencement, amendments and subsidiary legislation against the relevant Gazette.",
    status: "Catalogued",
    priority: 6,
  },
  {
    id: "nigerialii",
    name: "NigeriaLII",
    publisher: "Nigeria Legal Information Institute / Laws.Africa",
    url: "https://nigerialii.org/",
    authority: "Open-access repository",
    jurisdiction: "Federal and states",
    coverage: "Judgments, legislation, gazettes, court rules, documents and guidelines available for free access.",
    usePolicy: "Use as a discovery and access source; cross-check controlling text and later judicial treatment.",
    status: "Catalogued",
    priority: 7,
  },
  {
    id: "plac-lfn",
    name: "Complete 2004 Laws of Nigeria",
    publisher: "Policy and Legal Advocacy Centre (PLAC)",
    url: "https://lawsofnigeria.placng.org/",
    authority: "Open-access repository",
    jurisdiction: "Federal",
    coverage: "Searchable Laws of the Federation of Nigeria 2004, including Acts and subsidiary legislation.",
    usePolicy: "Useful historical consolidation; check post-2004 amendments, repeals and replacement Acts before relying on it.",
    status: "Approved",
    priority: 8,
  },
  {
    id: "cac-cama",
    name: "Companies and Allied Matters Act 2020",
    publisher: "Corporate Affairs Commission",
    url: "https://www.cac.gov.ng/wp-content/uploads/2020/12/CAMA-NOTE-BOOK-FULL-VERSION.pdf",
    authority: "Official government",
    jurisdiction: "Federal",
    coverage: "The principal company and allied entities legislation administered by the CAC.",
    usePolicy: "Verify later amendments, regulations and commencement provisions before citation.",
    status: "Catalogued",
    priority: 9,
  },
  {
    id: "copyright-act",
    name: "Copyright Act 2022",
    publisher: "Nigerian Copyright Commission",
    url: "https://copyright.gov.ng/CopyrightAct/",
    authority: "Official government",
    jurisdiction: "Federal",
    coverage: "Official publication of the Copyright Act 2022 and related copyright materials.",
    usePolicy: "Use the gazetted Act and record its commencement date and subsequent amendments.",
    status: "Catalogued",
    priority: 10,
  },
];

export const SOURCE_REGISTER_VERIFIED_AT = "2026-09-08";
