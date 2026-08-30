export const verifiedDocuments = [
  {
    id: "constitution-1999",
    canonicalTitle: "Constitution of the Federal Republic of Nigeria 1999",
    citation: "Cap C23, LFN 2004",
    documentType: "Constitution",
    jurisdiction: "Federal",
    sourceUrl: "https://lawsofnigeria.placng.org/laws/C23.pdf",
    sourcePublisher: "PLAC Laws of Nigeria",
    legalStatus: "amendment_review_required",
    reviewStatus: "source_verified",
    lastVerifiedAt: "2026-08-26",
  },
];

export const verifiedPassages = [
  {
    id: "constitution-s1-1", provisionLabel: "Section 1(1)",
    textContent: "This Constitution is supreme and its provisions shall have binding force on all authorities and persons throughout the Federal Republic of Nigeria.",
    keywords: "constitution supreme supremacy highest law binding force authorities persons",
    professionalSummary: "The Constitution is supreme and binds every authority and person throughout Nigeria.",
    plainSummary: "The Constitution is Nigeria's highest law, and everyone—including government authorities—must obey it.",
  },
  {
    id: "constitution-s1-2", provisionLabel: "Section 1(2)",
    textContent: "The Federal Republic of Nigeria shall not be governed, nor shall any person or group of persons take control of the Government of Nigeria or any part thereof, except in accordance with the provisions of this Constitution.",
    keywords: "government control govern constitution lawful takeover constitutional order",
    professionalSummary: "Nigeria may be governed, and governmental control may be assumed, only in accordance with the Constitution.",
    plainSummary: "Nobody may govern Nigeria or take control of its government except in the way the Constitution permits.",
  },
  {
    id: "constitution-s1-3", provisionLabel: "Section 1(3)",
    textContent: "If any other law is inconsistent with the provisions of this Constitution, this Constitution shall prevail, and that other law shall, to the extent of the inconsistency, be void.",
    keywords: "constitution supreme supremacy conflict inconsistent law prevail void invalid",
    professionalSummary: "A law inconsistent with the Constitution is void to the extent of that inconsistency.",
    plainSummary: "If another law conflicts with the Constitution, the Constitution wins and the conflicting part of that law has no legal effect.",
  },
  {
    id: "constitution-s4-1", provisionLabel: "Section 4(1)",
    textContent: "The legislative powers of the Federal Republic of Nigeria shall be vested in a National Assembly for the Federation, which shall consist of a Senate and a House of Representatives.",
    keywords: "legislative power make laws lawmaking national assembly senate house representatives federal",
    professionalSummary: "Federal legislative power is vested in the National Assembly, comprising the Senate and House of Representatives.",
    plainSummary: "The National Assembly makes federal laws. It has two chambers: the Senate and the House of Representatives.",
  },
  {
    id: "constitution-s4-2", provisionLabel: "Section 4(2)",
    textContent: "The National Assembly shall have power to make laws for the peace, order and good government of the Federation or any part thereof with respect to any matter included in the Exclusive Legislative List set out in Part I of the Second Schedule to this Constitution.",
    keywords: "national assembly make laws peace order good government federation exclusive legislative list second schedule",
    professionalSummary: "The National Assembly may legislate for the Federation on matters in the Exclusive Legislative List.",
    plainSummary: "The National Assembly can make laws on the federal subjects listed in the Constitution's Exclusive Legislative List.",
  },
  {
    id: "constitution-s4-3", provisionLabel: "Section 4(3)",
    textContent: "The power of the National Assembly to make laws for the peace, order and good government of the Federation with respect to any matter included in the Exclusive Legislative List shall, save as otherwise provided in this Constitution, be to the exclusion of the Houses of Assembly of States.",
    keywords: "exclusive legislative list national assembly state house assembly exclusion powers federal laws",
    professionalSummary: "Except where the Constitution otherwise provides, legislative competence over Exclusive List matters belongs to the National Assembly and excludes State Houses of Assembly.",
    plainSummary: "Generally, only the National Assembly may make laws about subjects on the Exclusive Legislative List; State Houses of Assembly cannot do so unless the Constitution allows it.",
  },
].map((passage) => ({
  ...passage,
  canonicalTitle: verifiedDocuments[0].canonicalTitle,
  citation: verifiedDocuments[0].citation,
  sourceUrl: verifiedDocuments[0].sourceUrl,
  sourcePublisher: verifiedDocuments[0].sourcePublisher,
  legalStatus: verifiedDocuments[0].legalStatus,
  lastVerifiedAt: verifiedDocuments[0].lastVerifiedAt,
}));
