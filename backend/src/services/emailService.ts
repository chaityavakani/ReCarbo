import nodemailer from 'nodemailer';

// ─── Transporter ────────────────────────────────────────────────────────────

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass || user === 'your_gmail@gmail.com') return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email] Skipped (not configured): ${subject} → ${to}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"ReCarbo Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent: ${subject} → ${to}`);
  } catch (err: any) {
    console.error(`[Email] Failed: ${err.message}`);
  }
}

// ─── Base Layout ─────────────────────────────────────────────────────────────

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ReCarbo</title>
</head>
<body style="margin:0;padding:0;background:#0a0f0e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f0e;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#064e3b 0%,#022c22 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:2px solid #10b981;">
            <div style="display:inline-block;background:#10b98122;border:1.5px solid #10b981;border-radius:12px;padding:10px 18px;margin-bottom:12px;">
              <span style="color:#34d399;font-size:22px;font-weight:900;letter-spacing:1px;">🌿 ReCarbo</span>
            </div>
            <p style="color:#6ee7b7;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0;">Circular Carbon Marketplace · Gujarat, India</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#0f1715;border-left:1px solid #064e3b;border-right:1px solid #064e3b;padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#090d0c;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #064e3b;border-top:none;">
            <p style="color:#4b5563;font-size:11px;margin:0 0 6px;">This email was sent by the ReCarbo platform. Do not reply to this email.</p>
            <p style="color:#374151;font-size:10px;margin:0;">© ${new Date().getFullYear()} ReCarbo · Built by The Outliers · Gujarat, India</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Reusable Blocks ──────────────────────────────────────────────────────────

function heading(text: string) {
  return `<h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 8px;">${text}</h1>`;
}

function subheading(text: string) {
  return `<p style="color:#6ee7b7;font-size:13px;font-weight:600;margin:0 0 24px;letter-spacing:0.5px;">${text}</p>`;
}

function paragraph(text: string) {
  return `<p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 16px;">${text}</p>`;
}

function infoRow(label: string, value: string, valueColor = '#ffffff') {
  return `
  <tr>
    <td style="padding:10px 14px;border-bottom:1px solid #1a2e28;">
      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
    </td>
    <td style="padding:10px 14px;border-bottom:1px solid #1a2e28;text-align:right;">
      <span style="color:${valueColor};font-size:13px;font-weight:700;">${value}</span>
    </td>
  </tr>`;
}

function infoTable(rows: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#090d0c;border:1px solid #064e3b;border-radius:12px;margin:20px 0;overflow:hidden;">
    ${rows}
  </table>`;
}

function ctaButton(text: string, url = 'http://localhost:5173') {
  return `
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#022c22;font-size:14px;font-weight:800;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
      ${text} →
    </a>
  </div>`;
}

function statusBadge(status: string, color: string, bg: string) {
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:800;padding:4px 12px;border-radius:50px;letter-spacing:1px;text-transform:uppercase;">${status}</span>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #1a2e28;margin:24px 0;" />`;
}

function roleTag(role: string) {
  const map: Record<string, { color: string; bg: string; icon: string }> = {
    SUPPLIER: { color: '#34d399', bg: '#064e3b44', icon: '🏭' },
    BUYER:    { color: '#60a5fa', bg: '#1e3a5f44', icon: '🛒' },
    ADMIN:    { color: '#f59e0b', bg: '#78350f44', icon: '🛡️' },
  };
  const r = map[role] || map.BUYER;
  return `<span style="display:inline-block;background:${r.bg};color:${r.color};font-size:12px;font-weight:700;padding:4px 14px;border-radius:50px;border:1px solid ${r.color}44;">${r.icon} ${role}</span>`;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export const EmailService = {

  // 1. Welcome / Register
  async sendWelcome(to: string, name: string, role: string, companyName: string) {
    const roleMessages: Record<string, string> = {
      SUPPLIER: 'You can now list your captured CO₂ inventory, manage listings, and fulfill buyer orders.',
      BUYER:    'You can now browse the live CO₂ marketplace, post requirements, and place procurement orders.',
      ADMIN:    'You have full platform governance access — verify companies, manage users, and configure fees.',
    };
    const html = baseLayout(`
      ${heading('Welcome to ReCarbo! 🌿')}
      ${subheading('Your account has been created successfully.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, welcome aboard! Your <strong style="color:#fff;">${companyName}</strong> account is now active on the ReCarbo circular carbon marketplace.`)}
      <div style="text-align:center;margin:16px 0 24px;">${roleTag(role)}</div>
      ${paragraph(roleMessages[role] || roleMessages.BUYER)}
      ${infoTable(
        infoRow('Name', name) +
        infoRow('Company', companyName) +
        infoRow('Role', role, '#34d399') +
        infoRow('Platform', 'ReCarbo · Gujarat, India')
      )}
      ${ctaButton('Go to Dashboard')}
      ${divider()}
      ${paragraph('<span style="color:#6b7280;font-size:12px;">Your company verification is pending. An admin will review your profile shortly. Verified companies get a higher trust score and priority in matching.</span>')}
    `);
    await sendMail(to, '🌿 Welcome to ReCarbo — Your Account is Ready', html);
  },

  // 2. Login Alert
  async sendLoginAlert(to: string, name: string, role: string, ipAddress?: string) {
    const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });
    const html = baseLayout(`
      ${heading('New Login Detected 🔐')}
      ${subheading('Someone just signed in to your ReCarbo account.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, a new login was recorded on your account.`)}
      ${infoTable(
        infoRow('Time (IST)', time) +
        infoRow('Role', role, '#34d399') +
        infoRow('IP Address', ipAddress || 'Unknown') +
        infoRow('Platform', 'ReCarbo · Gujarat, India')
      )}
      ${paragraph('If this was you, no action is needed. If you did not log in, please contact the platform admin immediately.')}
      ${ctaButton('Go to My Account')}
    `);
    await sendMail(to, '🔐 ReCarbo Login Alert — New Sign-in Detected', html);
  },

  // 3. Order Placed (Buyer)
  async sendOrderPlacedBuyer(to: string, name: string, order: any) {
    const html = baseLayout(`
      ${heading('Order Confirmed ✅')}
      ${subheading('Your CO₂ procurement order has been placed successfully.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, your order has been confirmed and payment is held in escrow.`)}
      ${infoTable(
        infoRow('Order Number', order.orderNumber, '#34d399') +
        infoRow('Supplier', order.supplierCompany?.name || '—') +
        infoRow('Quantity', `${(order.quantityKg / 1000).toFixed(2)} Tonnes`) +
        infoRow('Unit Price', `₹${order.unitPricePerKg?.toFixed(2)}/kg`) +
        infoRow('CO₂ Cost', `₹${order.totalCo2Cost?.toLocaleString('en-IN')}`) +
        infoRow('Transport', `₹${order.transportCost?.toLocaleString('en-IN')}`) +
        infoRow('Platform Fee', `₹${order.platformFee?.toLocaleString('en-IN')}`) +
        infoRow('Total Amount', `₹${order.totalAmount?.toLocaleString('en-IN')}`, '#34d399') +
        infoRow('Payment', 'Escrow Held 🔒', '#f59e0b') +
        infoRow('Est. Delivery', order.estimatedDelivery ? new Date(order.estimatedDelivery).toDateString() : '4 business days')
      )}
      ${ctaButton('Track My Order')}
    `);
    await sendMail(to, `✅ Order Confirmed: ${order.orderNumber} — ReCarbo`, html);
  },

  // 4. New Order Alert (Supplier)
  async sendNewOrderSupplier(to: string, name: string, order: any) {
    const html = baseLayout(`
      ${heading('New Order Received 📦')}
      ${subheading('A buyer has placed an order on your CO₂ listing.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, <strong style="color:#fff;">${order.buyerCompany?.name}</strong> has placed a new order. Please confirm and begin processing.`)}
      ${infoTable(
        infoRow('Order Number', order.orderNumber, '#34d399') +
        infoRow('Buyer', order.buyerCompany?.name || '—') +
        infoRow('Quantity', `${(order.quantityKg / 1000).toFixed(2)} Tonnes`) +
        infoRow('Unit Price', `₹${order.unitPricePerKg?.toFixed(2)}/kg`) +
        infoRow('Your Revenue', `₹${order.totalCo2Cost?.toLocaleString('en-IN')}`, '#34d399') +
        infoRow('Total Order Value', `₹${order.totalAmount?.toLocaleString('en-IN')}`) +
        infoRow('Delivery Address', order.deliveryAddress || '—') +
        infoRow('Transit Method', order.transitMethod || 'Cryogenic Road Tanker')
      )}
      ${ctaButton('Manage Orders')}
    `);
    await sendMail(to, `📦 New Order: ${order.orderNumber} from ${order.buyerCompany?.name} — ReCarbo`, html);
  },

  // 5. Order Status Update
  async sendOrderStatusUpdate(to: string, name: string, order: any, newStatus: string, isBuyer: boolean) {
    const statusConfig: Record<string, { icon: string; title: string; color: string; bg: string; msg: string }> = {
      CONFIRMED:   { icon: '✅', title: 'Order Confirmed',        color: '#34d399', bg: '#064e3b44', msg: 'Your order has been confirmed. Payment is securely held in escrow.' },
      PROCESSING:  { icon: '⚙️', title: 'Order Processing',       color: '#60a5fa', bg: '#1e3a5f44', msg: 'The supplier is preparing your CO₂ batch for dispatch.' },
      IN_TRANSIT:  { icon: '🚚', title: 'Shipment Dispatched',    color: '#f59e0b', bg: '#78350f44', msg: 'Your CO₂ shipment is on the way via cryogenic road tanker.' },
      DELIVERED:   { icon: '📬', title: 'Delivery Completed',     color: '#34d399', bg: '#064e3b44', msg: 'Delivery confirmed. Escrow payment has been released to the supplier.' },
      UTILIZED:    { icon: '🌱', title: 'CO₂ Utilized',           color: '#a78bfa', bg: '#4c1d9544', msg: 'CO₂ has been utilized in circular manufacturing. Carbon credits recorded.' },
      CANCELLED:   { icon: '❌', title: 'Order Cancelled',        color: '#f87171', bg: '#7f1d1d44', msg: 'This order has been cancelled. Any escrow payment will be refunded.' },
    };
    const cfg = statusConfig[newStatus] || statusConfig.CONFIRMED;
    const html = baseLayout(`
      ${heading(`${cfg.icon} ${cfg.title}`)}
      <div style="text-align:center;margin:0 0 20px;">${statusBadge(newStatus.replace('_', ' '), cfg.color, cfg.bg)}</div>
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, ${cfg.msg}`)}
      ${infoTable(
        infoRow('Order Number', order.orderNumber, '#34d399') +
        infoRow(isBuyer ? 'Supplier' : 'Buyer', isBuyer ? (order.supplierCompany?.name || '—') : (order.buyerCompany?.name || '—')) +
        infoRow('Quantity', `${(order.quantityKg / 1000).toFixed(2)} Tonnes`) +
        infoRow('Total Amount', `₹${order.totalAmount?.toLocaleString('en-IN')}`) +
        infoRow('New Status', newStatus.replace('_', ' '), cfg.color) +
        (order.trackingNumber ? infoRow('Tracking #', order.trackingNumber, '#f59e0b') : '')
      )}
      ${ctaButton('View Order Details')}
    `);
    await sendMail(to, `${cfg.icon} Order ${order.orderNumber} — ${cfg.title} | ReCarbo`, html);
  },

  // 6. Quote Received (Supplier)
  async sendQuoteReceived(to: string, name: string, buyerName: string, listingTitle: string, quantityKg: number, pricePerKg: number) {
    const html = baseLayout(`
      ${heading('New Quote Received 💬')}
      ${subheading('A buyer has submitted a bid on your RFQ listing.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, <strong style="color:#fff;">${buyerName}</strong> has submitted a quote on your listing.`)}
      ${infoTable(
        infoRow('Listing', listingTitle) +
        infoRow('Buyer', buyerName) +
        infoRow('Offered Quantity', `${(quantityKg / 1000).toFixed(2)} Tonnes`) +
        infoRow('Offered Price', `₹${pricePerKg.toFixed(2)}/kg`, '#34d399') +
        infoRow('Total Bid Value', `₹${(quantityKg * pricePerKg).toLocaleString('en-IN')}`, '#34d399')
      )}
      ${ctaButton('Review Quotes')}
    `);
    await sendMail(to, `💬 New Quote from ${buyerName} — ReCarbo`, html);
  },

  // 7. Company Verified
  async sendCompanyVerified(to: string, name: string, companyName: string) {
    const html = baseLayout(`
      ${heading('Company Verified! 🛡️')}
      ${subheading('Your company has been approved by the ReCarbo admin team.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, great news! <strong style="color:#fff;">${companyName}</strong> has been verified on the ReCarbo platform.`)}
      <div style="background:#064e3b22;border:1px solid #10b98144;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#34d399;font-size:28px;margin:0 0 8px;">✅ Verified</p>
        <p style="color:#6ee7b7;font-size:13px;margin:0;">Your trust score has been upgraded. You now appear higher in match results.</p>
      </div>
      ${paragraph('Verified companies receive priority placement in AI match recommendations and buyer searches.')}
      ${ctaButton('View My Profile')}
    `);
    await sendMail(to, `🛡️ ${companyName} is Now Verified on ReCarbo`, html);
  },

  // 8. Match Found (Buyer)
  async sendMatchFound(to: string, name: string, matchCount: number, requirementTitle: string) {
    const html = baseLayout(`
      ${heading(`${matchCount} CO₂ Match${matchCount > 1 ? 'es' : ''} Found! 🔍`)}
      ${subheading('The ReCarbo matching engine found eligible suppliers for your requirement.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, our 5-factor matching engine has found <strong style="color:#34d399;">${matchCount} eligible supplier listing(s)</strong> for your requirement: <em style="color:#6ee7b7;">"${requirementTitle}"</em>.`)}
      <div style="background:#064e3b22;border:1px solid #10b98144;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Match Score Formula</p>
        <p style="color:#cbd5e1;font-size:13px;margin:0;">30% Quantity &nbsp;+&nbsp; 25% Purity &nbsp;+&nbsp; 20% Distance &nbsp;+&nbsp; 15% Price &nbsp;+&nbsp; 10% Trust</p>
      </div>
      ${ctaButton('View Matches in Marketplace')}
    `);
    await sendMail(to, `🔍 ${matchCount} CO₂ Match(es) Found for "${requirementTitle}" — ReCarbo`, html);
  },

  // 9. Listing Created (Supplier)
  async sendListingCreated(to: string, name: string, listing: any) {
    const html = baseLayout(`
      ${heading('CO₂ Listing Published! 📦')}
      ${subheading('Your listing is now live on the ReCarbo marketplace.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, your CO₂ listing is now visible to all verified buyers.`)}
      ${infoTable(
        infoRow('Title', listing.title) +
        infoRow('Quantity', `${(listing.quantityAvailableKg / 1000).toFixed(2)} Tonnes`) +
        infoRow('Purity', `${listing.purityPercentage}%`, '#34d399') +
        infoRow('Price', `₹${listing.pricePerKg.toFixed(2)}/kg`, '#34d399') +
        infoRow('State', listing.stateOfMatter) +
        infoRow('Mode', listing.transactionMode === 'FIXED_PRICE' ? 'Fixed Price' : 'Request for Quote')
      )}
      ${ctaButton('View My Listings')}
    `);
    await sendMail(to, `📦 Listing Live: "${listing.title}" — ReCarbo`, html);
  },

  // 10. Forgot Password / Reset Link
  async sendPasswordReset(to: string, name: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = baseLayout(`
      ${heading('Reset Your Password 🔑')}
      ${subheading('A password reset was requested for your ReCarbo account.')}
      ${paragraph(`Hi <strong style="color:#fff;">${name}</strong>, we received a request to reset the password for your ReCarbo account.`)}
      <div style="background:#1a2e28;border:1px solid #10b98144;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 16px;">Click the button below to set a new password. This link expires in <strong style="color:#f59e0b;">15 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;font-size:14px;font-weight:800;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
          Reset My Password →
        </a>
      </div>
      ${paragraph('<span style="color:#6b7280;font-size:12px;">If you did not request this, you can safely ignore this email. Your password will not change.</span>')}
      ${divider()}
      <p style="color:#4b5563;font-size:11px;word-break:break-all;">If the button doesn\'t work, copy this link: <span style="color:#6ee7b7;">${resetUrl}</span></p>
    `);
    await sendMail(to, '🔑 Reset Your ReCarbo Password', html);
  },
};
