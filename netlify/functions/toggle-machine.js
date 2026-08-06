// netlify/functions/toggle-machine.js
//
// This function is the ONLY thing allowed to write to the `machines`
// table (see supabase/schema.sql — RLS blocks direct client writes).
//
// There is no login/verification system — the browser just sends the
// name + phone the person typed in, and we stamp it onto the machine.
// This is an honor-system model: fine for a small trusted student
// community, but worth knowing (see README "Good to know").

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { machineId, name, phone } = JSON.parse(event.body || '{}');

    if (!machineId || !name || !phone) {
      return { statusCode: 400, body: JSON.stringify({ error: 'machineId, name and phone are required' }) };
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch current machine state
    const { data: machine, error: machineError } = await supabaseAdmin
      .from('machines')
      .select('*')
      .eq('id', machineId)
      .single();

    if (machineError || !machine) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Machine not found' }) };
    }

    // Basic anti-spam — block rapid re-toggling (double-tap, or someone
    // flipping the switch back and forth repeatedly)
    if (machine.last_used_at) {
      const secondsSinceLastToggle = (Date.now() - new Date(machine.last_used_at).getTime()) / 1000;
      if (secondsSinceLastToggle < 3) {
        return { statusCode: 429, body: JSON.stringify({ error: 'Please wait a moment before toggling again.' }) };
      }
    }

    const newStatus = machine.status === 'available' ? 'in_use' : 'available';

    // One machine per person at a time — only enforced when someone is
    // *claiming* a machine (available -> in_use). Freeing a machine
    // (in_use -> available) is always allowed.
    if (newStatus === 'in_use') {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('machines')
        .select('id, name')
        .eq('status', 'in_use')
        .eq('last_used_phone', phone)
        .neq('id', machineId);

      if (existingError) {
        return { statusCode: 500, body: JSON.stringify({ error: existingError.message }) };
      }

      if (existing && existing.length > 0) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            error: `You already have ${existing[0].name} marked as in use. Free it up before starting another machine.`,
          }),
        };
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('machines')
      .update({
        status: newStatus,
        last_used_by: name,
        last_used_phone: phone,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', machineId)
      .select()
      .single();

    if (updateError) {
      return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine: updated }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
