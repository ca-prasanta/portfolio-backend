import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------
// CORS (Add your frontend URLs)
// ---------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://personal-portfolio-theta-seven-20.vercel.app",
    ],
  })
);

app.use(express.json());

// ---------------------
// Health check
// ---------------------
app.get("/", (req, res) => {
  res.send("Mail Backend Running");
});

// ---------------------
// POST → Send Mail
// ---------------------
app.post("/send-mail", async (req, res) => {
  try {
    const { name, email, phone_number, company_name, summery, token } = req.body;

    // Optional — Turnstile verification
    if (process.env.TURNSTILE_SECRET && token) {
      const form = new URLSearchParams();
      form.append("secret", process.env.TURNSTILE_SECRET);
      form.append("response", token);

      const result = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: form,
        }
      );

      const data = await result.json();
      if (!data.success) {
        return res
          .status(400)
          .json({ success: false, error: "Captcha failed" });
      }
    }

    // ---------------------
    // Nodemailer Setup
    // ---------------------
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email body
    const html = `
      <h2>New Query</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone_number}</p>
      <p><strong>Company:</strong> ${company_name}</p>
      <p><strong>Message:</strong> ${summery}</p>
    `;

    await transporter.sendMail({
      from: `"Portfolio Query" <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL,
      subject: "New Contact Form Submission",
      html,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Mail backend running on port ${PORT}`);
});
