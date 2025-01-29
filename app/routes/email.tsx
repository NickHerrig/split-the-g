import type { ActionFunctionArgs } from "react-router";
import { supabase } from "~/utils/supabase";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { email, scoreId, emailOptedOut } = await request.json();

    if (!scoreId) {
      return Response.json({ error: "scoreId is required" }, { status: 400 });
    }

    // Handle both email submission and opt-out cases
    const updateData = emailOptedOut 
      ? { email_opted_out: true }
      : { email };

    const { error } = await supabase
      .from('scores')
      .update(updateData)
      .eq('id', scoreId);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ 
      error: "Failed to save email", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}