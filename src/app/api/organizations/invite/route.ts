import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, email, role, organizationId, redirectTo } = await req.json();
    if (!email || !organizationId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // Verifica se quem chama é owner/admin na org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    if (!member || !['owner','admin'].includes(member.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name: name || null } });
    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

    const userId = invite.user?.id;
    if (!userId) return NextResponse.json({ error: 'Invite created without user id' }, { status: 500 });

    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({ organization_id: organizationId, user_id: userId, role: role || 'agent' });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


