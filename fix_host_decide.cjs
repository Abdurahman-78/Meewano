const fs = require('fs');
let file = fs.readFileSync('supabase/functions/decide-refund-request/index.ts', 'utf8');

file = file.replace(
  /if \(guestProfile\?\.email\) invoke\(\{\s*templateName: 'refund-approved-guest', recipientEmail: guestProfile.email,\s*idempotencyKey: `refund-approved-guest-\$\{refundRequestId\}`,\s*templateData: \{\s*firstName: \(guestProfile.full_name \|\| ''\)\.split\(' '\)\[0\] \|\| '',\s*bookingShortId: shortId\(rr.booking_id\),\s*refundAmount: fmtIQD\(refundAmount\),\s*\},\s*\}\)/g,
  `
      const guestMsg = "Your refund request " + fmtIQD(refundAmount) + " for booking number " + shortId(rr.booking_id) + " has been approved by the host. Please allow 14 days to receive your refund before contacting our team about your refund.";
      await admin.from('notifications').insert({
        user_id: rr.guest_id, title: 'Refund approved',
        message: guestMsg,
        type: 'booking', link: '/guest',
      });
      if (guestProfile?.email) invoke({
        templateName: 'refund-approved-guest', recipientEmail: guestProfile.email,
        idempotencyKey: \`refund-approved-guest-\${refundRequestId}\`,
        templateData: { firstName: (guestProfile.full_name || '').split(' ')[0] || '', bookingShortId: shortId(rr.booking_id), refundAmount: fmtIQD(refundAmount), message: guestMsg },
      })
`
);

file = file.replace(
  /if \(hostProfile\?\.email\) invoke\(\{\s*templateName: 'refund-approved-host', recipientEmail: hostProfile.email,\s*idempotencyKey: `refund-approved-host-\$\{refundRequestId\}`,\s*templateData: \{\s*hostFirstName: \(hostProfile.full_name \|\| ''\)\.split\(' '\)\[0\] \|\| '',\s*bookingShortId: shortId\(rr.booking_id\),\s*\},\s*\}\)/g,
  `
      const hostMsg = "Thank you for approving the refund request for booking number " + shortId(rr.booking_id) + ", the guest will now be refunded for the booking.";
      await admin.from('notifications').insert({
        user_id: rr.host_id, title: 'Refund approved',
        message: hostMsg,
        type: 'booking', link: '/host/refund-requests',
      });
      if (hostProfile?.email) invoke({
        templateName: 'refund-approved-host', recipientEmail: hostProfile.email,
        idempotencyKey: \`refund-approved-host-\${refundRequestId}\`,
        templateData: { hostFirstName: (hostProfile.full_name || '').split(' ')[0] || '', bookingShortId: shortId(rr.booking_id), message: hostMsg },
      })
`
);

file = file.replace(
  /await admin.from\('notifications'\).insert\(\{\s*user_id: rr.guest_id, title: 'Refund approved',\s*message: `Your refund of \$\{fmtIQD\(refundAmount\)\} for booking #\$\{shortId\(rr.booking_id\)\} has been approved.`,\s*type: 'booking', link: '\/guest',\s*\}\)/g,
  ``
);

file = file.replace(
  /await admin.from\('messages'\).insert\(\{\s*sender_id: rr.host_id,\s*receiver_id: rr.guest_id,\s*content: `Hi — regarding your refund request for booking #\$\{shortId\(rr.booking_id\)\}, I'd like to offer to reschedule instead of a refund.\\n\\n\$\{hostNote \|\| 'Please suggest dates that work for you.'\}`,\s*\}\).catch\(\(\) => \{\}\)/g,
  `
      const excFee = Math.floor(Number(rr.total_price) * 0.96);
      const rebookMsg = "Hi — regarding your refund request for booking #" + shortId(rr.booking_id) + ", I'd like to offer to reschedule instead of a refund.\\n\\nBooking amount (" + fmtIQD(excFee) + ") has been made into a discount code for you, with a 1 month expiry to use only at this property.\\n\\n" + (hostNote || 'Please select another available date.');
      await admin.from('messages').insert({
        sender_id: rr.host_id,
        receiver_id: rr.guest_id,
        content: rebookMsg,
      }).catch(() => {})
  `
);

fs.writeFileSync('supabase/functions/decide-refund-request/index.ts', file);
