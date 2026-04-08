import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = `"Manakamana Printing" <${process.env.SMTP_EMAIL}>`;

// sendClientCredentials: Sends login credentials to a newly approved client
export const sendClientCredentials = async (opts: {
  to: string;
  businessName: string;
  clientCode: string;
  phoneNumber: string;
  password: string;
}) => {
  const { to, businessName, clientCode, phoneNumber, password } = opts;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your Manakamana Printing Account is Ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #0061FF; padding: 32px 40px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Manakamana Printing</h1>
        </div>
        <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="font-size: 20px; margin: 0 0 8px;">Welcome, ${businessName}</h2>
          <p style="color: #64748b; margin: 0 0 32px;">Your registration has been approved. Use the credentials below to log in to your account.</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Client Code</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 15px;">${clientCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Login ID (Phone)</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 15px;">${phoneNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Password</td>
                <td style="padding: 8px 0; font-weight: 700; font-size: 18px; letter-spacing: 2px; color: #0061FF;">${password}</td>
              </tr>
            </table>
          </div>

          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Please keep your credentials safe. If you have any issues logging in, contact us at
            <a href="mailto:${process.env.SMTP_EMAIL}" style="color: #0061FF;">${process.env.SMTP_EMAIL}</a>.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Manakamana Printing &mdash; Professional Printing Services</p>
        </div>
      </div>
    `,
  });
};

// sendPasswordReset: Notifies a client that their password has been reset by the admin
export const sendPasswordReset = async (opts: {
  to: string;
  ownerName: string;
  businessName: string;
  phoneNumber: string;
  newPassword: string;
}) => {
  const { to, ownerName, businessName, phoneNumber, newPassword } = opts;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your Manakamana Printing Password Has Been Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #0061FF; padding: 32px 40px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Manakamana Printing</h1>
        </div>
        <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="font-size: 20px; margin: 0 0 8px;">Password Reset</h2>
          <p style="color: #64748b; margin: 0 0 8px;">Hi ${ownerName},</p>
          <p style="color: #64748b; margin: 0 0 32px;">
            The password for your <strong>${businessName}</strong> account has been reset by the admin.
            Use the new credentials below to log in.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Login ID (Phone)</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 15px;">${phoneNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">New Password</td>
                <td style="padding: 8px 0; font-weight: 700; font-size: 22px; letter-spacing: 4px; color: #0061FF;">${newPassword}</td>
              </tr>
            </table>
          </div>

          <p style="color: #64748b; margin: 0 0 8px;">Please log in and keep your new password safe.</p>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            If you did not request this reset, contact us immediately at
            <a href="mailto:${process.env.SMTP_EMAIL}" style="color: #0061FF;">${process.env.SMTP_EMAIL}</a>.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Manakamana Printing &mdash; Professional Printing Services</p>
        </div>
      </div>
    `,
  });
};

// sendDesignApproved: Notifies client their design has been approved and provides the design ID
export const sendDesignApproved = async (opts: {
  to: string;
  businessName: string;
  designCode: string;
  designTitle?: string;
}) => {
  const { to, businessName, designCode, designTitle } = opts;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Design Approved — Your Design ID: ${designCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #0061FF; padding: 32px 40px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Manakamana Printing</h1>
        </div>
        <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="font-size: 20px; margin: 0 0 8px;">Design Approved</h2>
          <p style="color: #64748b; margin: 0 0 8px;">Hi ${businessName},</p>
          <p style="color: #64748b; margin: 0 0 32px;">
            ${designTitle ? `Your design "<strong>${designTitle}</strong>" has been reviewed and approved.` : "Your design submission has been reviewed and approved."}
            Use the Design ID below when placing your print order.
          </p>

          <div style="background: #eff6ff; border: 2px solid #0061FF; border-radius: 8px; padding: 28px; text-align: center; margin-bottom: 32px;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your Design ID</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #0061FF;">${designCode}</p>
          </div>

          <p style="color: #64748b; margin: 0 0 8px;">To use your design:</p>
          <ol style="color: #64748b; margin: 0 0 32px; padding-left: 20px; line-height: 1.8;">
            <li>Log in to your account</li>
            <li>Go to Place Order</li>
            <li>Enter your Design ID <strong>${designCode}</strong> in the checkout form</li>
          </ol>

          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Questions? Contact us at
            <a href="mailto:${process.env.SMTP_EMAIL}" style="color: #0061FF;">${process.env.SMTP_EMAIL}</a>.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Manakamana Printing &mdash; Professional Printing Services</p>
        </div>
      </div>
    `,
  });
};

// sendDesignRejected: Notifies client their design was rejected and provides admin feedback
export const sendDesignRejected = async (opts: {
  to: string;
  businessName: string;
  designTitle?: string;
  feedbackMessage?: string;
}) => {
  const { to, businessName, designTitle, feedbackMessage } = opts;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Design Submission Update — Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: #0061FF; padding: 32px 40px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Manakamana Printing</h1>
        </div>
        <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="font-size: 20px; margin: 0 0 8px;">Design Needs Revision</h2>
          <p style="color: #64748b; margin: 0 0 8px;">Hi ${businessName},</p>
          <p style="color: #64748b; margin: 0 0 32px;">
            ${designTitle ? `Your design "<strong>${designTitle}</strong>" could not be approved at this time.` : "Your recent design submission could not be approved at this time."}
          </p>

          ${feedbackMessage ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <p style="margin: 0 0 6px; font-size: 12px; color: #ef4444; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Feedback</p>
            <p style="margin: 0; color: #1e293b;">${feedbackMessage}</p>
          </div>
          ` : ""}

          <p style="color: #64748b; margin: 0 0 32px;">
            Please revise your design based on the feedback above and resubmit through your account.
          </p>

          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Need help? Contact us at
            <a href="mailto:${process.env.SMTP_EMAIL}" style="color: #0061FF;">${process.env.SMTP_EMAIL}</a>.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Manakamana Printing &mdash; Professional Printing Services</p>
        </div>
      </div>
    `,
  });
};
