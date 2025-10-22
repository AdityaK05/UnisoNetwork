/**
 * College Email Domain Verification for Indian Institutions
 * Validates that email belongs to a recognized Indian college/university
 */

// Comprehensive list of Indian college domain keywords
const COLLEGE_KEYWORDS = [
  // IITs (Indian Institutes of Technology)
  'iit', 'iitb', 'iitd', 'iitm', 'iitk', 'iitkgp', 'iitbhu', 'iitr', 'iitg', 'iith',
  'iitbbs', 'iitj', 'iitp', 'iiti', 'iitgn', 'iitdh', 'iitgoa', 'iitjammu', 'iitpal',
  
  // NITs (National Institutes of Technology)
  'nit', 'nitk', 'nitc', 'nitw', 'nitt', 'nitr', 'nitdgp', 'nitj', 'nits', 'nitkkr',
  'nitap', 'nitgoa', 'nitmz', 'nitm', 'nitdel', 'nituk', 'nitp', 'nita', 'nitjsr',
  'nitpy', 'nitandhra', 'nitham', 'nitmanipur', 'nitmeghalaya', 'nitnagaland', 
  'nitsikkim', 'nitmn', 'bitmesra',
  
  // IIITs (Indian Institutes of Information Technology)
  'iiit', 'iiitd', 'iiita', 'iiitb', 'iiitdm', 'iiitv', 'iiitl', 'iiitk', 'iiitg',
  'iiits', 'iiitn', 'iiitu', 'iiitm', 'iiitbh', 'iiitdwd', 'iiitsr', 'iiitmk',
  
  // VIT (Vellore Institute of Technology)
  'vit', 'vellore', 'vitstudent', 'vitap', 'vitbhopal', 'vitchennai',
  
  // BITS (Birla Institute of Technology and Science)
  'bits', 'bitspilani', 'bits-pilani', 'bitsgoa', 'bitshyd', 'bitshyderabad',
  
  // SRM (SRM Institute of Science and Technology)
  'srm', 'srmist', 'srmuniv', 'srmcat', 'srmeaswari', 'srmktr', 'srmap',
  
  // Amity University
  'amity', 'amityonline', 'amityuniversity',
  
  // Manipal
  'manipal', 'manipaluniversity', 'mahe', 'mit', 'mitmanipai',
  
  // LPU (Lovely Professional University)
  'lpu', 'lpunest',
  
  // Christ University
  'christ', 'christuniversity',
  
  // IIITDM (Indian Institutes of Information Technology, Design and Manufacturing)
  'iiitdm', 'iiitdmj', 'iiitdmk',
  
  // Anna University
  'annauniv', 'anna', 'au-kbc',
  
  // Delhi University
  'du', 'dtu', 'delhi',
  
  // Jadavpur University
  'jadavpur', 'jadavpuruniversity',
  
  // Jamia Millia Islamia
  'jamia', 'jmi',
  
  // BHU (Banaras Hindu University)
  'bhu', 'banaras',
  
  // PES (PES University)
  'pes', 'pesu',
  
  // Thapar Institute
  'thapar', 'thapar.edu',
  
  // KIIT (Kalinga Institute of Industrial Technology)
  'kiit', 'kiiit',
  
  // Symbiosis
  'symbiosis', 'siu', 'sit',
  
  // VTU (Visvesvaraya Technological University)
  'vtu',
  
  // JNTU (Jawaharlal Nehru Technological University)
  'jntu', 'jntuh', 'jntuk', 'jntua',
  
  // Aligarh Muslim University
  'amu', 'amuonline',
  
  // Savitribai Phule Pune University
  'unipune', 'pune',
  
  // University of Hyderabad
  'uohyd', 'hyderabad',
  
  // IISc (Indian Institute of Science)
  'iisc',
  
  // IISC Bangalore
  'iisc', 'bangalore',
  
  // Osmania University
  'osmania',
  
  // University of Mumbai
  'mu', 'mumbai',
  
  // Bangalore University
  'bangaloreuniversity',
  
  // Andhra University
  'andhrauniversity',
  
  // University of Madras
  'unom',
  
  // University of Calcutta
  'caluniv',
  
  // MS Ramaiah
  'msrit', 'msruas', 'ramaiah',
  
  // RV College
  'rvce', 'rvce.edu',
  
  // BMS College
  'bmsce', 'bmsit',
  
  // PSG College
  'psgtech',
  
  // Sastra University
  'sastra',
  
  // SSN College
  'ssn',
  
  // Dayananda Sagar
  'dsce', 'dsatm',
  
  // Jain University
  'jainuniversity',
  
  // MIT (Manipal Institute of Technology)
  'manipal',
  
  // NIT (National Institute of Technology - additional)
  'manit', 'svnit', 'vnit',
  
  // College
  'college', 'institute', 'university', 'univ', 'tech', 'polytechnic'
];

// Valid college domain patterns for Indian institutions
const COLLEGE_DOMAIN_PATTERNS = [
  /\.ac\.in$/i,      // .ac.in (Academic India)
  /\.edu\.in$/i,     // .edu.in (Education India)
  /\.org\.in$/i,     // .org.in (Some educational institutions)
  /\.edu$/i,         // .edu (Some Indian colleges use this)
];

/**
 * Validates if an email belongs to a recognized Indian college/university
 * @param email - Email address to validate
 * @returns true if valid college email, false otherwise
 */
export function isValidCollegeEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extract domain from email
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) {
    return false;
  }

  // Check if domain matches any college domain pattern
  const matchesDomainPattern = COLLEGE_DOMAIN_PATTERNS.some(pattern => 
    pattern.test(domain)
  );

  if (!matchesDomainPattern) {
    return false;
  }

  // Check if domain contains any whitelisted college keyword
  const containsCollegeKeyword = COLLEGE_KEYWORDS.some(keyword => 
    domain.includes(keyword)
  );

  // Return true only if both conditions are met
  return matchesDomainPattern && containsCollegeKeyword;
}

/**
 * Get the college name from email domain (best effort extraction)
 * @param email - Email address
 * @returns Extracted college name or domain
 */
export function extractCollegeName(email: string): string {
  if (!email) return '';
  
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return '';

  // Remove common TLDs
  const cleanDomain = domain
    .replace(/\.ac\.in$/, '')
    .replace(/\.edu\.in$/, '')
    .replace(/\.org\.in$/, '')
    .replace(/\.edu$/, '')
    .replace(/\.in$/, '');

  // Capitalize first letter of each word
  return cleanDomain
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get validation error message for invalid college email
 * @param email - Email address that failed validation
 * @returns User-friendly error message
 */
export function getCollegeEmailError(email: string): string {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }

  const domain = email.toLowerCase().split('@')[1];
  
  // Check if personal email domain
  const personalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com', 'mail.com'];
  if (personalDomains.some(d => domain.includes(d))) {
    return 'Personal email addresses are not allowed. Please use your college/university email (e.g., @vit.ac.in, @iitb.ac.in)';
  }

  const matchesDomainPattern = COLLEGE_DOMAIN_PATTERNS.some(pattern => pattern.test(domain));
  if (!matchesDomainPattern) {
    return 'Please use a valid Indian college/university email address ending with .ac.in, .edu.in, or .org.in';
  }

  return 'Email domain not recognized as a valid Indian college/university. Please contact support if this is an error.';
}
