import { supabase } from "../lib/supabase";

// ============================================
// GET INTERVIEWS
// ============================================

// Get all interviews for a specific job
export const getJobInterviews = async (jobId) => {
  try {
    console.log('🔍 getJobInterviews called with jobId:', jobId);
    
    // Get all interviews for this job
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('*')
      .eq('job_id', jobId);

    if (interviewsError) {
      console.error('❌ Interviews error:', interviewsError);
      throw interviewsError;
    }

    console.log('📊 Interviews found:', interviews?.length || 0);

    if (!interviews || interviews.length === 0) {
      return { data: [], error: null };
    }

    // Get all unique applicant IDs
    const applicantIds = [...new Set(interviews.map(i => i.applicant_id))];
    const applicationIds = [...new Set(interviews.map(i => i.application_id))];

    console.log('👤 Applicant IDs:', applicantIds);
    console.log('📄 Application IDs:', applicationIds);

    // Fetch applicant data
    const { data: applicants, error: applicantsError } = await supabase
      .from('applicants')
      .select('id, full_name, email, phone')
      .in('id', applicantIds);

    if (applicantsError) {
      console.error('❌ Applicants error:', applicantsError);
    } else {
      console.log('👤 Applicants found:', applicants?.length || 0);
    }

    // Fetch application data
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('id, ai_match_score, status')
      .in('id', applicationIds);

    if (applicationsError) {
      console.error('❌ Applications error:', applicationsError);
    } else {
      console.log('📄 Applications found:', applications?.length || 0);
    }

    // Create lookup maps
    const applicantsMap = {};
    (applicants || []).forEach(app => {
      applicantsMap[app.id] = app;
    });

    const applicationsMap = {};
    (applications || []).forEach(app => {
      applicationsMap[app.id] = app;
    });

    // Combine the data
    const combinedData = (interviews || []).map(interview => {
      const applicant = applicantsMap[interview.applicant_id];
      const application = applicationsMap[interview.application_id];
      
      return {
        ...interview,
        applicants: applicant || null,
        applications: application || null,
        // Add direct fields as fallback
        applicant_name: applicant?.full_name || 'Unknown',
        applicant_email: applicant?.email || 'No email',
        applicant_phone: applicant?.phone || 'N/A',
        ai_match_score: application?.ai_match_score || 0,
      };
    });

    console.log('✅ Combined data:', combinedData);
    console.log('✅ Combined count:', combinedData.length);

    return { data: combinedData, error: null };
  } catch (error) {
    console.error('❌ Error in getJobInterviews:', error);
    return { data: [], error };
  }
};

// Get a single interview by ID
export const getInterviewById = async (interviewId) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (error) throw error;
    
    // Fetch applicant data
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('id, full_name, email, phone')
      .eq('id', data.applicant_id)
      .single();

    if (applicantError) {
      console.error('Error fetching applicant:', applicantError);
    }

    // Fetch application data
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('id, ai_match_score, status')
      .eq('id', data.application_id)
      .single();

    if (applicationError) {
      console.error('Error fetching application:', applicationError);
    }

    const result = {
      ...data,
      applicants: applicant || null,
      applications: application || null,
      applicant_name: applicant?.full_name || 'Unknown',
      applicant_email: applicant?.email || 'No email',
      applicant_phone: applicant?.phone || 'N/A',
      ai_match_score: application?.ai_match_score || 0,
    };

    return { data: result, error: null };
  } catch (error) {
    console.error('Error getting interview:', error);
    return { data: null, error };
  }
};

// Get interview by application ID
export const getInterviewByApplication = async (applicationId) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { data: null, error: null };
    }

    // Fetch applicant data
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('id, full_name, email, phone')
      .eq('id', data.applicant_id)
      .single();

    if (applicantError) {
      console.error('Error fetching applicant:', applicantError);
    }

    const result = {
      ...data,
      applicants: applicant || null,
      applicant_name: applicant?.full_name || 'Unknown',
      applicant_email: applicant?.email || 'No email',
      applicant_phone: applicant?.phone || 'N/A',
    };

    return { data: result, error: null };
  } catch (error) {
    console.error('Error getting interview by application:', error);
    return { data: null, error };
  }
};

// ============================================
// CREATE / SCHEDULE INTERVIEWS (UPDATED)
// ============================================

// Create a single interview (with check for existing)
export const createInterview = async (interviewData) => {
  try {
    // Check if an interview already exists for this application
    const { data: existingInterview, error: checkError } = await supabase
      .from('interviews')
      .select('id')
      .eq('application_id', interviewData.application_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing interview:', checkError);
      throw checkError;
    }

    let data;

    if (existingInterview) {
      // UPDATE existing interview
      const { data: updatedData, error: updateError } = await supabase
        .from('interviews')
        .update({
          scheduled_date: interviewData.scheduled_date,
          duration_minutes: interviewData.duration_minutes || 20,
          location: interviewData.location || null,
          description: interviewData.description || null,
          status: 'SCHEDULED',
          needs_scheduling: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInterview.id)
        .select()
        .single();

      if (updateError) throw updateError;
      data = updatedData;
      console.log('✅ Updated existing interview:', data.id);
    } else {
      // CREATE new interview
      const { data: insertedData, error: insertError } = await supabase
        .from('interviews')
        .insert({
          application_id: interviewData.application_id,
          applicant_id: interviewData.applicant_id,
          job_id: interviewData.job_id,
          scheduled_date: interviewData.scheduled_date,
          duration_minutes: interviewData.duration_minutes || 20,
          location: interviewData.location || null,
          description: interviewData.description || null,
          status: 'SCHEDULED',
          needs_scheduling: false,
          scheduled_by: interviewData.scheduled_by || null,
          scheduled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      data = insertedData;
      console.log('✅ Created new interview:', data.id);
    }
    
    // Update the application with the interview_id
    await supabase
      .from('applications')
      .update({ 
        interview_id: data.id,
        status: 'INTERVIEW_SCHEDULED',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewData.application_id);

    return { data, error: null };
  } catch (error) {
    console.error('Error creating/updating interview:', error);
    return { data: null, error };
  }
};

// Batch schedule multiple interviews (UPDATED - checks for existing)
export const batchScheduleInterviews = async (interviewsData) => {
  try {
    const results = [];
    
    for (const interviewData of interviewsData) {
      // Check if an interview already exists for this application
      const { data: existingInterview, error: checkError } = await supabase
        .from('interviews')
        .select('id')
        .eq('application_id', interviewData.application_id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing interview:', checkError);
        continue;
      }

      let result;

      if (existingInterview) {
        // UPDATE existing interview
        const { data, error } = await supabase
          .from('interviews')
          .update({
            scheduled_date: interviewData.scheduled_date,
            duration_minutes: interviewData.duration_minutes || 20,
            location: interviewData.location || null,
            description: interviewData.description || null,
            status: 'SCHEDULED',
            needs_scheduling: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingInterview.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating interview:', error);
          continue;
        }
        result = data;
        console.log('✅ Updated existing interview:', result.id);
      } else {
        // CREATE new interview
        const { data, error } = await supabase
          .from('interviews')
          .insert({
            application_id: interviewData.application_id,
            applicant_id: interviewData.applicant_id,
            job_id: interviewData.job_id,
            scheduled_date: interviewData.scheduled_date,
            duration_minutes: interviewData.duration_minutes || 20,
            location: interviewData.location || null,
            description: interviewData.description || null,
            status: 'SCHEDULED',
            needs_scheduling: false,
            scheduled_by: interviewData.scheduled_by || null,
            scheduled_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating interview:', error);
          continue;
        }
        result = data;
        console.log('✅ Created new interview:', result.id);
      }

      results.push(result);

      // Update the application with the interview_id
      await supabase
        .from('applications')
        .update({ 
          interview_id: result.id,
          status: 'INTERVIEW_SCHEDULED',
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewData.application_id);
    }

    return { data: results, error: null };
  } catch (error) {
    console.error('Error batch scheduling interviews:', error);
    return { data: null, error };
  }
};

// ============================================
// UPDATE INTERVIEW STATUS
// ============================================

// Update interview status
export const updateInterviewStatus = async (interviewId, status, options = {}) => {
  try {
    const updates = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    if (options.feedback) {
      updates.feedback = options.feedback;
    }

    if (options.feedback_rating) {
      updates.feedback_rating = options.feedback_rating;
    }

    if (options.reschedule_reason) {
      updates.reschedule_reason = options.reschedule_reason;
    }

    if (options.rescheduled_from) {
      updates.rescheduled_from = options.rescheduled_from;
    }

    const { data, error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating interview status:', error);
    return { data: null, error };
  }
};

// Mark interview as completed
export const markInterviewCompleted = async (interviewId) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update({ 
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking interview completed:', error);
    return { data: null, error };
  }
};

// Mark interview as no-show
export const markNoShow = async (interviewId) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update({ 
        status: 'NO_SHOW',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;

    // Update application status to REJECTED
    await supabase
      .from('applications')
      .update({ 
        status: 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('interview_id', interviewId);

    return { data, error: null };
  } catch (error) {
    console.error('Error marking no-show:', error);
    return { data: null, error };
  }
};

// Cancel an interview
export const cancelInterview = async (interviewId, reason = null) => {
  try {
    const updates = {
      status: 'CANCELLED',
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updates.description = `Cancelled: ${reason}`;
    }

    const { data, error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;

    // Update application status back to QUALIFIED
    await supabase
      .from('applications')
      .update({ 
        status: 'QUALIFIED',
        updated_at: new Date().toISOString()
      })
      .eq('interview_id', interviewId);

    return { data, error: null };
  } catch (error) {
    console.error('Error cancelling interview:', error);
    return { data: null, error };
  }
};

// ============================================
// RESCHEDULE INTERVIEW
// ============================================

// Reschedule an interview
export const rescheduleInterview = async (oldInterviewId, newDate, newTime, duration, reason) => {
  try {
    // First, get the old interview data
    const { data: oldInterview, error: getError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', oldInterviewId)
      .single();

    if (getError) throw getError;

    // Mark old interview as RESCHEDULED
    await supabase
      .from('interviews')
      .update({
        status: 'RESCHEDULED',
        reschedule_reason: reason || 'Rescheduled by HR',
        updated_at: new Date().toISOString()
      })
      .eq('id', oldInterviewId);

    // Create new interview with updated date/time
    const newDateTime = new Date(`${newDate}T${newTime}`);

    const { data: newInterview, error: createError } = await supabase
      .from('interviews')
      .insert({
        application_id: oldInterview.application_id,
        applicant_id: oldInterview.applicant_id,
        job_id: oldInterview.job_id,
        scheduled_date: newDateTime.toISOString(),
        duration_minutes: duration || oldInterview.duration_minutes || 20,
        location: oldInterview.location,
        description: oldInterview.description || 'Rescheduled interview',
        status: 'SCHEDULED',
        needs_scheduling: false,
        scheduled_by: oldInterview.scheduled_by,
        scheduled_at: new Date().toISOString(),
        rescheduled_from: oldInterviewId,
        reschedule_reason: reason || 'Rescheduled by HR'
      })
      .select()
      .single();

    if (createError) throw createError;

    // Update application with new interview_id
    await supabase
      .from('applications')
      .update({
        interview_id: newInterview.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', oldInterview.application_id);

    return { data: newInterview, error: null };
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    return { data: null, error };
  }
};

// ============================================
// DELETE / REMOVE
// ============================================

// Delete an interview (only if it's CANCELLED or not SCHEDULED)
export const deleteInterview = async (interviewId) => {
  try {
    // First check if interview is SCHEDULED
    const { data: interview, error: checkError } = await supabase
      .from('interviews')
      .select('status')
      .eq('id', interviewId)
      .single();

    if (checkError) throw checkError;

    if (interview.status === 'SCHEDULED') {
      return { 
        data: null, 
        error: new Error('Cannot delete a scheduled interview. Cancel it first.') 
      };
    }

    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', interviewId);

    if (error) throw error;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting interview:', error);
    return { data: null, error };
  }
};

// ============================================
// STATISTICS
// ============================================

// Get interview statistics for a job
export const getInterviewStats = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('status')
      .eq('job_id', jobId);

    if (error) throw error;

    const stats = {
      total: data.length,
      scheduled: data.filter(i => i.status === 'SCHEDULED').length,
      completed: data.filter(i => i.status === 'COMPLETED').length,
      cancelled: data.filter(i => i.status === 'CANCELLED').length,
      noshow: data.filter(i => i.status === 'NO_SHOW').length,
      rescheduled: data.filter(i => i.status === 'RESCHEDULED').length,
      needsScheduling: data.filter(i => i.needs_scheduling === true).length,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting interview stats:', error);
    return { data: null, error };
  }
};

// ============================================
// NOTIFICATIONS
// ============================================

// Send notification to applicant about their interview
export const notifyApplicantOfInterview = async (applicantId, interviewData, jobTitle) => {
  try {
    const formattedDate = new Date(interviewData.scheduled_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = new Date(interviewData.scheduled_date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `Your interview for ${jobTitle} has been scheduled for ${formattedDate} at ${formattedTime}.`;
    
    if (interviewData.location) {
      message += `\n\n📍 Location: ${interviewData.location}`;
    }
    if (interviewData.description) {
      message += `\n\n📝 Notes: ${interviewData.description}`;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: applicantId,
        type: 'interview_scheduled',
        title: '📅 Interview Scheduled',
        message: message,
        is_read: false,
        link: `/applicant/applications`
      });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
};

// Send notification for interview status change
export const notifyInterviewStatusChange = async (applicantId, status, jobTitle) => {
  try {
    const messages = {
      'COMPLETED': 'Your interview has been marked as completed. The HR team will review your performance.',
      'NO_SHOW': 'You did not show up for your scheduled interview. Please contact HR if you have any questions.',
      'CANCELLED': 'Your interview has been cancelled. Please check your email for further instructions.',
      'RESCHEDULED': 'Your interview has been rescheduled. Please check your new schedule.'
    };

    const titles = {
      'COMPLETED': '✅ Interview Completed',
      'NO_SHOW': '❌ Interview No-Show',
      'CANCELLED': '❌ Interview Cancelled',
      'RESCHEDULED': '🔄 Interview Rescheduled'
    };

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: applicantId,
        type: 'interview_status_update',
        title: titles[status] || 'Interview Status Update',
        message: messages[status] || `Your interview status has been updated to ${status}.`,
        is_read: false,
        link: `/applicant/applications`
      });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
};