import type { ActionFunctionArgs } from "react-router";
import { supabase } from "~/utils/supabase";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { email, scoreId, sessionId, emailOptedOut } = await request.json();

    if (!scoreId) {
      return Response.json({ error: "scoreId is required" }, { status: 400 });
    }

    if (!sessionId) {
      return Response.json({ error: "sessionId is required" }, { status: 400 });
    }

    // First, check if the score already has an email or has opted out
    const { data: existingScore, error: scoreError } = await supabase
      .from('scores')
      .select('email, email_opted_out, session_id')
      .eq('id', scoreId)
      .single();

    if (scoreError || !existingScore) {
      return Response.json({ error: "Score not found" }, { status: 404 });
    }

    // If score already has email or opted out, prevent updates
    if (existingScore.email || existingScore.email_opted_out) {
      return Response.json({ error: "Email preference already set" }, { status: 403 });
    }

    // Verify the session matches
    if (existingScore.session_id !== sessionId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate email if provided
    if (!emailOptedOut && (!email || !email.includes('@'))) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Update the score with email or opt-out status
    const { error: updateError } = await supabase
      .from('scores')
      .update({
        email: emailOptedOut ? null : email,
        email_opted_out: emailOptedOut || false
      })
      .eq('id', scoreId)
      .eq('session_id', sessionId); // Double-check session ID in update

    if (updateError) {
      console.error('Update error:', updateError);
      return Response.json({ error: "Failed to update score" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return Response.json({ 
      error: "Failed to save email", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}