import nodemailer from "nodemailer";
export async function sendEmail(options) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions); // Use await here
  } catch (error) {
    console.error("Error in sending email:", error.message); // Handle error properly
    throw new Error("Error in sending email");
  }
}
