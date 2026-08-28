// import config from "../config";
//import nodemailer from "nodemailer";

// const emailSender = async (to: string, html: string, subject: string) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: "smtp-relay.brevo.com",
//       port: 2525,
//       secure: false,
//       auth: {
//         user: "88803c001@smtp-brevo.com",
//         pass: "OzqM8PBhVxbNYEUt",
//       },
//     })
//     const mailOptions = {
//       from: `"From Your App" <akonhasan680@gmail.com>`,
//       to,
//       subject,
//       text: html.replace(/<[^>]+>/g, ""),
//       html,
//     }
//     // Send the email
//     const info = await transporter.sendMail(mailOptions)
//     return info.messageId
//   } catch (error) {
//     throw new Error("Failed to send email. Please try again later.")
//   }
// }

// export default emailSender;

import nodemailer from "nodemailer";

const emailSender = async (to: string, html: string, subject: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: "ashiqurtonmoy.official@gmail.com",
        pass: "uyta yuuz acix onfm",
      },
    });

    const mailOptions = {
      from: `"From Your App" <ashiqurtonmoy.official@gmail.com>`,
      to,
      html,
      subject,
    };

    const info = await transporter.sendMail(mailOptions);
    return info.messageId;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};

export default emailSender;