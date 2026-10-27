// Kiswahili is removed for now (no reviewed translations/audio yet) — see git
// history for the "sw" dictionary and LANGUAGES entry to restore it later.
export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "lg", label: "Luganda" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.value === value);
}

const en = {
  "nav.home": "Home",
  "nav.about": "About",
  "nav.insights": "Insights",
  "nav.contact": "Contact",
  "nav.report": "Report an Incident",

  "report.badge": "Public incident report",
  "report.pageTitle": "Report a drainage hazard",
  "report.pageSubtitle":
    "Three quick steps. Your phone and email stay private; the location, type of problem, how serious it is, and your first photo may appear on the public map.",

  "report.steps.details": "Details",
  "report.steps.location": "Location",
  "report.steps.review": "Review",

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

  "report.notConnected.title": "Reporting is not connected",
  "report.notConnected.body":
    "Firebase environment variables are missing, so submissions cannot be saved. The form stays available so the flow can be reviewed.",

  "report.fields.category": "Hazard type",
  "report.fields.severity": "How severe is it?",
  "report.fields.title": "Short title",
  "report.fields.titleHint":
    "Optional. We will generate one from the category and location if left blank.",
  "report.fields.titlePlaceholder": "e.g. Blocked culvert flooding Nakawa market road",
  "report.fields.description": "What is happening?",
  "report.fields.descriptionHint":
    "At least {min} characters. Mention landmarks, water flow, and any immediate danger.",
  "report.fields.descriptionPlaceholder":
    "Describe the hazard, how long it has been there, and what it is affecting.",
  "report.fields.photos": "Photos (optional)",
  "report.fields.photosHint": "A clear photo helps our team check the problem faster.",
  "report.fields.yourDetails": "Your details (optional)",
  "report.fields.detailsHint":
    "Only our team can see this. It is never shown on the public map. Leave it blank to report without giving your name.",
  "report.fields.name": "Name",
  "report.fields.phone": "Phone",
  "report.fields.phonePlaceholder": "+256…",
  "report.fields.email": "Email",
  "report.fields.division": "Division",
  "report.fields.divisionHint": "Not sure? Choose the closest one.",
  "report.fields.notSure": "Not sure",
  "report.fields.landmark": "Nearest landmark or address",
  "report.fields.landmarkHint": "Optional but very helpful.",
  "report.fields.landmarkPlaceholder": "e.g. Near Nakawa Market, opposite the taxi stage",
  "report.fields.address": "Address",
  "report.fields.latitude": "Latitude",
  "report.fields.longitude": "Longitude",

  "report.location.noPin": "No pin placed yet",
  "report.location.geoUnsupported":
    "This browser does not support geolocation. Drop a pin instead.",
  "report.location.captured":
    "Location captured to about {meters} m. Adjust the pin if needed.",
  "report.location.denied": "Location permission was denied. Drop a pin on the map instead.",
  "report.location.failed": "Could not get your location. Drop a pin on the map instead.",
  "report.location.serviceArea":
    "Only reports inside the Kampala service area can be submitted. If the pin is slightly off, drag it rather than leaving it outside the city.",

  "report.photos.limitSignedIn": "You can attach up to {max} photos.",
  "report.photos.limitAnonymous":
    "Anonymous reports include one cover photo. Sign in to attach more.",

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
  "report.consentError": "Confirm that the report is accurate and may be shown publicly.",

  "report.warning.critical": "Very dangerous — act now",
  "report.warning.criticalBody":
    "The AI says this is very dangerous. If someone's life is at risk, call emergency services (112) before sending this report.",
  "report.warning.high": "Serious problem nearby",
  "report.warning.highBody":
    "The AI says this is a serious problem. Keep people away and send the report as soon as you are safe.",

  "report.review.editDetails": "Edit details",
  "report.review.editLocation": "Edit location",
  "report.review.titleFallback": "Title will be generated automatically",
  "report.review.categoryMissing": "Category missing",
  "report.review.locationLabel": "Location",
  "report.review.noCoordinates": "No coordinates",
  "report.review.reporterLabel": "Reporter",
  "report.review.anonymous": "Anonymous reporter",
  "report.review.photosLabel": "Photos",
  "report.review.noPhotos": "No photos",
  "report.review.photoReadyOne": "1 photo ready",
  "report.review.photoReadyMany": "{count} photos ready",
  "report.review.photosPublicNote": "The first photo may appear publicly.",
  "report.review.noSuggestion":
    "No suggestion yet. Continue to submit without one, or re-run the classifier.",
  "report.review.matches": "Matches your report",
  "report.review.confidenceNote":
    "This is a suggestion only. A real person on our team will check it. Sending the report does not accept this automatically.",

  "report.success.title": "Report received",
  "report.success.body":
    "Thank you. Your report has been sent to our team and will be looked at soon.",
  "report.success.aiAssessment": "What the AI found",
  "report.success.severityWord": "severity",
  "report.success.categoryLabel": "Category",
  "report.success.urgencyLabel": "Urgency",
  "report.success.confidenceLabel": "Confidence",
  "report.success.urgentCritical":
    "This looks very dangerous. If someone is at risk right now, call emergency services (112) first.",
  "report.success.urgentHigh":
    "This looks like a serious problem. Keep people away and let local authorities know if needed.",
  "report.success.reference": "Reference",
  "report.success.copy": "Copy",
  "report.success.copied": "Copied!",
  "report.success.copyAria": "Copy reference code",
  "report.success.viewMap": "View on map",
  "report.success.another": "Submit another report",
  "report.success.backHome": "Back to home",
  "report.success.footnote":
    "Keep this number in case you need to follow up. Our team will contact you only if you left your phone or email.",

  "report.ai.title": "What the AI thinks",
  "report.ai.analysing": "Reading your description…",
  "report.ai.confidence": "confidence",
  "report.ai.category": "Category",
  "report.ai.severity": "Severity",
  "report.ai.urgency": "Urgency",
  "report.ai.analysingPhoto": "Looking at your photo…",
  "report.ai.fallbackSource": "Basic check (no AI)",
  "report.ai.fallbackNotice":
    "AI is not available right now. Showing a basic check instead.",

  "report.errors.location": "Location needed",
  "report.errors.details":
    "Some details still need attention. Go back and complete the highlighted fields.",
  "report.errors.submitTitle": "Could not submit",

  "report.submit.notConfigured": "Reporting is not connected to Firebase in this deployment.",
  "report.submit.cooldown":
    "A report was just submitted from this browser. Wait a minute before sending another.",
  "report.submit.genericError":
    "The report could not be submitted. Check your connection and try again.",

  "report.upload.photo": "Uploading photo {current} of {total}…",
  "report.upload.saving": "Saving your report…",
  "report.upload.submitting": "Submitting…",

  "report.sidebar.nextTitle": "What happens next",
  "report.sidebar.next1": "Your report is saved and sent to our team.",
  "report.sidebar.next2": "The AI checks it, but a real person makes the final decision.",
  "report.sidebar.next3": "Our team looks at it and updates you on what is being done.",
  "report.sidebar.safeTitle": "Stay safe",
  "report.sidebar.safeBody":
    "Do not go into floodwater, open holes, or broken drains. Report from a safe distance. If someone is in danger right now, call emergency services first.",
  "report.sidebar.signedInAs": "Signed in as",
  "report.sidebar.linkedAccount": "This report will be linked to your staff account.",

  "report.photoUploader.dropOrBrowse": "Drop photos here, or browse",
  "report.photoUploader.limitReached": "Photo limit reached",
  "report.photoUploader.hintOne": "Up to 1 photo · JPEG, PNG, or WebP · max {size} MB each",
  "report.photoUploader.hintMany":
    "Up to {max} photos · JPEG, PNG, or WebP · max {size} MB each",
  "report.photoUploader.choosePhotos": "Choose photos",
  "report.photoUploader.footerNote":
    "Photos are resized in your browser before upload. They may appear on the public hotspot map.",

  "report.support.title": "Message our team",
  "report.support.body":
    "Can't finish the form? Send a short message and a staff member will follow up.",
  "report.support.messagePlaceholder": "What do you need help with?",
  "report.support.submit": "Send message",
  "report.support.sending": "Sending…",
  "report.support.success": "Message sent. A staff member will follow up soon.",
  "report.support.error": "Could not send your message. Try again or use the contact options above.",

  "report.languageGate.title": "Choose your language",
  "report.languageGate.subtitle": "Select the language you want to use for this report.",

  "report.categories.blocked_drain": "Blocked drain or culvert",
  "report.categories.open_manhole": "Open or damaged manhole",
  "report.categories.flooding": "Persistent flooding",
  "report.categories.illegal_dumping": "Waste blocking a channel",
  "report.categories.erosion": "Erosion or collapsed bank",
  "report.categories.broken_culvert": "Broken culvert or cover",
  "report.categories.other": "Other drainage hazard",
} as const;

export type TranslationKey = keyof typeof en;

const lg: Record<TranslationKey, string> = {
  "nav.home": "Awaka",
  "nav.about": "Ku Ffe",
  "nav.insights": "Okutegeera",
  "nav.contact": "Tukwatagane",
  "nav.report": "Wayo Lipooti",

  "report.badge": "Lipooti y'olukale",
  "report.pageTitle": "Wayo Lipooti ku Akabi k'Omudumu",
  "report.pageSubtitle":
    "Emitendera esatu egyangu. Ebikukwatako tebiraga ku bantu; ekifo, ekika, obukuufu, embeera, ne ekifaananyi ekisooka biyinza okulabika ku maapu ey'olukale.",

  "report.steps.details": "Ebikwata ku nsonga",
  "report.steps.location": "Ekifo",
  "report.steps.review": "Kebera",

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

  "report.notConnected.title": "Okuwaayo tekukwataganye",
  "report.notConnected.body":
    "Ebya Firebase tebiragiddwa, lipooti teziyinza kutekebwa. Foomu ekyali awo olyoke ogirabe.",

  "report.fields.category": "Ekika ky'akabi",
  "report.fields.severity": "Bukuufu ki?",
  "report.fields.title": "Omutwe omufunze",
  "report.fields.titleHint":
    "Si bya wandiika. Tujja kugukola okuva ku kika n'ekifo bw'onoba tolina ky'owandiika.",
  "report.fields.titlePlaceholder": "e.g. Omudumu oguziyiza enzizi mu Nakawa",
  "report.fields.description": "Kiki ekigenda mu maaso?",
  "report.fields.descriptionHint":
    "Waakiri obubonero {min}. Wogera ku bifo ebimanyiddwa, enzizi, n'obulabe obw'amangu.",
  "report.fields.descriptionPlaceholder":
    "Nnyonnyola akabi, akaberawo, n'ekyo ke kakosa.",
  "report.fields.photos": "Ebifaananyi (si bya wandiika)",
  "report.fields.photosHint": "Ekifaananyi ekirungi kiyamba abakozi okukakasa akabi mangu.",
  "report.fields.yourDetails": "Ebikukwatako (si bya wandiika)",
  "report.fields.detailsHint":
    "Abakozi bokka be bayinza okulaba kino. Tekirabika ku maapu ey'olukale. Kireke nga kikolo bw'oba oyagala kuwayo nga togamba linnya lyo.",
  "report.fields.name": "Erinnya",
  "report.fields.phone": "Ssimu",
  "report.fields.phonePlaceholder": "+256…",
  "report.fields.email": "Email",
  "report.fields.division": "Disitulikiti",
  "report.fields.divisionHint": "Tomanyi? Londa eri okumpi.",
  "report.fields.notSure": "Simanyi",
  "report.fields.landmark": "Ekifo ekimanyiddwa oba endagiriro",
  "report.fields.landmarkHint": "Si kya wandiika naye kiyamba nnyo.",
  "report.fields.landmarkPlaceholder": "e.g. Okumpi ne Katale ka Nakawa, okwolekera sitageji",
  "report.fields.address": "Endagiriro",
  "report.fields.latitude": "Latitude",
  "report.fields.longitude": "Longitude",

  "report.location.noPin": "Tewali kabonero katuuziddwa",
  "report.location.geoUnsupported": "Ebbulaawuza eno tekola na GPS. Teeka akabonero ku maapu.",
  "report.location.captured": "Ekifo kikwasiddwa okumpi ne mita {meters}. Kyusa akabonero bwe kyetaagisa.",
  "report.location.denied": "Olukusa lw'ekifo lugaanibbwa. Teeka akabonero ku maapu.",
  "report.location.failed": "Tetusobodde kufuna kifo kyo. Teeka akabonero ku maapu.",
  "report.location.serviceArea":
    "Lipooti ezisobola okusindikibwa zokka eziri munda mu Kampala. Akabonero bwe kaba katali mu kifo ekituufu, kasembeze.",

  "report.photos.limitSignedIn": "Oyinza okugatta ebifaananyi okutuuka ku {max}.",
  "report.photos.limitAnonymous":
    "Lipooti ez'obutamanyibwa zirina kifaananyi kimu. Yingira okugatta ebirala.",

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
  "report.consentError": "Kakasa nti lipooti ya mazima era nti eyinza okulabika mu lukale.",

  "report.warning.critical": "AI eraze akabi ka maanyi",
  "report.warning.criticalBody":
    "Lipooti eno erazibwa ng'akabi k'amaanyi ennyo. Bwe wabaawo akabi ku bulamu, kubiriza abayambi (112) nga tonnasindika.",
  "report.warning.high": "Akabi k'obukuufu obungi",
  "report.warning.highBody":
    "AI erabye kino ng'akabi k'obukuufu obungi. Teeka abantu wala, osindike amangu nga kirabika nti kirabulengayo.",

  "report.review.editDetails": "Kyusa ebikwata ku nsonga",
  "report.review.editLocation": "Kyusa ekifo",
  "report.review.titleFallback": "Omutwe gujja kukolebwa awo awo",
  "report.review.categoryMissing": "Ekika tekiragiddwa",
  "report.review.locationLabel": "Ekifo",
  "report.review.noCoordinates": "Tewali bubonero bwa kifo",
  "report.review.reporterLabel": "Eyawaddeyo",
  "report.review.anonymous": "Eyawaddeyo atamanyiddwa",
  "report.review.photosLabel": "Ebifaananyi",
  "report.review.noPhotos": "Tewali bifaananyi",
  "report.review.photoReadyOne": "Ekifaananyi kimu kiteekeddwateekeddwa",
  "report.review.photoReadyMany": "Ebifaananyi {count} biteekeddwateekeddwa",
  "report.review.photosPublicNote": "Ekifaananyi ekisooka kiyinza okulabika mu lukale.",
  "report.review.noSuggestion": "Tewannaba magezi. Genda mu maaso nga tolina, oba ddamu okukola.",
  "report.review.matches": "Ekituukana ne lipooti yo",
  "report.review.confidenceNote":
    "Kino kya kuwabula kwokka; abakozi bajja kukikakasa. Okusindika tekikkiriza magezi ga AI awo awo.",

  "report.success.title": "Lipooti Ekkiriziddwa",
  "report.success.body": "Webale. Lipooti etekeddwa okukebenkana abakozi era kati erabika mu dashboard.",
  "report.success.aiAssessment": "Okulambika kwa AI",
  "report.success.severityWord": "obukuufu",
  "report.success.categoryLabel": "Ekika",
  "report.success.urgencyLabel": "Bwangu",
  "report.success.confidenceLabel": "Obukakafu",
  "report.success.urgentCritical":
    "Kino kirabika ng'akabi ka maanyi. Bwe wabaawo akabi ku bulamu, kubiriza abayambi (112) amangu.",
  "report.success.urgentHigh":
    "Kino kirabika ng'akabi ka bulabe. Teeka abantu wala era muwe abakulembeze b'ekitundu amawulire.",
  "report.success.reference": "Ennamba y'okukozesa",
  "report.success.copy": "Kopa",
  "report.success.copied": "Kikoppeddwa!",
  "report.success.copyAria": "Kopa ennamba y'okukozesa",
  "report.success.viewMap": "Laba ku Maapu",
  "report.success.another": "Sindika Lipooti Endala",
  "report.success.backHome": "Ddayo Awaka",
  "report.success.footnote":
    "Kuumanga ennamba eno bw'oba oyagala okwongera okubuuza. Abakozi bajja kukutuukirira bw'oba wawaddeyo ebikukwatako.",

  "report.ai.title": "Magezi ga AI",
  "report.ai.analysing": "Nkebera ebigambo…",
  "report.ai.confidence": "obukakafu",
  "report.ai.category": "Ekika",
  "report.ai.severity": "Obukuufu",
  "report.ai.urgency": "Bwangu",
  "report.ai.analysingPhoto": "Nkebera ekifaananyi…",
  "report.ai.fallbackSource": "Magezi agatali ga AI",
  "report.ai.fallbackNotice": "Gemini tekolagana kaakano, kyokka tulaze magezi agatali ga AI.",

  "report.errors.location": "Ekifo kyetaagisa",
  "report.errors.details": "Ebimu tebinnamala. Ddayo olabe ebifo ebirina ensobi.",
  "report.errors.submitTitle": "Tetusobodde kusindika",

  "report.submit.notConfigured": "Okuwaayo tekukwataganye ne Firebase mu kifo kino.",
  "report.submit.cooldown":
    "Lipooti ewaddweyo kaakano okuva ku bbulaawuza eno. Linda eddakiika emu nga tonnaddamu okusindika endala.",
  "report.submit.genericError": "Lipooti tesobodde kusindikibwa. Kebera omukutu gwo oddemu.",

  "report.upload.photo": "Nsindika ekifaananyi {current} ekya {total}…",
  "report.upload.saving": "Nteka lipooti yo…",
  "report.upload.submitting": "Nsindika…",

  "report.sidebar.nextTitle": "Ekiddako",
  "report.sidebar.next1": "Lipooti eteekebwa mu kyama okukebenkanibwa abakozi.",
  "report.sidebar.next2": "Magezi ga AI gagattibwa, naye omuntu y'asalawo obanga gakozesebwa.",
  "report.sidebar.next3": "Abakozi bakebera akabi ne bakyusa embeera yaako.",
  "report.sidebar.safeTitle": "Beera mukuumi",
  "report.sidebar.safeBody":
    "Toyingira mu mazzi, mu nnyumba ezigguddwa, oba ku midumu egyonoonese. Wayo olipooti ng'oli wala. Bwe wabaawo akabi mu kaseera, kubiriza abayambi ab'omu kitundu.",
  "report.sidebar.signedInAs": "Oyingidde nga",
  "report.sidebar.linkedAccount": "Lipooti eno ejja kugattibwa ku akawunti yo ak'omukozi.",

  "report.photoUploader.dropOrBrowse": "Teeka ebifaananyi wano, oba nonya",
  "report.photoUploader.limitReached": "Wasaanye ebifaananyi",
  "report.photoUploader.hintOne": "Ekifaananyi kimu · JPEG, PNG, oba WebP · okutuuka {size} MB",
  "report.photoUploader.hintMany":
    "Okutuuka ku {max} · JPEG, PNG, oba WebP · buli kimu {size} MB",
  "report.photoUploader.choosePhotos": "Londa ebifaananyi",
  "report.photoUploader.footerNote":
    "Ebifaananyi binyoolebwa mu bbulaawuza yo nga tebinnasindikibwa. Biyinza okulabika ku maapu ey'olukale.",

  "report.support.title": "Tumira tiimu yaffe obubaka",
  "report.support.body":
    "Tosobodde kumaliriza foomu? Tumira obubaka obufunze era omukozi ajja kukuddamu.",
  "report.support.messagePlaceholder": "Oyagala tukuyambe mu ki?",
  "report.support.submit": "Sindika obubaka",
  "report.support.sending": "Nsindika…",
  "report.support.success": "Obubaka butumiddwa. Omukozi ajja kukutuukirira mangu.",
  "report.support.error": "Tetusobodde kusindika bubaka bwo. Ddamu ogezeeko, oba kozesa endala eziri waggulu.",

  "report.languageGate.title": "Londa Olulimi Lwo",
  "report.languageGate.subtitle": "Londa olulimi lw'oyagala okukozesa okuwayo lipooti eno.",

  "report.categories.blocked_drain": "Omudumu oguziyiziddwa oba ogwonooneka",
  "report.categories.open_manhole": "Ekinnya ekigguddwawo oba ekyonooneka",
  "report.categories.flooding": "Amazzi agabuutikira ebbanga eggwanvu",
  "report.categories.illegal_dumping": "Enkola y'okusuula eziyiza omudumu",
  "report.categories.erosion": "Okukendeera kw'ettaka oba olubalama olugudde",
  "report.categories.broken_culvert": "Omudumu oguyonjeddwa oba ekibikka ekyonooneka",
  "report.categories.other": "Akabi akalala ak'omudumu",
};

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  lg,
};

export function translate(language: Language, key: string): string {
  const table = translations[language];
  const value = table[key as TranslationKey];
  if (value !== undefined) return value;
  return en[key as TranslationKey] ?? key;
}
