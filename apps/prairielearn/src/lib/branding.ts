/**
 * Centralized Branding and Localization Configuration
 *
 * Allows full customization of platform identity, logos, titles,
 * and support links across the entire platform via environment variables
 * or per-institution settings without any hardcoded strings.
 *
 * Safe for execution in both Node.js (SSR) and Browser (Hydrated React) environments.
 */

const env: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {};

export interface InstitutionBrandContext {
  id?: string | number | null;
  short_name?: string | null;
  long_name?: string | null;
}

export const platformBranding = {
  // Brand Names & Slogans
  brandName: env.PL_BRAND_NAME || 'سامانه ارزیابی هوشمند دانشگاه علم و صنعت ایران',
  brandShortName: env.PL_BRAND_SHORT_NAME || 'سامانه ارزیابی IUST',
  brandTitle:
    env.PL_BRAND_TITLE || 'سامانه جامع تمرین، آزمون و ارزیابی هوشمند — دانشگاه علم و صنعت ایران',
  brandSubtitle:
    env.PL_BRAND_SUBTITLE ||
    'پلتفرم برخط تمرین‌ها، آزمون‌های برنامه‌نویسی و تصحیح خودکار — دانشگاه علم و صنعت ایران (IUST)',
  logoUrl: env.PL_LOGO_URL || '',

  // Contact & Links
  portalName: env.PL_PORTAL_NAME || 'پرتال و پایگاه اطلاع‌رسانی',
  portalUrl: env.PL_PORTAL_URL || 'https://github.com/ArsalanDalvand/smart-homework',
  repoUrl: env.PL_REPO_URL || 'https://github.com/ArsalanDalvand/smart-homework',
  supportEmail: env.PL_SUPPORT_EMAIL || 'arsalan_dalvand@mathdep.iust.ac.ir',
  docsUrl:
    env.PL_DOCS_URL ||
    'https://test.atomathix.ir/shared/7wXYh2lXsgeyqDe3cO-1g1DQTVWSzNJMTgE2e597-EM',
  licenseUrl:
    env.PL_LICENSE_URL || 'https://github.com/ArsalanDalvand/smart-homework/blob/master/LICENSE',
  licenseName: 'GNU AGPLv3',

  // Developer & Maintainer
  developer: {
    name: env.PL_DEVELOPER_NAME || 'ارسلان دالوند',
    email: env.PL_DEVELOPER_EMAIL || 'arsalan_dalvand@mathdep.iust.ac.ir',
    telegram: env.PL_DEVELOPER_TELEGRAM || '@b_7vat4r',
    telegramUrl: 'https://t.me/b_7vat4r',
    role: 'توسعه و نگه‌داری پروژه',
    affiliation: 'دانشکده ریاضی، دانشگاه علم و صنعت ایران',
  },

  // Copyright & Meta
  copyrightYear: env.PL_COPYRIGHT_YEAR || '۱۴۰۵',
  upstreamAttribution:
    'بر پایه نرم‌افزار متن‌باز PrairieLearn (حق کپی‌رایت برای PrairieLearn, Inc. و هیئت امنای دانشگاه ایلینوی محفوظ است) تحت مجوز GNU AGPLv3',
  defaultLocale: 'fa',
  direction: 'rtl',
  fontFamily: 'var(--font-persian)',
};

/**
 * Returns the effective brand name for the given institutional context.
 * If viewing within a specific institution/organization, its official name is returned;
 * otherwise, the general platform brand is used.
 */
export function getEffectiveBrandName(institution?: InstitutionBrandContext | null): string {
  if (institution?.long_name && institution.short_name !== 'Default') {
    return institution.long_name;
  }
  return platformBranding.brandName;
}

/**
 * Returns the effective page title suffix.
 */
export function getEffectiveTitleSuffix(institution?: InstitutionBrandContext | null): string {
  if (institution?.long_name && institution.short_name !== 'Default') {
    return `${institution.long_name} — ${platformBranding.brandShortName}`;
  }
  return platformBranding.brandName;
}

/**
 * UI Message Catalog (i18n)
 * Centralizes all user-facing strings across navigation, dashboard, forms, and admin.
 */
export const uiStrings = {
  common: {
    home: 'صفحه اصلی',
    admin: 'مدیریت سامانه',
    help: 'راهنمایی و پشتیبانی',
    syncDisk: 'همگام‌سازی دیسک',
    settings: 'تنظیمات',
    logout: 'خروج از حساب',
    save: 'ذخیره',
    saveSettings: 'ذخیره تنظیمات',
    cancel: 'انصراف',
    delete: 'حذف',
    remove: 'حذف',
    approve: 'تایید',
    deny: 'رد درخواست',
    edit: 'ویرایش',
    close: 'بستن',
    details: 'جزئیات',
    actions: 'عملیات',
    status: 'وضعیت',
    name: 'نام و نام خانوادگی',
    uid: 'شناسه کاربری (UID)',
    email: 'آدرس ایمیل',
    institution: 'موسسه / مرکز آموزشی',
    timezone: 'منطقه زمانی',
    created: 'تاریخ ایجاد',
    updated: 'تاریخ به‌روزرسانی',
    pending: 'در انتظار بررسی',
    approved: 'تایید شده',
    rejected: 'رد شده',
    yes: 'بله',
    no: 'خیر',
    unknown: 'نامشخص',
    copy: 'کپی',
    copied: 'کپی شد',
  },
  nav: {
    brandAria: 'صفحه اصلی سامانه',
    switchRole: 'حالت نمایش',
    viewAs: 'مشاهده به‌عنوان',
    staffView: 'نمای کادر آموزشی و مدرسان',
    customStaffView: 'نمای سفارشی‌شده کادر آموزشی',
    studentView: 'نمای فراگیر / دانشجو',
    studentNoRulesView: 'نمای فراگیر (بدون محدودیت دسترسی)',
    resetStaffView: 'بازنشانی به نمای پیش‌فرض مدرس',
    effectiveUser: 'کاربر مجازی (تست دسترسی‌ها)',
    changeUid: 'تغییر کاربر',
    customizeOverrides: 'تنظیمات پیشرفته هویت و نقش…',
    adminAccessToggleOn: 'فعال‌سازی دسترسی مدیر',
    adminAccessToggleOff: 'غیرفعال‌سازی دسترسی مدیر',
    requestCourse: 'درخواست ایجاد درس یا دوره',
    examModeNotice: 'حالت آزمون فعال است. دسترسی‌های شما به آزمون جاری محدود می‌باشد.',
  },
  home: {
    devModeTitle: 'حالت توسعه و مدیریت محتوا',
    devModeNotice:
      'سامانه هم‌اکنون در حالت توسعه (Dev Mode) اجرا شده است. با تغییر فایل‌های پیکربندی و سوالات درس در پوشه کدها، جهت اعمال سریع تغییرات بر روی دکمه «همگام‌سازی دیسک» در نوار بالا کلیک کنید.',
    devModeHint:
      'تغییرات کدهای سرور، فایل‌های فرانت‌اند و فایل‌های استاتیک، با رفرش صفحه به‌صورت آنی بارگذاری می‌شوند.',
    adminInstitutionsTitle: 'موسسات و سازمان‌های تحت مدیریت',
    instructorCoursesTitle: 'درس‌ها و دوره‌های تحت مدیریت (مدرس / دستیار)',
    studentCoursesTitle: 'درس‌ها و دوره‌های من (دسترسی فراگیر)',
    studentCoursesTitleSimple: 'درس‌های من',
    githubRepoBtn: 'مخزن گیت‌هاب',
    joinCourseBtn: 'عضویت در درس',
    noStudentCoursesWithInstructor:
      'در حال حاضر دوره‌ای با نقش فراگیر برای شما ثبت نشده است. دوره‌های تحت مدیریت شما در جدول بالا قرار دارند.',
    joinCourseHint:
      'جهت عضویت در دوره‌های دیگر با نقش فراگیر، بر روی دکمه «عضویت در درس» کلیک نمایید.',
    noCoursesDevMode:
      'هیچ دوره‌ای بارگذاری نشده است. بر روی دکمه «همگام‌سازی دیسک» در نوار بالا کلیک کنید.',
    noCoursesGeneral: 'دوره‌ای یافت نشد. جهت افزودن دوره، بر روی دکمه «عضویت در درس» کلیک کنید.',
    invitationBadge: 'دعوت‌نامه',
    acceptInvitation: 'پذیرش',
    rejectInvitation: 'رد دعوت',
    removeCourse: 'حذف',
    pastTerms: 'دوره‌های گذشته',
    rejectModalTitle: 'رد دعوت‌نامه دوره',
    rejectModalDesc:
      'آیا از رد کردن این دعوت‌نامه اطمینان دارید؟ در صورتی که دوره ثبت‌نام خودکار نداشته باشد، برای عضویت مجدد باید توسط مدرس دعوت شوید.',
    rejectModalConfirm: 'رد دعوت‌نامه',
    removeModalTitle: 'حذف دوره از داشبورد',
    removeModalDesc: 'آیا از حذف این دوره از فهرست دوره‌های خود اطمینان دارید؟',
    removeModalNotice:
      'حذف دوره از این بخش صرفاً نمایش آن در داشبورد سامانه را پنهان می‌کند و تأثیری بر سوابق آموزشی یا ثبت‌نام شما نخواهد داشت.',
    removeModalReappear: 'ممکن است پس از به‌روزرسانی اطلاعات ثبت‌نامی موسسه، این دوره مجدداً ظاهر شود.',
    removeModalConfirm: 'حذف از داشبورد',
    enrollmentCodeHelp:
      'جهت عضویت در دوره، کد ثبت‌نامی که توسط مدرس یا برگزارکننده ارائه شده است را وارد نمایید.',
  },
  auth: {
    loginTitle: 'ورود به سامانه',
    loginSubtitle: 'جهت دسترسی به دوره‌ها، آزمون‌ها و محتوای آموزشی',
    loginTab: 'ورود به سامانه',
    registerTab: 'ثبت‌نام کاربر جدید',
    identifierLabel: 'ایمیل یا شماره دانشجویی:',
    identifierPlaceholder: 'ایمیل یا شماره دانشجویی',
    passwordLabel: 'رمز عبور:',
    passwordPlaceholder: 'حداقل ۶ کاراکتر',
    confirmPasswordLabel: 'تکرار رمز عبور:',
    confirmPasswordPlaceholder: 'تکرار رمز عبور را وارد نمایید',
    loginBtn: 'ورود به سامانه',
    registerBtn: 'ثبت‌نام و ورود به سامانه',
    orDivider: 'یا',
    ssoDivider: 'ورود از طریق درگاه‌های سازمانی و هویتی',
    forgotPasswordHint: 'رمز عبور خود را فراموش کرده‌اید؟ با پشتیبانی سامانه تماس بگیرید.',
    haveAccount: 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید',
    dontHaveAccount: 'حساب کاربری ندارید؟ ثبت‌نام کنید',
    registerNotice:
      'با ثبت‌نام، حساب کاربری شما فوراً فعال شده و می‌توانید در دوره‌ها شرکت کرده یا درخواست ایجاد درس دهید.',
    invalidPasswordError: 'شناسه کاربری یا رمز عبور وارد شده نادرست است.',
    userNotFoundError: 'کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
    emailExistsError: 'این ایمیل یا شناسه قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.',
    noPasswordSetError:
      'برای این حساب کاربری رمز عبور ثبت نشده است. در صورتی که قبلاً با ورود رسمی یا سریع وارد شده‌اید، از همان روش استفاده نمایید.',
    passwordLengthError: 'رمز عبور باید حداقل شامل ۶ کاراکتر باشد.',
    passwordMismatchError: 'رمز عبور با تکرار آن مطابقت ندارد.',
    requiredFieldsError: 'لطفاً تمامی فیلدهای الزامی را تکمیل نمایید.',
    invalidEmailError: 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.',
    invalidNameError: 'لطفاً نام و نام خانوادگی خود را کامل وارد نمایید.',
    registrationSuccess: 'حساب کاربری با موفقیت ایجاد شد.',
    loginSuccess: 'ورود با موفقیت انجام شد.',
    altchaError:
      'تایید امنیتی انجام نشد یا منقضی شده است. لطفاً صفحه را تازه‌سازی کرده و دوباره تلاش کنید.',
    uinFormatError: 'شماره دانشجویی / پرسنلی باید فقط شامل ۸ تا ۱۲ رقم باشد.',
    uinFakeError:
      'شماره دانشجویی / پرسنلی وارد شده معتبر به نظر نمی‌رسد. لطفاً شماره واقعی خود را وارد نمایید.',
    uinExistsError: 'این شماره دانشجویی / پرسنلی قبلاً در سامانه ثبت شده است.',
    courseRequestInstructorNotice:
      'استاد / متقاضی گرامی: برای ثبت درخواست ایجاد درس یا دوره جدید، ابتدا باید وارد حساب کاربری خود شوید یا ثبت‌نام نمایید. پس از تکمیل ورود، به‌صورت خودکار به فرم درخواست درس هدایت خواهید شد.',
    courseRequestWarningHeader: 'هشدار دسترسی: ورود یا ثبت‌نام الزامی است',
    loginWithGoogle: 'ورود با حساب گوگل',
    loginWithMicrosoft: 'ورود با حساب مایکروسافت',
    loginWithSso: 'ورود یکپارچه سازمانی / دانشگاهی (SSO)',
    institutionHeader: 'ورود از طریق درگاه سازمانی یا دانشگاهی',
    institutionPlaceholder: 'جستجوی نام موسسه یا دانشگاه...',
    institutionAria: 'جستجوی نام موسسه یا سازمان',
    preferredMethod: 'روش پیشنهادی',
    otherMethods: 'سایر روش‌های ورود',
    devLoginTitle: 'ورود سریع در محیط توسعه (Dev Mode)',
    devBypassBtn: 'ورود سریع مدیر سیستم (حالت توسعه)',
    devBypassHint: 'احراز هویت سریع با شناسه',
    uidLabel: 'شناسه کاربری (UID / ایمیل):',
    nameLabel: 'نام و نام خانوادگی:',
    uinLabel: 'شماره دانشجویی / پرسنلی',
    uinHelp: 'الزامی؛ شماره دانشجویی، پرسنلی یا شناسه فراگیر',
    uinPlaceholder: '40123456',
    emailLabel: 'آدرس ایمیل سازمانی / کاربری',
    emailPlaceholder: 'user@example.com',
    uidPlaceholder: 'user@example.com یا نام کاربری',
    namePlaceholder: 'علی محمدی',
    devLoginBtn: 'ورود به سامانه',
    welcomeBadge: 'سامانه آموزش و سنجش تعاملی',
    welcomeHeading: 'سامانه جامع ارزیابی و یادگیری هوشمند',
    welcomeDescription:
      'پلتفرم یکپارچه یادگیری تسلط‌محور، آزمون‌های برخط و تصحیح خودکار با ساختار مستقل و بدون وابستگی به برند خاص.',
    feature1Title: 'یادگیری تسلط‌محور (Mastery Learning)',
    feature1Desc: 'امکان تمرین نامحدود با نمونه‌های تصادفی تا دستیابی به تسلط ۱۰۰٪ بر مباحث.',
    feature2Title: 'تصحیح آنی کد و محاسبات',
    feature2Desc: 'داوری خودکار کدهای برنامه‌نویسی، فرمول‌های ریاضی و پاسخ‌های تحلیلی.',
    feature3Title: 'آزمون‌های استاندارد و ایمن',
    feature3Desc: 'پشتیبانی از کوییزهای کلاسی، تکالیف و امتحانات نهایی با ضریب امنیت بالا.',
    guideHeader: 'راهنمای ورود فراگیران و طراحان:',
    guideStudent:
      'دانشجویان و فراگیران: عضویت شما توسط استاد درس یا سامانه آموزشی انجام می‌گیرد؛ جهت ورود از شناسه کاربری یا ایمیل سازمانی خود استفاده فرمایید.',
    guideInstructor:
      'اساتید و مدرسان: برای ایجاد درس جدید و طراحی بانک سوال، فرم درخواست درس را تکمیل نمایید.',
    requestCourseAction: 'درخواست ایجاد درس جدید',
    supportAction: 'راهنما و پشتیبانی',
  },
  landing: {
    badge: 'سامانه آموزش، آزمون و یادگیری تعاملی',
    title: 'سامانه جامع ارزیابی و یادگیری هوشمند',
    tagline: 'پلتفرم نسل جدید یادگیری تسلط‌محور، سنجش مهارت‌های تخصصی و داوری خودکار',
    description:
      'بستر یکپارچه و استاندارد جهت برگزاری انواع آزمون‌های آنلاین و حضوری، حل تمرین‌های نامحدود با مقادیر تصادفی و تصحیح هوشمند کدهای برنامه‌نویسی برای تمامی دروس، رشته‌ها و موسسات آموزشی.',
    showcaseTitle: 'نقاط قوت و مزایای محوری پلتفرم',
    benefit1Title: 'آزمون‌های تعاملی و متنوع',
    benefit1Desc:
      'پشتیبانی از انواع سوالات چندگزینه‌ای، عددی، ماتریسی، دیاگرام‌های تعاملی و بلوک‌های منطقی با پارامترهای تصادفی نامحدود.',
    benefit2Title: 'تصحیح خودکار کدهای برنامه‌نویسی با تست‌کیس',
    benefit2Desc:
      'کامپایل و اجرای امن کد در محیط‌های ایزوله، سنجش دقیق با تست‌کیس‌های آزمایشی و ارائه بازخورد فوری و تشخیصی به فراگیر.',
    benefit3Title: 'نمره‌دهی عادلانه، دقیق و بلادرنگ',
    benefit3Desc:
      'محاسبه شفاف و آنی نمرات بدون خطای انسانی، بازخورد آموزشی گام‌به‌گام و امکان تلاش مجدد تا دستیابی به تسلط ۱۰۰٪ بر مباحث آموزشی.',
    guideTitle: 'چگونه وارد شوم؟ (راهنمای کاربران جدید)',
    learnerHeading: 'برای فراگیران و دانشجویان:',
    learnerDesc:
      'نیازی به فرایند پیچیده ثبت‌نام نیست؛ با وارد کردن ایمیل یا شناسه خود وارد سامانه شوید و از طریق کد دوره یا دعوت‌نامه استاد در درس مربوطه عضو شوید.',
    instructorHeading: 'برای اساتید و مدرسان:',
    instructorDesc:
      'جهت ایجاد درس جدید، پس از ورود به سامانه می‌توانید از فرم «درخواست ایجاد دوره» استفاده نمایید یا مستقیماً از دکمه زیر اقدام فرمایید.',
    devModeNoteHeading: 'نکته حالت توسعه (Dev Mode):',
    devModeNoteDesc:
      'این سامانه در حالت توسعه قرار دارد؛ برای تست و ورود کافی است نام و ایمیل دلخواه خود را وارد کرده یا دکمه ورود سریع را لمس کنید.',
    requestCourseBtn: 'درخواست ایجاد دوره جدید',
    supportBtn: 'راهنما و مستندات',
    loginCardTitle: 'ورود به حساب کاربری',
    loginCardSubtitle: 'جهت دسترسی به آزمون‌ها، تکالیف و دوره‌های آموزشی',
    quickDevLoginNotice: 'احراز هویت بدون رمز عبور جهت تست و بررسی امکانات',
    footerCopyright: 'توسعه و نگه‌داری: ارسلان دالوند (دانشکده ریاضی، دانشگاه علم و صنعت ایران)',
    footerDocsLink: 'مستندات طراحان سوال',
    footerRepoLink: 'مخزن گیت‌هاب',
    footerSupportLink: 'پشتیبانی فنی',
    noInstitutionsFound: 'موردی یافت نشد',
    loginFooterHelp: 'نیاز به راهنمایی دارید یا مدرس هستید؟',
  },
  support: {
    title: 'راهنمایی و پشتیبانی',
    intro:
      'فراگیران، اساتید، مدرسان و کاربران گرامی، جهت دریافت راهنمایی یا رفع اشکال از مسیرهای زیر استفاده فرمایید:',
    docsTitle: 'راهنمای جامع تدریس و طراحی دوره',
    docsDesc:
      'مستندات آموزشی نحوه طراحی سوالات، تکالیف، آزمون‌ها و تصحیح خودکار برای مدرسان و طراحان دوره.',
    docsAction: 'مشاهده مستندات راهنما',
    repoTitle: 'مخزن سامانه در گیت‌هاب',
    repoDesc:
      'دسترسی به سورس‌کد سامانه ارزیابی هوشمند، گزارش باگ‌ها و مشارکت در توسعه قابلیت‌های پلتفرم.',
    repoAction: 'مشاهده ریپازیتوری',
    contactTitle: 'پشتیبانی فنی و ارتباط با مدیران',
    contactDesc:
      'ارتباط با تیم پشتیبانی جهت راه‌اندازی دوره جدید، دسترسی‌ها و رفع اشکالات احتمالی سامانه.',
    contactAction: 'ارسال ایمیل به پشتیبانی',
    portalTitle: 'پرتال و پایگاه اطلاع‌رسانی',
    portalDesc: 'دسترسی به تقویم آموزشی، سامانه‌های یکپارچه و اطلاع‌رسانی دوره‌های آموزشی.',
    portalAction: 'ورود به پرتال اطلاع‌رسانی',
  },
  adminFeatures: {
    modalTitle: 'اعطای دسترسی به قابلیت',
    enableFeature: 'فعال‌سازی قابلیت',
    disableFeature: 'غیرفعال‌سازی قابلیت',
    overrideNotice:
      'فعال یا غیرفعال کردن یک قابلیت، تنظیمات کلی سطوح بالاتر (مانند موسسه یا دوره) را بازنویسی می‌کند.',
    institutionLabel: 'موسسه / مرکز آموزشی',
    allInstitutions: 'تمامی موسسات و مراکز',
    courseLabel: 'درس یا دوره',
    allCourses: 'تمامی درس‌های این موسسه',
    instanceLabel: 'دوره / ترم تحصیلی',
    allInstances: 'تمامی دوره‌های این درس',
    userLabel: 'کاربر مشخص (اختیاری)',
    userHelp: 'در صورت خالی بودن، برای تمام کاربران در محدوده انتخابی اعمال می‌گردد.',
    userPlaceholder: 'user@example.com',
    submitBtn: 'ثبت و اعطای قابلیت',
    cancelBtn: 'انصراف',
    revokeConfirm: 'آیا از لغو این دسترسی اطمینان دارید؟',
    revokeBtn: 'لغو دسترسی',
    statusAria: 'فعال یا غیرفعال‌سازی قابلیت',
    statusEnabled: '✅ فعال',
    statusDisabled: '❌ غیرفعال',
    noGrants: 'هیچ دسترسی اختصاصی برای این قابلیت ثبت نشده است.',
  },
  adminSettings: {
    pageTitle: 'تنظیمات سرور و کش سامانه',
    chunksTitle: 'تولید بسته‌ها و چانک‌های استاتیک',
    chunksLabel: 'شناسه درس‌ها (Course IDs):',
    chunksBtn: 'تولید مجدد چانک‌ها',
    opsTitle: 'عملیات مدیریت سیستم',
    clearRenderCacheBtn: 'پاک‌سازی حافظه کش رندر سوالات',
    playgroundTitle: 'محیط آزمون استایل‌ها و رنگ‌های سیستم',
    playgroundDesc:
      'این بخش جهت بررسی استایل‌های فوکوس، تضاد رنگی و انطباق با استانداردهای دسترسی‌پذیری رابط کاربری طراحی شده است.',
    badgesTitle: 'نشان‌های رنگی سفارشی',
    badgePillsTitle: 'نشان‌های کپسولی رنگی',
    clickableBadgesTitle: 'نشان‌های دکمه‌ای قابل کلیک',
    ghostButtonTitle: 'دکمه‌های شفاف (Ghost Button)',
    ghostButtonDesc:
      'این سبک دکمه برای مواردی کاربرد دارد که وزن بصری کمتری نسبت به دکمه‌های معمولی مدنظر است، مانند تریگرهای پاپ‌اور و منوها.',
    ghostExtraSmall: 'بسیار کوچک',
    ghostSmall: 'کوچک',
    ghostDefault: 'پیش‌فرض',
    ghostLarge: 'بزرگ',
    newsTitle: 'اطلاعیه‌ها و اخبار پلتفرم',
    newsColTitle: 'عنوان',
    newsColDate: 'تاریخ انتشار',
    newsColStatus: 'وضعیت',
    newsColActions: 'عملیات',
    newsVisible: 'نمایش داده می‌شود',
    newsHidden: 'پنهان شده',
    newsHideBtn: 'پنهان‌سازی',
    newsShowBtn: 'نمایش مجدد',
    llmBenchmarkTitle: 'ارزیابی مدل‌های زبانی هوش مصنوعی (LLM)',
    llmBenchmarkDesc:
      'آزمون هوش مصنوعی با تولید سوالات نمونه از پرامپت‌ها و سنجش کیفیت آن‌ها توسط مدل زبانی و مقایسه با استانداردهای مرجع انجام می‌پذیرد.',
    llmBenchmarkBtn: 'آزمون و ارزیابی کیفیت تولید هوشمند سوال',
    syncDocsBtn: 'همگام‌سازی مجدد مستندات کانتکست',
  },
  adminCourses: {
    institutionLabel: 'موسسه / مرکز آموزشی',
    institutionRequired: 'موسسه یا مرکز آموزشی را انتخاب کنید',
    institutionSelectPlaceholder: 'انتخاب موسسه یا مرکز...',
    institutionAutoFill: 'موسسه انتخاب‌شده',
    titleLabel: 'عنوان کامل درس یا دوره',
    titlePlaceholder: 'مثال: مبانی برنامه‌نویسی پایتون یا ریاضیات',
    titleRequired: 'عنوان کامل را وارد نمایید',
    shortNameLabel: 'کد یا نام اختصاری دوره',
    shortNamePlaceholder: 'CS 101',
    shortNameRequired: 'کد اختصاری را وارد نمایید',
    repoLabel: 'نام مخزن گیت (Repository)',
    repoPlaceholder: 'pl-course',
    repoRequired: 'نام مخزن را وارد نمایید',
    timezoneRequired: 'منطقه زمانی را وارد نمایید',
  },
  adminInstitutions: {
    pageTitle: 'موسسات، سازمان‌ها و مراکز آموزشی',
    addBtn: 'افزودن موسسه یا مرکز جدید',
    tableAria: 'موسسات و سازمان‌های آموزشی',
    colShortName: 'کد اختصاری',
    colLongName: 'نام کامل موسسه / مرکز آموزشی',
    colTimezone: 'منطقه زمانی',
    colUidRegexp: 'الگوی شناسه (UID Regexp)',
    colAuthnProviders: 'روش‌های احراز هویت',
    defaultAuthn: 'پیش‌فرض داخلی',
    modalTitle: 'تعریف موسسه، سازمان یا واحد آموزشی جدید',
    shortNameLabel: 'کد اختصاری موسسه / مرکز',
    shortNamePlaceholder: 'مثال: AI',
    shortNameRequired: 'کد اختصاری را وارد نمایید',
    shortNameHelp: 'نام اختصاری موسسه، مرکز یا سازمان (مانند ACADEMY, AI, ORG, TECH).',
    longNameLabel: 'نام کامل موسسه / مرکز آموزشی',
    longNamePlaceholder: 'مثال: آکادمی هوش مصنوعی یا مرکز آموزش‌های تخصصی',
    longNameRequired: 'نام کامل را وارد نمایید',
    longNameHelp: 'نام رسمی و کامل موسسه، سازمان یا مرکز آموزشی.',
    timezoneLabel: 'منطقه زمانی',
    timezoneSuggestBtn: 'پیشنهاد خودکار منطقه زمانی',
    uidRegexpLabel: 'الگوی اعتبارسنجی شناسه کاربری (UID Regexp)',
    uidRegexpPlaceholder: 'مثال: @.*\\.org$',
    uidRegexpHelp:
      'الگوی اعتبارسنجی ایمیل سازمانی، به صورت <code dir="ltr">@.*\\.org$</code> یا دامنه ایمیل سازمان.',
    submitBtn: 'ثبت و ایجاد موسسه',
  },
  adminAdmins: {
    pageTitle: 'مدیران کل سامانه',
    addBtn: 'افزودن مدیر',
    popoverTitle: 'افزودن مدیر جدید سامانه',
    colUid: 'شناسه کاربری (UID)',
    colName: 'نام و نام خانوادگی',
    colActions: 'عملیات',
    removeBtn: 'حذف دسترسی مدیر',
    removeConfirm: 'آیا از حذف این مدیر اطمینان دارید؟',
    uidPlaceholder: 'user@example.com',
    submitBtn: 'افزودن مدیر جدید',
  },
  emptyState: {
    studentTitle: 'فراگیران و دانشجویان',
    studentDesc: 'عضویت در دوره‌ها و درس‌های آموزشی، شرکت در آزمون‌های برخط و حل تمرین‌ها.',
    instructorTitle: 'مدرسان، اساتید و طراحان دوره',
    instructorDesc:
      'طراحی و بارگذاری بانک سوالات، برگزاری آزمون‌های هوشمند، تصحیح خودکار و مدیریت فراگیران.',
  },
  enrollment: {
    modalTitle: 'عضویت در درس یا دوره',
    noCodeHelp:
      'کد ثبت‌نام ندارید؟ ممکن است مدرس دوره لینک مستقیم عضویت را در اختیار شما قرار داده یا از طریق سامانه مدیریت یادگیری اقدام نموده باشد.',
    instructorHelp:
      'مدرسان و طراحان محترم: کد ثبت‌نام و لینک مستقیم عضویت در صفحه تنظیمات هر دوره در دسترس است.',
    joinBtn: 'عضویت در دوره',
    lookingUpBtn: 'در حال بررسی کد…',
  },
  exam: {
    endExamBtn: 'پایان آزمون',
    endExamTitle: 'پایان و ثبت نهایی آزمون',
    endExamConfirm:
      'آیا از پایان دادن به آزمون خود اطمینان دارید؟ لطفاً فقط در صورتی که تمام پاسخ‌های خود را بررسی و ذخیره کرده‌اید این گزینه را تایید فرمایید. با این کار، مرورگر آزمون بسته خواهد شد.',
    endExamLoading: 'در حال ثبت و بستن آزمون…',
    endExamErrorTitle: 'خطا در پایان دادن به آزمون.',
    endExamErrorDesc:
      'لطفاً مجدداً تلاش نمایید یا از مراقب آزمون خود بخواهید تا جلسه آزمون شما را به پایان برساند.',
    endExamFinalBtn: 'پایان قطعی آزمون',
    reportCheatingBtn: 'گزارش تخلف در آزمون',
    reportCheatingTitle: 'ثبت گزارش تخلف در جلسه آزمون',
    reportCheatingDesc:
      'در صورتی که نقض قوانین آزمون (مانند استفاده از تلفن همراه، برگه تقلب یا سایر موارد غیرمجاز) را مشاهده کرده‌اید، جزئیات آن را در کادر زیر بنویسید. این گزارش کاملاً محرمانه بوده و تنها برای کادر آموزشی و مراقبان آزمون ارسال خواهد شد.',
    reportCheatingLabel: 'شرح تخلف مشاهده شده:',
    reportCheatingSubmit: 'ارسال گزارش محرمانه',
    reportCheatingLoading: 'در حال ارسال گزارش…',
  },
  admin: {
    adminsTitle: 'مدیران سامانه',
    addAdminBtn: 'افزودن مدیر جدید',
    addAdminTitle: 'افزودن مدیر جدید سامانه',
    adminsDesc:
      'مدیران سامانه دسترسی کامل به تمامی بخش‌ها، درس‌ها، سوالات و دوره‌ها دارند و می‌توانند مدیران دیگر را اضافه یا حذف نمایند.',
    coursesTitle: 'مدیریت درس‌ها و دوره‌ها',
    addCourseBtn: 'افزودن درس جدید',
    coursesDesc:
      'هنگام همگام‌سازی درس، در صورتی که مسیر فایل‌ها بر روی دیسک سرور موجود نباشد، دستور git clone از مخزن اجرا می‌شود، در غیر این صورت دستور git pull اعمال می‌گردد. همچنین کد و عنوان درس از روی فایل تنظیمات JSON در مخزن به‌روزرسانی می‌شوند.',
    institutionsTitle: 'موسسات و سازمان‌های همکار',
    addInstitutionBtn: 'افزودن موسسه / مرکز جدید',
    requestsTitle: 'درخواست‌های ایجاد درس جدید',
    workspacesTitle: 'سرورها و میزبان‌های محیط کاری (Workspaces)',
    featuresTitle: 'قابلیت‌ها و فلگ‌های سیستمی',
    settingsTitle: 'تنظیمات سرور و کش سامانه',
  },
  courseRequest: {
    title: 'درخواست ایجاد درس یا دوره آموزشی جدید',
    infoDesc:
      'این فرم برای مدرسان، اساتید و طراحان آموزشی جهت راه‌اندازی و تعریف درس یا دوره جدید در سامانه ارزیابی هوشمند است. فراگیران و دانشجویان گرامی نباید این فرم را پر کنند و جهت شرکت در آزمون‌ها یا حل تمرین، باید از طریق کد دوره که توسط مدرس ارائه می‌شود عضو شوند.',
    aboutYou: 'اطلاعات متقاضی (مدرس / طراح)',
    firstName: 'نام',
    lastName: 'نام خانوادگی',
    institution: 'موسسه، سازمان یا واحد آموزشی',
    institutionDesc: 'نام موسسه، سازمان یا واحد آموزشی برگزارکننده.',
    email: 'ایمیل رسمی / سازمانی',
    emailDesc: 'لطفاً از ایمیل معتبر و رسمی سازمانی خود استفاده فرمایید.',
    aboutCourse: 'مشخصات درس یا دوره پیشنهادی',
    shortName: 'کد یا نام اختصاری دوره (Course Rubric and Number)',
    shortNameDesc:
      'ساختار استاندارد: حروف بزرگ لاتین به همراه فاصله و شماره دوره (مانند CS 101 یا MATH 240).',
    shortNamePlaceholder: 'CS 101',
    courseTitle: 'عنوان کامل و رسمی درس یا دوره',
    courseTitleDesc: 'عنوان کامل دوره یا درس آموزشی.',
    courseTitlePlaceholder: 'مثال: مبانی برنامه‌نویسی پایتون یا ریاضیات',
    githubUser: 'نام کاربری گیت‌هاب (اختیاری جهت همگام‌سازی سوالات)',
    githubUserDesc:
      'در صورت ارائه نام کاربری گیت‌هاب، دسترسی به مخزن سوالات و کدهای درس برای شما فعال خواهد شد تا بتوانید در سیستم شخصی خود نیز سوالات را طراحی و همگام‌سازی نمایید.',
    aboutRequest: 'اطلاعات تکمیلی درخواست',
    referralSource: 'نحوه آشنایی با سامانه ارزیابی هوشمند',
    referralPlaceholder: 'انتخاب نمایید...',
    referralUsedBefore: 'قبلاً در سایر دوره‌ها یا مراکز آموزشی استفاده کرده‌ام',
    referralWordOfMouth: 'توصیه سایر مدرسان، همکاران یا اساتید',
    referralWebSearch: 'معرفی در اینترنت و موتورهای جستجو',
    referralWorkshop: 'کارگاه‌ها، وبینارها و رویدادهای آموزشی',
    referralPublication: 'مقالات و پژوهش‌های آموزش نوین و ارزیابی',
    referralOther: 'سایر موارد...',
    roleLabel: 'نقش شما در این دوره',
    roleInstructor: 'مدرس / استاد اصلی دوره (Instructor)',
    roleTa: 'دستیار آموزشی یا همکار تدریس (TA)',
    roleAdmin: 'مدیر آموزش یا کارشناس مرکز',
    roleStudent: 'دانشجو / فراگیر',
    roleTaNotice:
      'درخواست ایجاد دوره جدید باید توسط مدرس اصلی دوره تایید گردد. لطفاً از مدرس دوره بخواهید این فرم را ثبت نماید.',
    roleStudentNotice:
      'این فرم مختص مدرسان و برگزارکنندگان است. لطفاً جهت دسترسی به آزمون‌ها و محتوا، از مدرس دوره کد ورود را دریافت فرمایید.',
    submitBtn: 'ثبت نهایی درخواست دوره',
  },
  userSettings: {
    title: 'تنظیمات حساب کاربری',
    profileTitle: 'مشخصات و هویت کاربر',
    uin: 'شماره پرسنلی / دانشجویی (UIN)',
    authMethod: 'روش احراز هویت',
    ipAddress: 'آدرس IP جاری',
    tokensTitle: 'توکن‌های دسترسی شخصی (API Tokens)',
    generateTokenBtn: 'ایجاد توکن جدید',
    generateTokenModalTitle: 'ایجاد توکن دسترسی جدید',
    tokenNameLabel: 'عنوان یا نام توکن:',
    tokenNamePlaceholder: 'مثال: اسکریپت همگام‌سازی نمرات یا تست API',
    generateTokenSubmit: 'ایجاد و ذخیره توکن',
    deleteTokenModalTitle: 'حذف توکن دسترسی',
    deleteTokenWarning:
      'با حذف این توکن، تمامی برنامه‌ها و اسکریپت‌هایی که از آن استفاده می‌کنند بلافاصله دسترسی خود را از دست خواهند داد. این عملیات غیرقابل بازگشت است.',
    deleteTokenSubmit: 'تایید و حذف دائمی',
    shortcutsTitle: 'ترجیحات کاربری و کلیدهای میانبر',
    enableShortcuts: 'فعال‌سازی کلیدهای میانبر تک‌کلیدی',
    shortcutsDesc:
      'امکان استفاده از میانبرهای کیبورد برای جابجایی سریع میان سوالات و ثبت نمرات تصحیح دستی.',
    browserConfigTitle: 'تنظیمات فرمول‌نویسی و رندر مرورگر',
    resetMathJaxBtn: 'بازنشانی تنظیمات فرمول‌های ریاضی (MathJax)',
  },
  batchedMigrations: {
    pageTitle: 'مهاجرت‌های دسته‌ای پایگاه‌داده (Batched Migrations)',
    cardTitle: 'فهرست مهاجرت‌های دسته‌ای',
    detailsTitle: 'جزئیات عملیات مهاجرت داده‌ها',
    filename: 'نام فایل اسکریپت مهاجرت',
    minValue: 'حداقل مقدار شناسه (Min Value)',
    maxValue: 'حداکثر مقدار شناسه (Max Value)',
    status: 'وضعیت اجرا',
    createdAt: 'تاریخ ایجاد',
    updatedAt: 'آخرین به‌روزرسانی',
    startedAt: 'زمان شروع پردازش',
    actions: 'عملیات مدیریتی',
    retryFailedJobs: 'تلاش مجدد برای موارد ناموفق',
    recentSucceededJobs: 'دسته‌های با موفقیت اجرا شده اخیر',
    noRecentSucceededJobs: 'موردی با موفقیت اجرا نشده است',
    recentFailedJobs: 'دسته‌های ناموفق اخیر',
    noRecentFailedJobs: 'هیچ خطایی در اجرای دسته‌ها ثبت نشده است',
    statusPending: 'در انتظار (Pending)',
    statusPaused: 'متوقف شده (Paused)',
    statusRunning: 'در حال اجرا (Running)',
    statusFinalizing: 'در حال نهایی‌سازی (Finalizing)',
    statusFailed: 'ناموفق (Failed)',
    statusSucceeded: 'تکمیل موفق (Succeeded)',
    emptyText: 'مهاجرت دسته‌ای ثبت نشده است.',
  },
};
