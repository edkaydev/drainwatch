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
    "Your phone and email stay private; the location, type of problem, and how serious it is may appear on the public map. Photos and voice recordings are only used by the AI and are never kept.",

  "report.welcome.title": "Let's report this hazard",
  "report.welcome.subtitle":
    "Record a voice message, take a photo, or type a description — whatever's easiest. Our AI looks at it and tells our team what's wrong.",
  "report.welcome.start": "Start",

  "report.capture.title": "What have you found?",
  "report.capture.subtitle": "Record a voice message, add a photo, or type below.",

  "report.answer.title": "Here's what we understood",
  "report.answer.subtitle": "Check this looks right before continuing.",
  "report.answer.redo": "Doesn't look right? Add more detail",

  "report.locationStep.title": "Where is it?",
  "report.locationStep.subtitle":
    "Drop a pin on the map, use your current location, or enter the coordinates and a landmark.",

  "report.confirmStep.title": "Review and send",
  "report.confirmStep.subtitle":
    "Check everything below, then send your report to our team.",

  "report.notConnected.title": "Reporting is not connected",
  "report.notConnected.body":
    "Firebase environment variables are missing, so submissions cannot be saved. The form stays available so the flow can be reviewed.",

  "report.fields.description": "What is happening?",
  "report.fields.descriptionHint":
    "At least {min} characters. Mention landmarks, water flow, and any immediate danger.",
  "report.fields.descriptionPlaceholder":
    "Describe the hazard, how long it has been there, and what it is affecting.",
  "report.fields.photos": "Photos (optional)",
  "report.fields.photosHint": "A clear photo helps our team check the problem faster.",
  "report.fields.voice": "Or describe it by voice (optional)",
  "report.fields.voiceHint": "Record a short message in English, Luganda, or Swahili. We transcribe it into the description below and never keep the recording.",
  "report.voice.record": "Record",
  "report.voice.recordAgain": "Record again",
  "report.voice.stop": "Stop recording",
  "report.voice.tapToStop": "Tap to stop",
  "report.voice.recording": "Recording… {seconds}s",
  "report.voice.transcribing": "Transcribing your recording…",
  "report.voice.added": "Added to the description below",
  "report.voice.hint": "Up to 90 seconds. Not saved after transcription.",
  "report.voice.micDenied": "Couldn't access the microphone. Check your browser permissions and try again.",
  "report.voice.empty": "No audio was captured. Try recording again.",
  "report.voice.unsupportedFormat": "Your browser's recording format isn't supported. Try a different browser.",
  "report.voice.failed": "Couldn't transcribe that recording. Try again or type your report instead.",
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
  "report.location.searchPlaceholder": "Search for a place…",
  "report.location.searching": "Searching…",
  "report.location.searchNoResults": "No matches found. Try a different search, or drop a pin manually.",

  "report.photos.limit": "You can attach up to {max} photos.",

  "report.buttons.next": "Continue",
  "report.buttons.back": "Back",
  "report.buttons.submit": "Send report",
  "report.buttons.cancel": "Cancel",
  "report.buttons.useMyLocation": "Use my location",
  "report.buttons.locating": "Locating…",
  "report.buttons.rerun": "Re-run",
  "report.buttons.useAISuggestion": "Use this suggestion",

  "report.consent":
    "I confirm this report is accurate to the best of my knowledge. I understand that the category, severity, status, and location may be shown publicly, while my contact details remain private.",
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
  "report.ai.analysingVoice": "Reading your voice report…",
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
    "Photos are only used by the AI to understand the hazard. We never save or publish them.",

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

  // Landing page
  "home.hero.title1": "Smarter Drainage.",
  "home.hero.title2": "Safer Kampala.",
  "home.hero.subtitle":
    "AI helps detect blocked drains and flooding, so the city knows where to fix problems first.",
  "home.hero.cta1": "Report a Problem",
  "home.hero.cta2": "See the Map",
  "home.hero.cta3": "Report by Voice",
  "home.hero.hotspotDetected": "Problem Detected",
  "home.hero.highRisk": "High Risk",

  "home.feature1.title": "Report a Problem",
  "home.feature1.desc": "Take a photo and drop a pin — done in three steps.",
  "home.feature2.title": "See What is Happening",
  "home.feature2.desc": "Find the worst-affected spots and how often they flood.",
  "home.feature3.title": "Fix the Right Places First",
  "home.feature3.desc": "Focus help where it is needed most.",
  "home.feature4.title": "Build a Safer City",
  "home.feature4.desc": "A cleaner, safer, more flood-ready Kampala and Nkozi.",

  "home.score1": "How often — how many times the same spot has been reported",
  "home.score2": "How serious — worse problems get a higher score",
  "home.score3": "How recent — newer reports count more than old ones",
  "home.score4": "How active — how many open problems are in the same area",

  "home.about.label": "How it works",
  "home.about.title": "Turning reports into action",
  "home.about.body":
    "DrainWatch turns community reports into a clear score that shows city teams which drains to fix first — saving time and protecting lives.",
  "home.about.photoCaption":
    "Every report starts with someone on the ground — a photo, a location, and a few words.",

  "home.map.label": "Live map",
  "home.map.title": "See drainage problems across Kampala and Nkozi",
  "home.map.body": "View reported problems, find the worst spots, and track what is being fixed.",
  "home.map.cta": "Open Map",

  "home.contact.title": "Want to use DrainWatch in your area?",
  "home.contact.body": "Get in touch and we will show you how it works.",
  "home.contact.cta": "Contact us",

  "footer.tagline":
    "AI helps spot drainage problems so Kampala can fix them faster and stay safer from floods.",
  "footer.product": "Product",
  "footer.project": "Project",
  "footer.links.map": "Hotspot Map",
  "footer.links.dashboard": "Operations Dashboard",
  "footer.copyright":
    "© 2026 DrainWatch — a hackathon project for Kampala, Uganda. Demo data is clearly labeled and does not represent real-world outcomes.",

  "mapPage.badge": "Public hotspot map",
  "mapPage.title": "Drainage problems across Kampala",
  "mapPage.subtitle":
    "See reported problems and the places that keep coming up. We never show who reported them.",
  "mapPage.notConnected.title": "Map data is not connected",
  "mapPage.notConnected.body":
    "Firebase settings are missing, so reports cannot be loaded. The map and filters still work.",
  "mapPage.loadErrorTitle": "Could not load reports",
  "mapPage.filters.severity": "Severity",
  "mapPage.filters.allSeverities": "All severities",
  "mapPage.filters.status": "Status",
  "mapPage.filters.activeReports": "Active reports",
  "mapPage.filters.allStatuses": "All statuses",
  "mapPage.filters.resolvedOnly": "Resolved only",
  "mapPage.stats.showing": "Showing",
  "mapPage.stats.reportsSuffix": "reports",
  "mapPage.stats.activeCitywide": "Active citywide",
  "mapPage.stats.hotspotCells": "Hotspot cells",
  "mapPage.loadingReports": "Loading reports…",
  "mapPage.mapUnavailableTitle": "Map unavailable",
  "mapPage.mapUnavailableDefault": "The map could not load. The list below still works.",
  "mapPage.mapUnavailableError": "The map could not load. Use the list to see reports.",
  "mapPage.selectedReport": "Selected report",
  "mapPage.clear": "Clear",
  "mapPage.location": "Location",
  "mapPage.reported": "Reported",
  "mapPage.selectedHotspot": "Selected hotspot",
  "mapPage.score": "Score",
  "mapPage.reportWordOne": "report",
  "mapPage.reportWordMany": "reports",
  "mapPage.active": "active",
  "mapPage.resolved": "resolved",
  "mapPage.scoreBreakdown.recurrence": "How often",
  "mapPage.scoreBreakdown.severity": "How serious",
  "mapPage.scoreBreakdown.recency": "How recent",
  "mapPage.scoreBreakdown.activeDensity": "Still open",
  "mapPage.priorityHotspots.title": "Priority spots",
  "mapPage.priorityHotspots.subtitle":
    "Ranked by how often, how serious, how recent, and how many are still open",
  "mapPage.priorityHotspots.calculating": "Working out priority spots…",
  "mapPage.priorityHotspots.noMatch": "No spots match these filters",
  "mapPage.priorityHotspots.noMatchHint": "Try showing all statuses or severities.",
  "mapPage.priorityHotspots.lastReport": "Last report",
  "mapPage.priorityHotspots.scoreWord": "score",
  "mapPage.spottedHazard": "Spotted a problem? Report it",
  "mapPage.tone.critical": "Critical",
  "mapPage.tone.high": "High",
  "mapPage.tone.moderate": "Moderate",
  "mapPage.tone.low": "Low",

  "severity.low": "Low",
  "severity.medium": "Medium",
  "severity.high": "High",
  "severity.critical": "Critical",
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
  "report.welcome.title": "Ka tuwe lipooti ku kabi kano",
  "report.welcome.subtitle":
    "Rekoda obubaka mu ddoboozi, kuba ekifaananyi, oba wandiika ebikwata ku nsonga — kyonna ekyangu gyoli. AI yaffe ekikebera n'etegeeza abakozi baffe ekizibu.",
  "report.welcome.start": "Tandika",

  "report.capture.title": "Olabye ki?",
  "report.capture.subtitle": "Rekoda obubaka mu ddoboozi, gatta ekifaananyi, oba wandiika wansi.",

  "report.answer.title": "Bino bye tutegedde",
  "report.answer.subtitle": "Kakasa nti bituufu nga tonannyiiza mu maaso.",
  "report.answer.redo": "Tebituufu? Yongera okunnyonnyola",

  "report.locationStep.title": "Kiri wa?",
  "report.locationStep.subtitle":
    "Nyiga awo ku maapu, kozesa GPS, oba wandiika obunnamawanga n'ekifo.",

  "report.confirmStep.title": "Kebera era Osindike",
  "report.confirmStep.subtitle":
    "Kebera byonna wansi, olyoke osindike lipooti yo eri abakozi baffe.",

  "report.pageSubtitle":
    "Ebikukwatako tebiraga ku bantu; ekifo, ekika, n'obukuufu biyinza okulabika ku maapu ey'olukale. Ebifaananyi n'amaloboozi bikozesebwa AI yokka era tetubikuuma.",

  "report.notConnected.title": "Okuwaayo tekukwataganye",
  "report.notConnected.body":
    "Ebya Firebase tebiragiddwa, lipooti teziyinza kutekebwa. Foomu ekyali awo olyoke ogirabe.",
  "report.fields.description": "Kiki ekigenda mu maaso?",
  "report.fields.descriptionHint":
    "Waakiri obubonero {min}. Wogera ku bifo ebimanyiddwa, enzizi, n'obulabe obw'amangu.",
  "report.fields.descriptionPlaceholder":
    "Nnyonnyola akabi, akaberawo, n'ekyo ke kakosa.",
  "report.fields.photos": "Ebifaananyi (si bya wandiika)",
  "report.fields.photosHint": "Ekifaananyi ekirungi kiyamba abakozi okukakasa akabi mangu.",
  "report.fields.voice": "Oba n'Eddoboozi (si kya wandiika)",
  "report.fields.voiceHint": "Yogera obubaka obumpi mu Lungereza, Oluganda, oba Kiswahili. Tukifuula mu bigambo wansi, tetukuuma ddoboozi.",
  "report.voice.record": "Rekoda",
  "report.voice.recordAgain": "Rekoda Nate",
  "report.voice.stop": "Koma",
  "report.voice.tapToStop": "Nyiga okukoma",
  "report.voice.recording": "Tukwata eddoboozi… {seconds}s",
  "report.voice.transcribing": "Tukyusa eddoboozi lyo mu bigambo…",
  "report.voice.added": "Kyawandiikiddwa mu description wansi",
  "report.voice.hint": "Ebbanga eritasukka ddakiika emu. Tetukuuma ddoboozi oluvannyuma.",
  "report.voice.micDenied": "Tetusobodde kutuuka ku maiki. Kebera obuyinza bw'omukutu gwo oguddemu ogezeeko.",
  "report.voice.empty": "Tewali ddoboozi lyakwatiddwa. Ddamu ogezeeko.",
  "report.voice.unsupportedFormat": "Omukutu gwo tegukkiriza enkola eno. Gezaako omukutu omulala.",
  "report.voice.failed": "Tetusobodde kukyusa ddoboozi mu bigambo. Ddamu ogezeeko oba wandiika ripoota yo.",
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
  "report.location.searchPlaceholder": "Nonya ekifo…",
  "report.location.searching": "Nnoonya…",
  "report.location.searchNoResults": "Tewali kifo kizuuliddwa. Gezaako okunoonya endala, oba teeka akabonero ku mukono.",

  "report.photos.limit": "Oyinza okugatta ebifaananyi okutuuka ku {max}.",

  "report.buttons.next": "Genda mu maaso",
  "report.buttons.back": "Ddayo",
  "report.buttons.submit": "Sindika Lipooti",
  "report.buttons.cancel": "Sazaamu",
  "report.buttons.useMyLocation": "Kozesa ekifo kyange",
  "report.buttons.locating": "Nnoonya ekifo…",
  "report.buttons.rerun": "Ddamu okukola",
  "report.buttons.useAISuggestion": "Kozesa magezi ga AI",

  "report.consent":
    "Nkakasa nti lipooti eno ya mazima nga bwe mmanyi. Ntegedde nti ekika, obukuufu, embeera, n'ekifo biyinza okulabisibwa mu lukale, naye ebikukwatako binaasigala nga tebyaalagibwa.",
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
  "report.ai.analysingVoice": "Nsoma ripoota yo ey'eddoboozi…",
  "report.ai.fallbackSource": "Magezi agatali ga AI",
  "report.ai.fallbackNotice": "Gemini tekolagana kaakano, kyokka tulaze magezi agatali ga AI.",

  "report.errors.location": "Ekifo kyetaagisa",
  "report.errors.details": "Ebimu tebinnamala. Ddayo olabe ebifo ebirina ensobi.",
  "report.errors.submitTitle": "Tetusobodde kusindika",

  "report.submit.notConfigured": "Okuwaayo tekukwataganye ne Firebase mu kifo kino.",
  "report.submit.cooldown":
    "Lipooti ewaddweyo kaakano okuva ku bbulaawuza eno. Linda eddakiika emu nga tonnaddamu okusindika endala.",
  "report.submit.genericError": "Lipooti tesobodde kusindikibwa. Kebera omukutu gwo oddemu.",

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
    "Ebifaananyi bikozesebwa AI yokka okutegeera akabi. Tetubikuuma wadde okubirambisa.",

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

  // Oluggya — ekifo eky'oluyimba
  "home.hero.title1": "Emidumu Egya Ngeri.",
  "home.hero.title2": "Kampala Eya Mbeera.",
  "home.hero.subtitle":
    "AI eyamba okulabirira emidumu egyaziyiziddwa n'amazzi agabuutikira, okwagala ekibuga kitegeere ebifo ebyetaaga okuyambibwa okusooka.",
  "home.hero.cta1": "Wayo Akabi",
  "home.hero.cta2": "Laba Maapu",
  "home.hero.cta3": "Wayo n'Eddoboozi",
  "home.hero.hotspotDetected": "Akabi Kazunziddwa",
  "home.hero.highRisk": "Obutaabika Obungi",

  "home.feature1.title": "Wayo Akabi",
  "home.feature1.desc": "Fotografa era teeka akabonero — ebitendera bisatu.",
  "home.feature2.title": "Laba Ekigendawo",
  "home.feature2.desc": "Nonya ebifo ebizibu era emirundi egisinga okubaawo.",
  "home.feature3.title": "Yambamu Ebifo Ebikyamu Okusooka",
  "home.feature3.desc": "Tereka obuyambi awo kyetaagisibwa nnyo.",
  "home.feature4.title": "Sengeka Ekibuga Ekikuumi",
  "home.feature4.desc": "Kampala ne Nkozi ezikendeera amazzi n'okubeera bulungi.",

  "home.score1": "Emirundi — emirundi emeka eyo ekifo kinnazunzibwako",
  "home.score2": "Obukuufu — ebizibu ebibi birina amanye amangi",
  "home.score3": "Obupya — lipooti empya zisinga okubal'amanye",
  "home.score4": "Obukimu — ebizibu ebimu ebyali mu kifo ekimu",

  "home.about.label": "Engeri ekikola",
  "home.about.title": "Okkyusa lipooti mu bikolwa",
  "home.about.body":
    "DrainWatch ekkyusa lipooti ez'olukale mu amanye amangu agalagira tiimu y'ekibuga emidumu gw'oyinza okusaasula okusooka — okusaasula ebiseera n'okuwonya abantu.",
  "home.about.photoCaption":
    "Lipooti buli esooka n'omuntu ku ttaka — ekifaananyi, ekifo, n'ebigambo bimbi.",

  "home.map.label": "Maapu ey'amangu",
  "home.map.title": "Laba ebizibu by'emidumu mu Kampala ne Nkozi",
  "home.map.body": "Laba ebizibu ebyawayiddwako lipooti, nonya ebifo ebizibu, era kebera ekiyambibwa.",
  "home.map.cta": "Ggulawo Maapu",

  "home.contact.title": "Oyagala kukozesa DrainWatch mu kitundu kyo?",
  "home.contact.body": "Tukwatagane era tujja kukunyonyola engeri ekikola.",
  "home.contact.cta": "Tukwatagane",

  "footer.tagline":
    "AI eyamba okuzuula ebizibu by'emidumu olyoke Kampala ekyusibwe mangu era ekuume obulungi okuva ku mazzi agabuutikira.",
  "footer.product": "Ebiweebwa",
  "footer.project": "Pulojekiti",
  "footer.links.map": "Maapu y'Ebizibu",
  "footer.links.dashboard": "Dashboard y'Abakozi",
  "footer.copyright":
    "© 2026 DrainWatch — pulojekiti ya hackathon eya Kampala, Uganda. Ebikwata ku kulaga byogerwa era tebikiikirira bivaamu bya mazima.",

  "mapPage.badge": "Maapu y'olukale",
  "mapPage.title": "Ebizibu by'emidumu mu Kampala",
  "mapPage.subtitle":
    "Laba ebizibu ebyawayiddwako lipooti n'ebifo ebisinga okuddiramu. Tetulaga ani eyawaddeyo.",
  "mapPage.notConnected.title": "Amanye g'emaapu tegakwataganye",
  "mapPage.notConnected.body":
    "Ebya Firebase tebiragiddwa, lipooti teziyinza kutekebwa. Emaapu n'ebifo ebiraga bikyaliwo.",
  "mapPage.loadErrorTitle": "Tetusobodde kuleeta lipooti",
  "mapPage.filters.severity": "Obukuufu",
  "mapPage.filters.allSeverities": "Obukuufu bwonna",
  "mapPage.filters.status": "Embeera",
  "mapPage.filters.activeReports": "Lipooti ezikyali",
  "mapPage.filters.allStatuses": "Embeera zonna",
  "mapPage.filters.resolvedOnly": "Ezimaliddwa zokka",
  "mapPage.stats.showing": "Erabise",
  "mapPage.stats.reportsSuffix": "lipooti",
  "mapPage.stats.activeCitywide": "Ezikyali mu kibuga",
  "mapPage.stats.hotspotCells": "Ebifo ebizibu",
  "mapPage.loadingReports": "Nleeta lipooti…",
  "mapPage.mapUnavailableTitle": "Emaapu tesobodde kulabika",
  "mapPage.mapUnavailableDefault": "Emaapu tesobodde kuleetebwa. Olukalala oluli wansi lukyakola.",
  "mapPage.mapUnavailableError": "Emaapu tesobodde kuleetebwa. Kozesa olukalala okulaba lipooti.",
  "mapPage.selectedReport": "Lipooti erondeddwa",
  "mapPage.clear": "Sangula",
  "mapPage.location": "Ekifo",
  "mapPage.reported": "Yawaddwa",
  "mapPage.selectedHotspot": "Ekifo ekirondeddwa",
  "mapPage.score": "Amanye",
  "mapPage.reportWordOne": "lipooti",
  "mapPage.reportWordMany": "lipooti",
  "mapPage.active": "ekyali",
  "mapPage.resolved": "emaliddwa",
  "mapPage.scoreBreakdown.recurrence": "Emirundi",
  "mapPage.scoreBreakdown.severity": "Obukuufu",
  "mapPage.scoreBreakdown.recency": "Obupya",
  "mapPage.scoreBreakdown.activeDensity": "Ezikyali",
  "mapPage.priorityHotspots.title": "Ebifo ebisooka",
  "mapPage.priorityHotspots.subtitle":
    "Birondeddwa ku mirundi, obukuufu, obupya, n'ebizibu ebikyali",
  "mapPage.priorityHotspots.calculating": "Mbala ebifo ebisooka…",
  "mapPage.priorityHotspots.noMatch": "Tewali bifo bituukana n'ebifo ebiraga",
  "mapPage.priorityHotspots.noMatchHint": "Gezaako okulaga embeera zonna oba obukuufu bwonna.",
  "mapPage.priorityHotspots.lastReport": "Lipooti esembyeyo",
  "mapPage.priorityHotspots.scoreWord": "amanye",
  "mapPage.spottedHazard": "Olabye akabi? Kiwayo",
  "mapPage.tone.critical": "Kya Maanyi",
  "mapPage.tone.high": "Kungi",
  "mapPage.tone.moderate": "Wakati",
  "mapPage.tone.low": "Kitono",

  "severity.low": "Kitono",
  "severity.medium": "Wakati",
  "severity.high": "Kungi",
  "severity.critical": "Kya Maanyi",
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
