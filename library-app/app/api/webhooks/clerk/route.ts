import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook signature
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
  try {
    wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400
    });
  }
  
  // Create a new Supabase client
  const supabase = createClient();

  const { type, data: eventData } = payload as WebhookEvent;

  // Handle user creation
  if (type === 'user.created' || type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = eventData;
    
    if (!email_addresses?.[0]?.email_address) {
      return new Response('No email address found', { status: 400 });
    }

    const userData = {
      id: id,
      email: email_addresses[0].email_address,
      full_name: [first_name, last_name].filter(Boolean).join(' '),
      avatar_url: image_url,
      updated_at: new Date().toISOString()
    };

    // Upsert the user into Supabase
    const { error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error syncing user to Supabase:', error);
      return new Response('Error syncing user to Supabase', { status: 500 });
    }
  }

  // Handle user deletion
  if (type === 'user.deleted') {
    const { id } = eventData;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .match({ id });

    if (error) {
      console.error('Error deleting user from Supabase:', error);
      return new Response('Error deleting user from Supabase', { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
} 