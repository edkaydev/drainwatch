export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "lg", label: "Luganda" },
  { value: "sw", label: "Kiswahili" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.value === value);
}

const en = {
  "nav.home": "Home",
  "nav.about": "About",
  "nav.report": "Report an Incident",

  "report.pageTitle": "Report a drainage hazard",
  "report.pageSubtitle":
    "Three quick steps. Your contact details stay private to staff; the location, category, severity, status, and first photo may appear on the public hotspot map.",

  "report.step1.title": "What have you found?",
  "report.step1.subtitle":
    "Pick the closest category and give us enough detail to act on it.",
  "report.step2.title": "Where is it?",
  "report.step2.subtitle":
    "Drop a pin on the map, use your current location, or enter the coordinates and a landmark.",
  "report.step3.title": "Review and submit",
  "report.step3.subtitle":
    "Check the details before sending. You can go back to edit any step.",

  "report.step1.audio":
    "Welcome! Take a photo of the problem, or describe the type of hazard and how severe it is.",
  "report.step2.audio": "Tap the map where the problem is, or use the GPS button.",
  "report.step3.audio": "Check your report. Listen to the AI result, then press Submit.",
  "report.success.audio": "Thank you! Your report has been received and saved.",

  "report.fields.category": "Hazard type",
  "report.fields.severity": "How severe is it?",
  "report.fields.title": "Short title",
  "report.fields.description": "What is happening?",
  "report.fields.photos": "Photos (optional)",
  "report.fields.yourDetails": "Your details (optional)",
  "report.fields.name": "Name",
  "report.fields.phone": "Phone",
  "report.fields.email": "Email",
  "report.fields.division": "Division",
  "report.fields.landmark": "Nearest landmark or address",
  "report.fields.address": "Address",
  "report.fields.latitude": "Latitude",
  "report.fields.longitude": "Longitude",

  "report.buttons.next": "Continue",
  "report.buttons.back": "Back",
  "report.buttons.submit": "Submit report",
  "report.buttons.cancel": "Cancel",
  "report.buttons.useMyLocation": "Use my location",
  "report.buttons.locating": "Locating…",
  "report.buttons.rerun": "Re-run",
  "report.buttons.useAISuggestion": "Use this suggestion",

  "report.consent":
    "I confirm this report is accurate to the best of my knowledge. I understand that the category, severity, status, location, and first photo may be shown publicly, while my contact details remain private.",

  "report.success.title": "Report received",
  "report.success.body":
    "Thank you. The report is saved for staff review and now appears in the operations dashboard.",
  "report.success.reference": "Reference",
  "report.success.viewMap": "View on map",
  "report.success.another": "Submit another report",

  "report.ai.title": "AI suggestion",
  "report.ai.analysing": "Analysing the description…",
  "report.ai.confidence": "confidence",
  "report.ai.category": "Category",
  "report.ai.severity": "Severity",
  "report.ai.urgency": "Urgency",
  "report.ai.analysingPhoto": "Analysing the photo…",

  "report.errors.location": "Location needed",
  "report.errors.details":
    "Some details still need attention. Go back and complete the highlighted fields.",

  "report.warning.critical": "Critical hazard detected by AI",
  "report.warning.high": "High severity hazard",
} as const;

export type TranslationKey = keyof typeof en;

const lg: Record<TranslationKey, string> = {
  "nav.home": "Awaka",
  "nav.about": "Ku Ffe",
  "nav.report": "Wayo Lipooti",

  "report.pageTitle": "Wayo Lipooti ku Akabi k'Omudumu",
  "report.pageSubtitle":
    "Emitendera esatu egyangu. Ebikukwatako tebiraga ku bantu; ekifo, ekika, obukuufu, embeera, ne ekifaananyi ekisooka biyinza okulabika ku maapu ey'olukale.",

  "report.step1.title": "Olabye ki?",
  "report.step1.subtitle": "Londa ekika ekisinga okutuukana era otuwe ebikwata ku nsonga.",
  "report.step2.title": "Kiri wa?",
  "report.step2.subtitle": "Nyiga awo ku maapu, kozesa GPS, oba wandiika obunnamawanga n'ekifo.",
  "report.step3.title": "Kebera era Osindike",
  "report.step3.subtitle":
    "Kebera ebikwata ku lipooti yo nga tonnagisindika. Oyinza okudda emabega okukyusa.",

  "report.step1.audio":
    "Musubirwamu! Fotografa ensonga oba etegeeza ekika n'obukuufu bw'obutaabika.",
  "report.step2.audio": "Nyiga awo ku maapu nga otuusa essaala lyo, oba kozesa katono ka GPS.",
  "report.step3.audio": "Kebera lipooti yo. Wulira ebirowoozo bya AI, olyoke onyige Wasilisa.",
  "report.success.audio": "Webale nnyo! Lipooti yo yakkiririzibwa era etunzibwa.",

  "report.fields.category": "Ekika ky'akabi",
  "report.fields.severity": "Bukuufu ki?",
  "report.fields.title": "Omutwe omufunze",
  "report.fields.description": "Kiki ekigenda mu maaso?",
  "report.fields.photos": "Ebifaananyi (si bya wandiika)",
  "report.fields.yourDetails": "Ebikukwatako (si bya wandiika)",
  "report.fields.name": "Erinnya",
  "report.fields.phone": "Ssimu",
  "report.fields.email": "Email",
  "report.fields.division": "Disitulikiti",
  "report.fields.landmark": "Ekifo ekimanyiddwa oba endagiriro",
  "report.fields.address": "Endagiriro",
  "report.fields.latitude": "Latitude",
  "report.fields.longitude": "Longitude",

  "report.buttons.next": "Genda mu maaso",
  "report.buttons.back": "Ddayo",
  "report.buttons.submit": "Sindika lipooti",
  "report.buttons.cancel": "Sazaamu",
  "report.buttons.useMyLocation": "Kozesa ekifo kyange",
  "report.buttons.locating": "Nnoonya ekifo…",
  "report.buttons.rerun": "Ddamu okukola",
  "report.buttons.useAISuggestion": "Kozesa magezi ga AI",

  "report.consent":
    "Nkakasa nti lipooti eno ya mazima nga bwe mmanyi. Ntegedde nti ekika, obukuufu, embeera, ekifo, n'ekifaananyi ekisooka biyinza okulabisibwa mu lukale, naye ebikukwatako binaasigala nga tebyaalagibwa.",

  "report.success.title": "Lipooti Ekkiriziddwa",
  "report.success.body": "Webale. Lipooti etekeddwa okukebenkana abakozi era kati erabika mu dashboard.",
  "report.success.reference": "Ennamba y'okukozesa",
  "report.success.viewMap": "Laba ku Maapu",
  "report.success.another": "Sindika Lipooti Endala",

  "report.ai.title": "Magezi ga AI",
  "report.ai.analysing": "Nkebera ebigambo…",
  "report.ai.confidence": "obukakafu",
  "report.ai.category": "Ekika",
  "report.ai.severity": "Obukuufu",
  "report.ai.urgency": "Bwangu",
  "report.ai.analysingPhoto": "Nkebera ekifaananyi…",

  "report.errors.location": "Ekifo kyetaagisa",
  "report.errors.details": "Ebimu tebinnamala. Ddayo olabe ebifo ebirina ensobi.",

  "report.warning.critical": "AI eraze akabi ka maanyi",
  "report.warning.high": "Akabi k'obukuufu obungi",
};

const sw: Record<TranslationKey, string> = {
  "nav.home": "Nyumbani",
  "nav.about": "Kuhusu",
  "nav.report": "Toa Ripoti",

  "report.pageTitle": "Toa Ripoti ya Hatari ya Mifereji",
  "report.pageSubtitle":
    "Hatua tatu fupi. Maelezo yako ya mawasiliano yatabaki faragha kwa wafanyakazi; eneo, aina, ukali, hali, na picha ya kwanza zinaweza kuonekana kwenye ramani ya umma.",

  "report.step1.title": "Umegundua Nini?",
  "report.step1.subtitle": "Chagua aina inayokaribiana zaidi na utoe maelezo ya kutosha.",
  "report.step2.title": "Iko Wapi?",
  "report.step2.subtitle":
    "Gusa mahali kwenye ramani, tumia eneo lako la sasa, au ingiza kuratibu na alama.",
  "report.step3.title": "Kagua na Wasilisha",
  "report.step3.subtitle": "Kagua maelezo kabla ya kutuma. Unaweza kurudi kuhariri hatua yoyote.",

  "report.step1.audio": "Karibu! Piga picha ya tatizo au elezea aina ya hatari na ukali wake.",
  "report.step2.audio": "Gusa ramani mahali tatizo lilipo, au bonyeza kitufe cha GPS.",
  "report.step3.audio": "Kagua ripoti yako. Sikiliza matokeo ya AI, kisha bonyeza Wasilisha.",
  "report.success.audio": "Asante sana! Ripoti yako imepokelewa na imehifadhiwa.",

  "report.fields.category": "Aina ya hatari",
  "report.fields.severity": "Ukali kiasi gani?",
  "report.fields.title": "Kichwa kifupi",
  "report.fields.description": "Nini kinaendelea?",
  "report.fields.photos": "Picha (si lazima)",
  "report.fields.yourDetails": "Maelezo yako (si lazima)",
  "report.fields.name": "Jina",
  "report.fields.phone": "Simu",
  "report.fields.email": "Barua pepe",
  "report.fields.division": "Wilaya",
  "report.fields.landmark": "Alama ya karibu au anwani",
  "report.fields.address": "Anwani",
  "report.fields.latitude": "Latitudo",
  "report.fields.longitude": "Longitudo",

  "report.buttons.next": "Endelea",
  "report.buttons.back": "Rudi",
  "report.buttons.submit": "Wasilisha ripoti",
  "report.buttons.cancel": "Ghairi",
  "report.buttons.useMyLocation": "Tumia eneo langu",
  "report.buttons.locating": "Inatafuta eneo…",
  "report.buttons.rerun": "Rudia",
  "report.buttons.useAISuggestion": "Tumia pendekezo hili",

  "report.consent":
    "Nathibitisha ripoti hii ni sahihi kwa ufahamu wangu bora. Naelewa kuwa aina, ukali, hali, eneo, na picha ya kwanza zinaweza kuonyeshwa hadharani, wakati maelezo yangu ya mawasiliano yatabaki faragha.",

  "report.success.title": "Ripoti Imepokelewa",
  "report.success.body":
    "Asante. Ripoti imehifadhiwa kwa ukaguzi wa wafanyakazi na sasa inaonekana kwenye dashibodi ya uendeshaji.",
  "report.success.reference": "Nambari ya Rejea",
  "report.success.viewMap": "Tazama kwenye Ramani",
  "report.success.another": "Wasilisha Ripoti Nyingine",

  "report.ai.title": "Pendekezo la AI",
  "report.ai.analysing": "Inachambua maelezo…",
  "report.ai.confidence": "uhakika",
  "report.ai.category": "Aina",
  "report.ai.severity": "Ukali",
  "report.ai.urgency": "Uharaka",
  "report.ai.analysingPhoto": "Inachambua picha…",

  "report.errors.location": "Eneo linahitajika",
  "report.errors.details":
    "Maelezo kadhaa bado yanahitaji kuangaliwa. Rudi nyuma ukamilishe sehemu zilizoangaziwa.",

  "report.warning.critical": "Hatari kubwa imegunduliwa na AI",
  "report.warning.high": "Hatari ya ukali wa juu",
};

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  lg,
  sw,
};

export function translate(language: Language, key: string): string {
  const table = translations[language];
  const value = table[key as TranslationKey];
  if (value !== undefined) return value;
  return en[key as TranslationKey] ?? key;
}
