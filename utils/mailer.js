const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use a custom SMTP
  auth: {
    user: 'lakshmi.zigainfotech@gmail.com',
    pass: 'jdes ntmh adaz wgzl' // use App Password if Gmail
  }
});

const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: '"Task Manager" lakshmi.zigainfotech@gmail.com',
    to,
    subject,
    text
  });
};

module.exports = sendEmail;
