const fs = require('fs');

let file = fs.readFileSync('supabase/functions/admin-decide-refund-rejection/index.ts', 'utf8');

// replace approve rejection notification
file = file.replace(
  /if \(guestProfile\?\.email\) invoke\(\{\s*templateName: 'refund-rejected-guest', recipientEmail: guestProfile.email,\s*idempotencyKey: `refund-rej-guest-\$\{refundRequestId\}`,\s*templateData: \{ firstName: \(guestProfile.full_name \|\| ''\)\.split\(' '\)\[0\] \|\| '', bookingShortId: shortId\(rr.booking_id\) \},\s*\}\)/g,
  `
      const msg = "Unfortunately, your refund request under exceptional circumstances for booking number " + shortId(rr.booking_id) + " has been declined by the host.";
      await admin.from('notifications').insert({
        user_id: rr.guest_id, title: 'Refund request declined',
        message: msg,
        type: 'booking', link: '/guest',
      });
      if (guestProfile?.email) invoke({
        templateName: 'refund-rejected-guest', recipientEmail: guestProfile.email,
        idempotencyKey: \`refund-rej-guest-\${refundRequestId}\`,
        templateData: { firstName: (guestProfile.full_name || '').split(' ')[0] || '', bookingShortId: shortId(rr.booking_id), message: msg },
      })
`
);

file = file.replace(
  /if \(guestProfile\?\.email\) invoke\(\{\s*templateName: 'admin-override-guest', recipientEmail: guestProfile.email,\s*idempotencyKey: `admin-override-guest-\$\{refundRequestId\}`,\s*templateData: \{\s*firstName: \(guestProfile.full_name \|\| ''\)\.split\(' '\)\[0\] \|\| '',\s*bookingShortId: shortId\(rr.booking_id\),\s*refundPct,\s*refundAmount: fmtIQD\(refundAmount\),\s*\},\s*\}\)/g,
  `
      const guestMsg = "Unfortunately, your refund request under exceptional circumstances for booking number " + shortId(rr.booking_id) + " has been declined by the host. However meewano team has reviewed the details and I decided to refund you " + refundPct + "% of the booking amount. Please allow 14 days to receive your refund before contacting our team about your refund.";
      await admin.from('notifications').insert({
        user_id: rr.guest_id, title: 'Meewano granted partial refund',
        message: guestMsg,
        type: 'booking', link: '/guest',
      });
      if (guestProfile?.email) invoke({
        templateName: 'admin-override-guest', recipientEmail: guestProfile.email,
        idempotencyKey: \`admin-override-guest-\${refundRequestId}\`,
        templateData: { firstName: (guestProfile.full_name || '').split(' ')[0] || '', bookingShortId: shortId(rr.booking_id), message: guestMsg },
      });
`
);

file = file.replace(
  /if \(hostProfile\?\.email\) invoke\(\{\s*templateName: 'admin-override-host', recipientEmail: hostProfile.email,\s*idempotencyKey: `admin-override-host-\$\{refundRequestId\}`,\s*templateData: \{\s*hostFirstName: \(hostProfile.full_name \|\| ''\)\.split\(' '\)\[0\] \|\| '',\s*bookingShortId: shortId\(rr.booking_id\),\s*refundPct,\s*refundAmount: fmtIQD\(refundAmount\),\s*\},\s*\}\)/g,
  `
      const hostMsg = "Meewano has reviewed your reason for rejection. Meewano has decided in this instance to refund the guest " + refundPct + "% of the booking amount.";
      await admin.from('notifications').insert({
        user_id: rr.host_id, title: 'Meewano overrode rejection',
        message: hostMsg,
        type: 'booking', link: '/host/refund-requests',
      });
      if (hostProfile?.email) invoke({
        templateName: 'admin-override-host', recipientEmail: hostProfile.email,
        idempotencyKey: \`admin-override-host-\${refundRequestId}\`,
        templateData: { hostFirstName: (hostProfile.full_name || '').split(' ')[0] || '', bookingShortId: shortId(rr.booking_id), message: hostMsg },
      });
`
);

fs.writeFileSync('supabase/functions/admin-decide-refund-rejection/index.ts', file);
