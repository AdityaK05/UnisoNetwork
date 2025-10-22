/**
 * College Email Domain Verification for Indian Institutions (Client-side)
 * Validates that email belongs to a recognized Indian college/university
 */

// Valid college domain patterns for Indian institutions
const COLLEGE_DOMAIN_PATTERNS = [
  /\.ac\.in$/i,      // .ac.in (Academic India)
  /\.edu\.in$/i,     // .edu.in (Education India)
  /\.org\.in$/i,     // .org.in (Some educational institutions)
  /\.edu$/i,         // .edu (Some Indian colleges use this)
];

// Common Indian college domain keywords
const COLLEGE_KEYWORDS = [
  'iit', 'nit', 'iiit', 'vit', 'bits', 'srm', 'amity', 'manipal', 'lpu', 
  'christ', 'mit', 'pes', 'vellore', 'bitmesra', 'iisc', 'anna', 'du', 
  'dtu', 'jadavpur', 'jamia', 'bhu', 'thapar', 'kiit', 'symbiosis', 'vtu', 
  'jntu', 'amu', 'pune', 'hyderabad', 'bangalore', 'mumbai', 'delhi',
  'college', 'institute', 'university', 'univ', 'tech', 'polytechnic'
];

/**
 * Validates if an email belongs to a recognized Indian college/university
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

  const domain = email.toLowerCase().split('@')[1];
  if (!domain) {
    return false;
  }

  // Check domain pattern
  const matchesDomainPattern = COLLEGE_DOMAIN_PATTERNS.some(pattern => 
    pattern.test(domain)
  );

  if (!matchesDomainPattern) {
    return false;
  }

  // Check for college keyword
  const containsCollegeKeyword = COLLEGE_KEYWORDS.some(keyword => 
    domain.includes(keyword)
  );

  return matchesDomainPattern && containsCollegeKeyword;
}

/**
 * Get validation error message
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
  
  const personalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  if (personalDomains.some(d => domain.includes(d))) {
    return 'Please use your college/university email (not Gmail, Yahoo, etc.)';
  }

  const matchesDomainPattern = COLLEGE_DOMAIN_PATTERNS.some(pattern => pattern.test(domain));
  if (!matchesDomainPattern) {
    return 'Please use a valid college email ending with .ac.in, .edu.in, or .org.in';
  }

  return 'Email domain not recognized as a valid Indian college/university';
}
