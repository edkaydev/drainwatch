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
  "nav.insights": "Insights",
  "nav.contact": "Contact",
  "nav.report": "Report an Incident",

  "report.badge": "Public incident report",
  "report.pageTitle": "Report a drainage hazard",
  "report.pageSubtitle":
    "Three quick steps. Your contact details stay private to staff; the location, category, severity, status, and first photo may appear on the public hotspot map.",

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
  "report.fields.photosHint": "A clear photo helps staff verify the hazard faster.",
  "report.fields.yourDetails": "Your details (optional)",
  "report.fields.detailsHint":
    "Only staff can see this. It is never shown on the public map. Leave it blank to report anonymously.",
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

  "report.warning.critical": "Critical hazard detected by AI",
  "report.warning.criticalBody":
    "This report has been assessed as critical severity. If there is immediate danger to life, contact emergency services (112) before submitting.",
  "report.warning.high": "High severity hazard",
  "report.warning.highBody":
    "The AI has assessed this as a high severity hazard. Keep bystanders away and submit as soon as it is safe to do so.",

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
    "This is advisory; staff will verify it. Submitting does not accept the suggestion automatically.",

  "report.success.title": "Report received",
  "report.success.body":
    "Thank you. The report is saved for staff review and now appears in the operations dashboard.",
  "report.success.aiAssessment": "AI Assessment",
  "report.success.severityWord": "severity",
  "report.success.categoryLabel": "Category",
  "report.success.urgencyLabel": "Urgency",
  "report.success.confidenceLabel": "Confidence",
  "report.success.urgentCritical":
    "This looks like a critical hazard. If there is immediate danger to life, call emergency services (112) first.",
  "report.success.urgentHigh":
    "This looks like a serious hazard. Keep bystanders away and report to local authorities if needed.",
  "report.success.reference": "Reference",
  "report.success.copy": "Copy",
  "report.success.copied": "Copied!",
  "report.success.copyAria": "Copy reference code",
  "report.success.viewMap": "View on map",
  "report.success.another": "Submit another report",
  "report.success.backHome": "Back to home",
  "report.success.footnote":
    "Keep the reference if you need to follow up. Staff may contact you only if you provided contact details.",

  "report.ai.title": "AI suggestion",
  "report.ai.analysing": "Analysing the description…",
  "report.ai.confidence": "confidence",
  "report.ai.category": "Category",
  "report.ai.severity": "Severity",
  "report.ai.urgency": "Urgency",
  "report.ai.analysingPhoto": "Analysing the photo…",
  "report.ai.fallbackSource": "Rule-based fallback",
  "report.ai.fallbackNotice":
    "Gemini is unavailable, so a rule-based suggestion is shown instead.",

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
  "report.sidebar.next1": "The report is saved privately for staff review.",
  "report.sidebar.next2": "An AI suggestion is attached, but a person decides whether to use it.",
  "report.sidebar.next3": "Staff triage the incident and update its status.",
  "report.sidebar.safeTitle": "Stay safe",
  "report.sidebar.safeBody":
    "Do not enter floodwater, open manholes, or damaged drains. Report from a safe distance. For an immediate emergency, contact local emergency services first.",
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
};

const sw: Record<TranslationKey, string> = {
  "nav.home": "Nyumbani",
  "nav.about": "Kuhusu",
  "nav.insights": "Maarifa",
  "nav.contact": "Wasiliana",
  "nav.report": "Toa Ripoti",

  "report.badge": "Ripoti ya umma",
  "report.pageTitle": "Toa Ripoti ya Hatari ya Mifereji",
  "report.pageSubtitle":
    "Hatua tatu fupi. Maelezo yako ya mawasiliano yatabaki faragha kwa wafanyakazi; eneo, aina, ukali, hali, na picha ya kwanza zinaweza kuonekana kwenye ramani ya umma.",

  "report.steps.details": "Maelezo",
  "report.steps.location": "Eneo",
  "report.steps.review": "Kagua",

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

  "report.notConnected.title": "Utoaji wa ripoti haujaunganishwa",
  "report.notConnected.body":
    "Mipangilio ya Firebase haipo, hivyo ripoti haziwezi kuhifadhiwa. Fomu bado inapatikana ili mtiririko uweze kukaguliwa.",

  "report.fields.category": "Aina ya hatari",
  "report.fields.severity": "Ukali kiasi gani?",
  "report.fields.title": "Kichwa kifupi",
  "report.fields.titleHint":
    "Si lazima. Tutaunda kimoja kutoka aina na eneo ikiwa utaacha wazi.",
  "report.fields.titlePlaceholder": "mf. Mfereji uliozibwa unasababisha mafuriko Nakawa",
  "report.fields.description": "Nini kinaendelea?",
  "report.fields.descriptionHint":
    "Angalau herufi {min}. Taja alama za karibu, mtiririko wa maji, na hatari yoyote ya haraka.",
  "report.fields.descriptionPlaceholder":
    "Elezea hatari, muda imekuwepo, na kinachoathiriwa.",
  "report.fields.photos": "Picha (si lazima)",
  "report.fields.photosHint": "Picha wazi husaidia wafanyakazi kuthibitisha hatari haraka.",
  "report.fields.yourDetails": "Maelezo yako (si lazima)",
  "report.fields.detailsHint":
    "Wafanyakazi pekee ndio wanaweza kuona hili. Hazionyeshwi kwenye ramani ya umma. Acha wazi ili kutoa ripoti bila jina.",
  "report.fields.name": "Jina",
  "report.fields.phone": "Simu",
  "report.fields.phonePlaceholder": "+256…",
  "report.fields.email": "Barua pepe",
  "report.fields.division": "Wilaya",
  "report.fields.divisionHint": "Huna uhakika? Chagua iliyo karibu zaidi.",
  "report.fields.notSure": "Sina uhakika",
  "report.fields.landmark": "Alama ya karibu au anwani",
  "report.fields.landmarkHint": "Si lazima lakini husaidia sana.",
  "report.fields.landmarkPlaceholder": "mf. Karibu na Soko la Nakawa, mkabala na kituo cha teksi",
  "report.fields.address": "Anwani",
  "report.fields.latitude": "Latitudo",
  "report.fields.longitude": "Longitudo",

  "report.location.noPin": "Hakuna alama iliyowekwa bado",
  "report.location.geoUnsupported": "Kivinjari hiki hakitumii eneo la GPS. Weka alama badala yake.",
  "report.location.captured": "Eneo limepatikana kwa usahihi wa mita {meters}. Rekebisha alama ikihitajika.",
  "report.location.denied": "Ruhusa ya eneo imekataliwa. Weka alama kwenye ramani badala yake.",
  "report.location.failed": "Imeshindikana kupata eneo lako. Weka alama kwenye ramani badala yake.",
  "report.location.serviceArea":
    "Ripoti zinazoweza kuwasilishwa ni zile zilizo ndani ya eneo la huduma la Kampala pekee. Ikiwa alama iko nje kidogo, isogeze badala ya kuiacha nje ya jiji.",

  "report.photos.limitSignedIn": "Unaweza kuambatisha hadi picha {max}.",
  "report.photos.limitAnonymous":
    "Ripoti zisizo na jina zinajumuisha picha moja ya jalada. Ingia ili kuambatisha zaidi.",

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
  "report.consentError": "Thibitisha kuwa ripoti ni sahihi na inaweza kuonyeshwa hadharani.",

  "report.warning.critical": "Hatari kubwa imegunduliwa na AI",
  "report.warning.criticalBody":
    "Ripoti hii imetathminiwa kuwa na ukali mkubwa. Ikiwa kuna hatari ya haraka kwa maisha, wasiliana na huduma za dharura (112) kabla ya kuwasilisha.",
  "report.warning.high": "Hatari ya ukali wa juu",
  "report.warning.highBody":
    "AI imetathmini hii kuwa hatari ya ukali wa juu. Weka watu mbali na uwasilishe mara itakapokuwa salama.",

  "report.review.editDetails": "Hariri maelezo",
  "report.review.editLocation": "Hariri eneo",
  "report.review.titleFallback": "Kichwa kitaundwa kiotomatiki",
  "report.review.categoryMissing": "Aina haipo",
  "report.review.locationLabel": "Eneo",
  "report.review.noCoordinates": "Hakuna kuratibu",
  "report.review.reporterLabel": "Mtoa ripoti",
  "report.review.anonymous": "Mtoa ripoti asiyejulikana",
  "report.review.photosLabel": "Picha",
  "report.review.noPhotos": "Hakuna picha",
  "report.review.photoReadyOne": "Picha 1 iko tayari",
  "report.review.photoReadyMany": "Picha {count} ziko tayari",
  "report.review.photosPublicNote": "Picha ya kwanza inaweza kuonekana hadharani.",
  "report.review.noSuggestion": "Hakuna pendekezo bado. Endelea bila moja, au rudia uchambuzi.",
  "report.review.matches": "Inalingana na ripoti yako",
  "report.review.confidenceNote":
    "Hii ni ushauri tu; wafanyakazi watathibitisha. Kuwasilisha hakukubali pendekezo kiotomatiki.",

  "report.success.title": "Ripoti Imepokelewa",
  "report.success.body":
    "Asante. Ripoti imehifadhiwa kwa ukaguzi wa wafanyakazi na sasa inaonekana kwenye dashibodi ya uendeshaji.",
  "report.success.aiAssessment": "Tathmini ya AI",
  "report.success.severityWord": "ukali",
  "report.success.categoryLabel": "Aina",
  "report.success.urgencyLabel": "Uharaka",
  "report.success.confidenceLabel": "Uhakika",
  "report.success.urgentCritical":
    "Hii inaonekana kama hatari kubwa. Ikiwa kuna hatari ya haraka kwa maisha, piga huduma za dharura (112) kwanza.",
  "report.success.urgentHigh":
    "Hii inaonekana kama hatari kubwa. Weka watu mbali na uripoti kwa mamlaka za eneo ikihitajika.",
  "report.success.reference": "Nambari ya Rejea",
  "report.success.copy": "Nakili",
  "report.success.copied": "Imenakiliwa!",
  "report.success.copyAria": "Nakili nambari ya rejea",
  "report.success.viewMap": "Tazama kwenye Ramani",
  "report.success.another": "Wasilisha Ripoti Nyingine",
  "report.success.backHome": "Rudi Nyumbani",
  "report.success.footnote":
    "Hifadhi nambari ya rejea ikiwa utahitaji kufuatilia. Wafanyakazi watawasiliana nawe tu ikiwa ulitoa maelezo ya mawasiliano.",

  "report.ai.title": "Pendekezo la AI",
  "report.ai.analysing": "Inachambua maelezo…",
  "report.ai.confidence": "uhakika",
  "report.ai.category": "Aina",
  "report.ai.severity": "Ukali",
  "report.ai.urgency": "Uharaka",
  "report.ai.analysingPhoto": "Inachambua picha…",
  "report.ai.fallbackSource": "Pendekezo la kanuni",
  "report.ai.fallbackNotice":
    "Gemini haipatikani kwa sasa, hivyo pendekezo la kanuni linaonyeshwa badala yake.",

  "report.errors.location": "Eneo linahitajika",
  "report.errors.details":
    "Maelezo kadhaa bado yanahitaji kuangaliwa. Rudi nyuma ukamilishe sehemu zilizoangaziwa.",
  "report.errors.submitTitle": "Imeshindikana kuwasilisha",

  "report.submit.notConfigured": "Utoaji wa ripoti haujaunganishwa na Firebase katika mazingira haya.",
  "report.submit.cooldown":
    "Ripoti imewasilishwa hivi karibuni kutoka kivinjari hiki. Subiri dakika moja kabla ya kutuma nyingine.",
  "report.submit.genericError":
    "Ripoti imeshindikana kuwasilishwa. Angalia muunganisho wako na ujaribu tena.",

  "report.upload.photo": "Inapakia picha {current} kati ya {total}…",
  "report.upload.saving": "Inahifadhi ripoti yako…",
  "report.upload.submitting": "Inawasilisha…",

  "report.sidebar.nextTitle": "Hatua inayofuata",
  "report.sidebar.next1": "Ripoti imehifadhiwa kwa faragha kwa ukaguzi wa wafanyakazi.",
  "report.sidebar.next2": "Pendekezo la AI limeambatishwa, lakini mtu ndiye anaamua kulitumia.",
  "report.sidebar.next3": "Wafanyakazi wanachunguza tukio na kusasisha hali yake.",
  "report.sidebar.safeTitle": "Kaa salama",
  "report.sidebar.safeBody":
    "Usiingie kwenye maji ya mafuriko, mashimo ya maji wazi, au mifereji iliyoharibika. Toa ripoti kutoka umbali salama. Kwa dharura ya haraka, wasiliana na huduma za dharura za eneo kwanza.",
  "report.sidebar.signedInAs": "Umeingia kama",
  "report.sidebar.linkedAccount": "Ripoti hii itaunganishwa na akaunti yako ya kazi.",

  "report.photoUploader.dropOrBrowse": "Dondosha picha hapa, au vinjari",
  "report.photoUploader.limitReached": "Kikomo cha picha kimefikiwa",
  "report.photoUploader.hintOne": "Hadi picha 1 · JPEG, PNG, au WebP · upeo {size} MB",
  "report.photoUploader.hintMany": "Hadi picha {max} · JPEG, PNG, au WebP · upeo {size} MB kila moja",
  "report.photoUploader.choosePhotos": "Chagua picha",
  "report.photoUploader.footerNote":
    "Picha hupunguzwa ukubwa kwenye kivinjari chako kabla ya kupakiwa. Zinaweza kuonekana kwenye ramani ya umma.",

  "report.support.title": "Tuma ujumbe kwa timu yetu",
  "report.support.body":
    "Huwezi kukamilisha fomu? Tuma ujumbe mfupi na mfanyakazi atafuatilia.",
  "report.support.messagePlaceholder": "Unahitaji msaada gani?",
  "report.support.submit": "Tuma ujumbe",
  "report.support.sending": "Inatuma…",
  "report.support.success": "Ujumbe umetumwa. Mfanyakazi atafuatilia hivi karibuni.",
  "report.support.error": "Imeshindikana kutuma ujumbe wako. Jaribu tena au tumia njia za mawasiliano hapo juu.",
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
