import pool from '../db';

interface ExtractedProfileData {
  name?: string;
  email?: string;
  phone?: string;
  education?: string[];
  skills?: string[];
  experience?: string[];
  college_name?: string;
  course?: string;
}

/**
 * Extract education info from parsed resume
 */
function extractEducationInfo(educationArray: string[]): { college: string | undefined; course: string | undefined } {
  if (!educationArray || educationArray.length === 0) {
    return { college: undefined, course: undefined };
  }

  // Try to extract college name and course from education entries
  let college: string | undefined;
  let course: string | undefined;

  const commonCourses = ['B.E', 'B.Tech', 'BSc', 'BA', 'BCA', 'MBA', 'M.Tech', 'MS', 'BTech', 'BE'];
  const commonColleges = ['IIT', 'NIT', 'BITS', 'VIT', 'MANIPAL', 'BANGALORE', 'DELHI', 'BOMBAY', 'MADRAS'];

  for (const edu of educationArray) {
    const upperEdu = edu.toUpperCase();
    
    // Check for course
    if (!course) {
      for (const c of commonCourses) {
        if (upperEdu.includes(c)) {
          course = c;
          break;
        }
      }
    }

    // Check for college
    if (!college) {
      for (const c of commonColleges) {
        if (upperEdu.includes(c)) {
          college = edu;
          break;
        }
      }
    }

    if (college && course) break;
  }

  return { college, course };
}

/**
 * Update user profile with parsed resume data
 */
export async function updateProfileFromResume(
  userId: number,
  resumeData: {
    name?: string;
    email?: string;
    phone?: string;
    education?: string[];
    skills?: string[];
    experience?: string[];
  }
): Promise<void> {
  try {
    const { college_name, course } = extractEducationInfo(resumeData.education || []);

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (resumeData.name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(resumeData.name);
    }

    if (resumeData.phone) {
      updateFields.push(`phone_number = $${paramIndex++}`);
      values.push(resumeData.phone);
    }

    if (college_name) {
      updateFields.push(`college_name = $${paramIndex++}`);
      values.push(college_name);
    }

    if (course) {
      updateFields.push(`course = $${paramIndex++}`);
      values.push(course);
    }

    // Store skills and experience as JSONB
    if (resumeData.skills && resumeData.skills.length > 0) {
      updateFields.push(`id_verification_data = jsonb_set(COALESCE(id_verification_data, '{}'::jsonb), '{skills}', $${paramIndex++})`);
      values.push(JSON.stringify(resumeData.skills));
    }

    if (resumeData.experience && resumeData.experience.length > 0) {
      updateFields.push(`id_verification_data = jsonb_set(COALESCE(id_verification_data, '{}'::jsonb), '{experience}', $${paramIndex++})`);
      values.push(JSON.stringify(resumeData.experience));
    }

    if (updateFields.length === 0) {
      console.log('No profile fields to update from resume');
      return;
    }

    values.push(userId);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;

    await pool.query(query, values);
    console.log('✅ User profile updated with resume data');
  } catch (error: any) {
    console.error('❌ Error updating profile from resume:', error.message);
    throw error;
  }
}

/**
 * Extract and return profile data from resume
 */
export function extractProfileData(resumeData: {
  name?: string;
  email?: string;
  phone?: string;
  education?: string[];
  skills?: string[];
  experience?: string[];
}): ExtractedProfileData {
  const { college_name, course } = extractEducationInfo(resumeData.education || []);

  return {
    name: resumeData.name,
    email: resumeData.email,
    phone: resumeData.phone,
    education: resumeData.education,
    skills: resumeData.skills,
    experience: resumeData.experience,
    college_name,
    course,
  };
}
