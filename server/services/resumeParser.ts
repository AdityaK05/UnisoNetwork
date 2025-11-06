import mammoth from 'mammoth';
import nlp from 'compromise';
import fs from 'fs';
// @ts-ignore - pdf-parse has module resolution issues
import * as pdfParseModule from 'pdf-parse';

// Handle CommonJS default export
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  education: string[];
  skills: string[];
  experience: string[];
  projects: string[];
  summary?: string;
}

/**
 * Extract text from PDF buffer or file path
 * Supports both memory buffer and disk-based storage
 */
async function extractTextFromPDF(filePathOrBuffer: string | Buffer): Promise<string> {
  try {
    if (!pdfParse) {
      throw new Error('PDF parser module not available. Please install pdf-parse.');
    }

    // Convert to buffer if file path is provided
    const dataBuffer = Buffer.isBuffer(filePathOrBuffer)
      ? filePathOrBuffer
      : fs.readFileSync(filePathOrBuffer);

    // Validate buffer
    if (!dataBuffer || dataBuffer.length === 0) {
      throw new Error('Empty PDF buffer or file');
    }

    console.log('📄 Attempting to parse PDF, buffer size:', dataBuffer.length, 'bytes');

    // Parse PDF
    const pdfData = await pdfParse(dataBuffer);
    
    // Validate extracted text
    if (!pdfData || !pdfData.text) {
      throw new Error('PDF parsing returned no data');
    }

    const extractedText = pdfData.text.trim();
    
    if (extractedText.length === 0) {
      throw new Error('Empty or non-text PDF file. This might be a scanned image-based PDF without a text layer.');
    }

    console.log('✅ PDF parsed successfully');
    console.log('📊 Text length:', extractedText.length, 'characters');
    console.log('📝 First 200 chars:', extractedText.substring(0, 200));
    console.log('📄 Total pages:', pdfData.numpages);

    return extractedText;
  } catch (error: any) {
    console.error('❌ Error extracting PDF text:', error);
    console.error('Error message:', error.message);
    
    // Provide user-friendly error messages
    if (error.message.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF.');
    } else if (error.message.includes('Empty')) {
      throw new Error('PDF appears to be empty or scanned image-based. Please use a text-based resume.');
    } else {
      throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
  }
}

/**
 * Extract text from DOCX buffer or file path
 */
async function extractTextFromDOCX(filePathOrBuffer: string | Buffer): Promise<string> {
  try {
    // Convert to buffer if file path is provided
    const dataBuffer = Buffer.isBuffer(filePathOrBuffer)
      ? filePathOrBuffer
      : fs.readFileSync(filePathOrBuffer);

    // Validate buffer
    if (!dataBuffer || dataBuffer.length === 0) {
      throw new Error('Empty DOCX buffer or file');
    }

    console.log('📄 Attempting to parse DOCX, buffer size:', dataBuffer.length, 'bytes');

    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    const extractedText = result.value.trim();

    if (extractedText.length === 0) {
      throw new Error('Empty DOCX file or no text content found');
    }

    console.log('✅ DOCX parsed successfully');
    console.log('📊 Text length:', extractedText.length, 'characters');
    console.log('📝 First 200 chars:', extractedText.substring(0, 200));

    return extractedText;
  } catch (error: any) {
    console.error('❌ Error extracting DOCX text:', error);
    console.error('Error message:', error.message);
    throw new Error(`Failed to parse DOCX file: ${error.message}`);
  }
}

/**
 * Extract email using regex
 */
function extractEmail(text: string): string | undefined {
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/gi;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : undefined;
}

/**
 * Extract phone number using regex
 */
function extractPhone(text: string): string | undefined {
  // Match Indian phone numbers: +91-XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
  const phoneRegex = /(?:\+91[-\s]?)?(?:\d{10}|\d{3}[-\s]?\d{3}[-\s]?\d{4})/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0].replace(/[-\s]/g, '') : undefined;
}

/**
 * Extract name from resume
 * Assumes name is at the top and is a person's name
 */
function extractName(text: string): string | undefined {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Try first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip if it's too long or contains email/phone
    if (line.length > 50 || line.includes('@') || /\d{10}/.test(line)) {
      continue;
    }
    
    // Check if it looks like a name (2-4 words, capitalized)
    const doc = nlp(line);
    const people = doc.people().out('array');
    
    if (people.length > 0) {
      return people[0];
    }
    
    // Fallback: if line has 2-4 capitalized words
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z]/.test(w))) {
      return line;
    }
  }
  
  return undefined;
}

/**
 * Extract section content based on heading
 */
function extractSection(text: string, headingRegex: RegExp): string[] {
  const lines = text.split('\n');
  const results: string[] = [];
  let inSection = false;
  let sectionContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is the target section heading
    if (headingRegex.test(line)) {
      inSection = true;
      sectionContent = [];
      continue;
    }
    
    // Check if we've hit a new section (all caps heading or known sections)
    const otherSectionRegex = /^(PERSONAL|CONTACT|DECLARATION|OBJECTIVE|SUMMARY|EDUCATION|EXPERIENCE|PROJECTS|SKILLS|ACHIEVEMENTS|CERTIFICATIONS|LANGUAGES|INTERESTS|REFERENCES)/i;
    if (inSection && otherSectionRegex.test(line) && !headingRegex.test(line)) {
      // We've entered a different section, stop collecting
      break;
    }
    
    // Collect content if we're in the target section
    if (inSection && line.length > 0) {
      sectionContent.push(line);
    }
  }
  
  // Clean and filter results
  return sectionContent
    .filter(item => item.length > 2 && !item.match(/^[:\-•*]+$/))
    .map(item => item.replace(/^[•\-*]\s*/, '').trim());
}

/**
 * Extract education details
 */
function extractEducation(text: string): string[] {
  const educationSection = extractSection(text, /^(EDUCATION|ACADEMIC|QUALIFICATION)/i);
  
  if (educationSection.length > 0) {
    return educationSection;
  }
  
  // Fallback: search for degree patterns
  const degreePatterns = [
    /B\.?Tech|Bachelor of Technology|B\.?E\.?|Bachelor of Engineering/gi,
    /M\.?Tech|Master of Technology|M\.?E\.?|Master of Engineering/gi,
    /B\.?Sc|Bachelor of Science|M\.?Sc|Master of Science/gi,
    /B\.?A\.?|Bachelor of Arts|M\.?A\.?|Master of Arts/gi,
    /B\.?Com|M\.?Com|BBA|MBA/gi,
    /PhD|Doctorate/gi,
  ];
  
  const results: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    for (const pattern of degreePatterns) {
      if (pattern.test(line)) {
        results.push(line.trim());
        break;
      }
    }
  }
  
  return results.slice(0, 5); // Limit to 5 entries
}

/**
 * Extract skills
 */
function extractSkills(text: string): string[] {
  const skillsSection = extractSection(text, /^(SKILLS|TECHNICAL|TECHNOLOGIES|EXPERTISE)/i);
  
  if (skillsSection.length > 0) {
    // Split by common delimiters
    const allSkills = skillsSection
      .flatMap(line => line.split(/[,|•\-]/))
      .map(skill => skill.trim())
      .filter(skill => skill.length > 1 && skill.length < 30);
    
    return Array.from(new Set(allSkills)); // Remove duplicates
  }
  
  // Fallback: search for common tech skills
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'Git', 'HTML', 'CSS', 'TypeScript', 'PHP',
    'Machine Learning', 'Deep Learning', 'Data Science', 'AI', 'NLP',
    'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    new RegExp(skill, 'i').test(text)
  );
  
  return foundSkills.slice(0, 20); // Limit to 20 skills
}

/**
 * Extract work experience
 */
function extractExperience(text: string): string[] {
  const experienceSection = extractSection(text, /^(EXPERIENCE|WORK|EMPLOYMENT|PROFESSIONAL)/i);
  
  if (experienceSection.length > 0) {
    // Group lines into experience entries (look for company/role patterns)
    const entries: string[] = [];
    let currentEntry = '';
    
    for (const line of experienceSection) {
      // Check if this looks like a new entry (contains dates or company indicators)
      if (line.match(/\d{4}|Present|Current|Intern|Developer|Engineer|Manager/i)) {
        if (currentEntry) {
          entries.push(currentEntry.trim());
        }
        currentEntry = line;
      } else {
        currentEntry += ' ' + line;
      }
    }
    
    if (currentEntry) {
      entries.push(currentEntry.trim());
    }
    
    return entries.slice(0, 10); // Limit to 10 experiences
  }
  
  return [];
}

/**
 * Extract projects
 */
function extractProjects(text: string): string[] {
  const projectsSection = extractSection(text, /^(PROJECTS|PERSONAL PROJECTS|ACADEMIC PROJECTS)/i);
  
  if (projectsSection.length > 0) {
    // Group lines into project entries
    const entries: string[] = [];
    let currentEntry = '';
    
    for (const line of projectsSection) {
      // Check if this looks like a project title (shorter line or has tech keywords)
      if (line.length < 60 || line.match(/using|built|developed|created/i)) {
        if (currentEntry) {
          entries.push(currentEntry.trim());
        }
        currentEntry = line;
      } else {
        currentEntry += ' ' + line;
      }
    }
    
    if (currentEntry) {
      entries.push(currentEntry.trim());
    }
    
    return entries.slice(0, 10); // Limit to 10 projects
  }
  
  return [];
}

/**
 * Extract summary/objective
 */
function extractSummary(text: string): string | undefined {
  const summarySection = extractSection(text, /^(SUMMARY|OBJECTIVE|PROFILE|ABOUT)/i);
  
  if (summarySection.length > 0) {
    return summarySection.join(' ').slice(0, 500); // Limit to 500 chars
  }
  
  return undefined;
}

/**
 * Main resume parsing function
 */
export async function parseResume(
  fileBuffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<ParsedResume> {
  try {
    console.log(`📄 Parsing ${fileType.toUpperCase()} resume...`);
    
    // Extract text
    let text: string;
    if (fileType === 'pdf') {
      text = await extractTextFromPDF(fileBuffer);
    } else {
      text = await extractTextFromDOCX(fileBuffer);
    }
    
    if (!text || text.trim().length < 100) {
      throw new Error('Resume appears to be empty or too short');
    }
    
    console.log(`✅ Extracted ${text.length} characters from resume`);
    
    // Parse all sections
    const parsed: ParsedResume = {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      education: extractEducation(text),
      skills: extractSkills(text),
      experience: extractExperience(text),
      projects: extractProjects(text),
      summary: extractSummary(text),
    };
    
    console.log('✅ Resume parsed successfully:', {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      educationCount: parsed.education.length,
      skillsCount: parsed.skills.length,
      experienceCount: parsed.experience.length,
      projectsCount: parsed.projects.length,
    });
    
    return parsed;
  } catch (error) {
    console.error('❌ Error parsing resume:', error);
    throw error;
  }
}
