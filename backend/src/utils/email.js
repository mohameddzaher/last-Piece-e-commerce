import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailVerification = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email - Last Piece',
    html: `
      <h2>Welcome to Last Piece!</h2>
      <p>Please verify your email to complete your registration.</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p style="margin-top: 20px; color: #666;">Or copy this link: ${verificationUrl}</p>
      <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

export const sendPasswordReset = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: 'Reset Your Password - Last Piece',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p style="margin-top: 20px; color: #666;">Or copy this link: ${resetUrl}</p>
      <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

export const sendOrderConfirmation = async (email, order) => {
  const mailOptions = {
    from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <h2>Order Confirmed!</h2>
      <p>Thank you for your order, ${order.billingAddress.firstName}!</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Total Amount:</strong> $${order.pricing.total}</p>
      <p><strong>Estimated Delivery:</strong> ${new Date(order.shipping.estimatedDelivery).toLocaleDateString()}</p>
      <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Order Details
      </a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

export const sendOrderStatusUpdate = async (email, order, status) => {
  const statusMessages = {
    pending: 'Your order is pending confirmation',
    confirmed: 'Your order has been confirmed',
    processing: 'Your order is being processed',
    dispatched: 'Your order has been dispatched',
    in_transit: 'Your order is in transit',
    delivered: 'Your order has been delivered',
    cancelled: 'Your order has been cancelled',
  };

  const mailOptions = {
    from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: `Order Status Update - ${order.orderNumber}`,
    html: `
      <h2>Order Status Update</h2>
      <p>${statusMessages[status] || 'Your order status has been updated'}</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      ${order.shipping.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber}</p>` : ''}
      <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Track Order
      </a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

export const sendNewsletterEmail = async (email, subject, htmlContent) => {
  const mailOptions = {
    from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};
