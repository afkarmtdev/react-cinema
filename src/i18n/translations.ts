export type Language = 'en' | 'ms';

// All user-facing text lives here, keyed by a short name. Screens read it with
// the t() helper from LanguageContext. English is the default/fallback.
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    welcomeBack: 'Welcome back',
    loginSubtitle: 'Log in to rate and review what you watch.',
    email: 'Email',
    password: 'Password',
    yourPassword: 'Your password',
    login: 'Log in',
    noAccount: "Don't have an account?",
    goToSignup: 'Go to Signup',
    createAccount: 'Create account',
    signupSubtitle: 'Join to keep track of every film you rate.',
    name: 'Name',
    yourName: 'Your name',
    minChars: 'At least 6 characters',
    signup: 'Sign up',
    haveAccount: 'Already have an account?',
    goToLogin: 'Go to Login',

    // Auth errors (thrown as codes by AuthContext)
    errFillAll: 'Please fill in all fields.',
    errInvalidEmail: 'Please enter a valid email address.',
    errPasswordLength: 'Password must be at least 6 characters.',
    errEmailExists: 'An account with this email already exists.',
    errEnterCredentials: 'Please enter your email and password.',
    errIncorrect: 'Incorrect email or password.',
    errLoginGeneric: 'Unable to log in. Try again.',
    errSignupGeneric: 'Unable to sign up. Try again.',

    // Tabs
    moviesTab: 'Movies',
    reviewsTab: 'Reviews',
    meTab: 'Me',

    // Movies list
    moviesHeading: 'Movies',
    searchPlaceholder: 'Search movies by title…',
    nowShowing: 'Now Showing',
    advanceSales: 'Advance Sales',
    segmentInfo: "What's the difference?",
    nowShowingDesc: 'Top-rated titles first.',
    advanceSalesDesc: 'Newest releases first.',
    detailsInside: 'Details inside',
    filters: 'Filters',
    filterYear: 'Year',
    filterType: 'Type',
    filterAll: 'All',
    filterMovie: 'Movie',
    filterSeries: 'Series',
    filterYearHint: 'e.g. 2014',
    apply: 'Apply',
    clearFilters: 'Clear',
    noMoviesTitle: 'No movies found',
    noMoviesNothing: 'Nothing matched “{query}”.',
    noMoviesTry: 'Try searching for a title.',

    // Movie detail
    loadingMovie: 'Loading movie…',
    movieNotFound: 'Movie not found.',
    synopsis: 'Synopsis',
    cast: 'Cast',
    reviewsTitle: 'Reviews',
    noReviews: 'No reviews yet. Be the first to share your thoughts.',
    rateThisMovie: 'Rate this movie',
    yourReview: 'Your review',
    shareThoughts: 'Share your thoughts (optional)…',
    postReview: 'Post review',
    updateReview: 'Update review',
    tapStarFirst: 'Tap a star to rate this movie first.',

    // My Reviews
    myReviews: 'My Reviews',
    noReviewsYet: 'No reviews yet',
    rateAMovie: 'Rate a movie and it will show up here.',

    // Profile
    meHeading: 'Me',
    reviewsStat: 'Reviews',
    avgRating: 'Avg rating',
    logout: 'Log out',
    language: 'Language',

    // Shared states
    somethingWrong: 'Something went wrong',
    tryAgain: 'Try again',
    almostShowtime: 'Almost showtime…',
    couldNotLoadMovies: 'Could not load movies. Please try again.',
    couldNotLoadMovie: 'Could not load this movie. Please try again.',
  },

  ms: {
    // Auth
    welcomeBack: 'Selamat kembali',
    loginSubtitle:
      'Log masuk untuk menilai dan mengulas filem yang anda tonton.',
    email: 'E-mel',
    password: 'Kata laluan',
    yourPassword: 'Kata laluan anda',
    login: 'Log masuk',
    noAccount: 'Tiada akaun?',
    goToSignup: 'Daftar akaun',
    createAccount: 'Cipta akaun',
    signupSubtitle: 'Sertai untuk menjejaki setiap filem yang anda nilai.',
    name: 'Nama',
    yourName: 'Nama anda',
    minChars: 'Sekurang-kurangnya 6 aksara',
    signup: 'Daftar',
    haveAccount: 'Sudah mempunyai akaun?',
    goToLogin: 'Log masuk',

    // Auth errors
    errFillAll: 'Sila isi semua medan.',
    errInvalidEmail: 'Sila masukkan alamat e-mel yang sah.',
    errPasswordLength: 'Kata laluan mesti sekurang-kurangnya 6 aksara.',
    errEmailExists: 'Akaun dengan e-mel ini sudah wujud.',
    errEnterCredentials: 'Sila masukkan e-mel dan kata laluan anda.',
    errIncorrect: 'E-mel atau kata laluan tidak betul.',
    errLoginGeneric: 'Tidak dapat log masuk. Sila cuba lagi.',
    errSignupGeneric: 'Tidak dapat daftar. Sila cuba lagi.',

    // Tabs
    moviesTab: 'Filem',
    reviewsTab: 'Ulasan',
    meTab: 'Saya',

    // Movies list
    moviesHeading: 'Filem',
    searchPlaceholder: 'Cari filem mengikut tajuk…',
    nowShowing: 'Kini Ditayangkan',
    advanceSales: 'Jualan Awal',
    segmentInfo: 'Apa bezanya?',
    nowShowingDesc: 'Filem nilaian tertinggi dahulu.',
    advanceSalesDesc: 'Keluaran terbaharu dahulu.',
    detailsInside: 'Butiran di dalam',
    filters: 'Penapis',
    filterYear: 'Tahun',
    filterType: 'Jenis',
    filterAll: 'Semua',
    filterMovie: 'Filem',
    filterSeries: 'Siri',
    filterYearHint: 'cth. 2014',
    apply: 'Guna',
    clearFilters: 'Kosongkan',
    noMoviesTitle: 'Tiada filem dijumpai',
    noMoviesNothing: 'Tiada padanan untuk “{query}”.',
    noMoviesTry: 'Cuba cari mengikut tajuk.',

    // Movie detail
    loadingMovie: 'Memuatkan filem…',
    movieNotFound: 'Filem tidak dijumpai.',
    synopsis: 'Sinopsis',
    cast: 'Pelakon',
    reviewsTitle: 'Ulasan',
    noReviews: 'Belum ada ulasan. Jadilah yang pertama berkongsi pendapat.',
    rateThisMovie: 'Nilai filem ini',
    yourReview: 'Ulasan anda',
    shareThoughts: 'Kongsi pendapat anda (pilihan)…',
    postReview: 'Hantar ulasan',
    updateReview: 'Kemas kini ulasan',
    tapStarFirst: 'Ketik bintang untuk menilai filem ini dahulu.',

    // My Reviews
    myReviews: 'Ulasan Saya',
    noReviewsYet: 'Belum ada ulasan',
    rateAMovie: 'Nilai sebuah filem dan ia akan muncul di sini.',

    // Profile
    meHeading: 'Saya',
    reviewsStat: 'Ulasan',
    avgRating: 'Purata nilaian',
    logout: 'Log keluar',
    language: 'Bahasa',

    // Shared states
    somethingWrong: 'Sesuatu tidak kena',
    tryAgain: 'Cuba lagi',
    almostShowtime: 'Hampir waktu tayangan…',
    couldNotLoadMovies: 'Tidak dapat memuatkan filem. Sila cuba lagi.',
    couldNotLoadMovie: 'Tidak dapat memuatkan filem ini. Sila cuba lagi.',
  },
};
