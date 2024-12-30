import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    const supabase = createClient();
    
    const userData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      full_name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      avatar_url: user.imageUrl,
      updated_at: new Date().toISOString()
    };

    // Skip if no email
    if (!userData.email) {
      return NextResponse.json({ 
        userId: user.id, 
        status: 'skipped', 
        reason: 'no email' 
      });
    }

    // Upsert user to Supabase
    const { error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id'
      });

    if (error) {
      return NextResponse.json({ 
        userId: user.id, 
        status: 'error', 
        error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      userId: user.id, 
      status: 'success' 
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
} 