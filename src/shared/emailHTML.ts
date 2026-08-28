// Generate Otp
const generateOtpEmail = (otp: number) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px 20px; background-color: #f4f6f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
        
        <div style="background: #0d47a1; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 26px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
            Verification Code
          </h1>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #4a5568; line-height: 1.7; margin: 0 0 25px 0; text-align: center;">
            Your OTP code is below.
          </p>
          
          <div style="background-color: #f1f5f9; padding: 30px; border-radius: 6px; margin: 0 0 25px 0; text-align: center; border-left: 4px solid #0d47a1;">
            <p style="font-size: 14px; color: #4a5568; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
              Your OTP Code
            </p>
            <p style="font-size: 42px; font-weight: 700; color: #0d47a1; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #4a5568; margin-bottom: 10px;">
              This OTP will expire in <strong style="color: #0d47a1;">10 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #4a5568; margin-bottom: 10px;">
              If you did not request this, please ignore the email.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 14px; color: #555; margin: 0 0 8px 0;">
            Best Regards,
          </p>
          <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 20px 0;">
            Developer Team
          </p>
          <p style="font-size: 12px; color: #777; margin: 0; line-height: 1.6;">
            © ${new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        
      </div>
    </div>`;
};

//Forgot Password
const forgetPasswordEmail = (otp: number) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px 20px; background-color: #f4f6f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
        
        <div style="background: #0d47a1; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 26px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
            Forgot Password Code
          </h1>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #4a5568; line-height: 1.7; margin: 0 0 25px 0; text-align: center;">
            Use the OTP below to reset your password.
          </p>
          
          <div style="background-color: #f1f5f9; padding: 30px; border-radius: 6px; margin: 0 0 25px 0; text-align: center; border-left: 4px solid #0d47a1;">
            <p style="font-size: 14px; color: #4a5568; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
              Your OTP Code
            </p>
            <p style="font-size: 42px; font-weight: 700; color: #0d47a1; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #4a5568; margin-bottom: 10px;">
              The OTP expires in <strong style="color: #0d47a1;">10 minutes</strong>.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 14px; color: #555; margin: 0 0 8px 0;">
            Best Regards,
          </p>
          <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 20px 0;">
            Developer Team
          </p>
          <p style="font-size: 12px; color: #777; margin: 0; line-height: 1.6;">
            © ${new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        
      </div>
    </div>`;
};

// Resend Otp
const resendOtpEmail = (otp: number) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px 20px; background-color: #f4f6f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
        
        <div style="background: #0d47a1; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 26px; font-weight: 600; margin: 0;">
            Resent Verification Code
          </h1>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #4a5568; text-align: center;">
            Your new OTP is below.
          </p>
          
          <div style="background-color: #f1f5f9; padding: 30px; border-radius: 6px; margin: 20px 0; text-align: center; border-left: 4px solid #0d47a1;">
            <p style="font-size: 42px; font-weight: 700; color: #0d47a1; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </p>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 14px; color: #555; margin: 0 0 8px 0;">
            Best Regards,
          </p>
          <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 20px 0;">
            Developer Team
          </p>
          <p style="font-size: 12px; color: #777; line-height: 1.6; margin: 0;">
            © ${new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        
      </div>
    </div>`;
};

// Invite User Email (after admin adds a user)
const inviteUserEmail = (fullName: string, password: string) => {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; padding: 40px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color: #0d47a1; font-size: 26px; text-align: center; margin-bottom: 10px; letter-spacing: 0.5px;">
        Welcome to (Company Name)
      </h2>

      <p style="font-size: 15px; color: #555; text-align: center; margin-top: 0; line-height: 1.7;">
        Hello <strong style="color:#0d47a1;">${fullName}</strong>,  
        <br/><br/>
        You have been added to the <strong>(Company Name)</strong> system.
        You may now log in using the credentials provided below.
      </p>

      <div style="background: #f1f5f9; border-left: 4px solid #0d47a1; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 15px 0;">
          Your Login Credentials:
        </p>

        <p style="font-size: 14px; color: #4a5568; margin: 6px 0;">
          <strong>Username:</strong> ${fullName}
        </p>

        <p style="font-size: 14px; color: #4a5568; margin: 6px 0;">
          <strong>Password:</strong> ${password}
        </p>
      </div>

      <p style="font-size: 14px; color: #555; line-height: 1.7; margin-top: 20px; text-align:center;">
        If you need assistance accessing your account,  
        please contact our support team anytime.
      </p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />

      <div style="text-align: center; margin-top: 10px;">
        <p style="font-size: 13px; color: #777;">
          Regards,<br/>
          <span style="font-weight: bold; color: #0d47a1;">Developer Team</span>
        </p>
      </div>

    </div>
  </div>
  `;
};

// Support Message
const generateSupportMessageEmail = ({
  email,
  name,
  phone,
  message,
}: {
  email: string;
  name: string;
  phone: string;
  message: string;
}) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px 20px; background-color: #f4f6f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">

        <!-- Header -->
        <div style="background: #0d47a1; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 26px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
            New Support Message
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #4a5568; line-height: 1.7; margin-bottom: 30px;">
            You have received a new support message from a user. The details are below:
          </p>

          <!-- User Info -->
          <div style="background-color: #f1f5f9; padding: 25px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #0d47a1;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #4a5568;">
              <strong style="color: #0d47a1;">Name:</strong> ${name}
            </p>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #4a5568;">
              <strong style="color: #0d47a1;">Phone:</strong> ${phone}
            </p>
            <p style="margin: 0; font-size: 14px; color: #4a5568;">
              <strong style="color: #0d47a1;">Email:</strong> ${email}
            </p>
          </div>

          <!-- Message -->
          <div style="background-color: #ffffff; padding: 25px; border-radius: 6px; border: 1px solid #e9ecef;">
            <p style="font-size: 14px; color: #4a5568; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Message
            </p>
            <p style="font-size: 15px; color: #333; line-height: 1.7; margin: 0; white-space: pre-line;">
              ${message}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 14px; color: #555; margin: 0 0 8px 0;">
            Admin Notification
          </p>
          <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 20px 0;">
            Support System
          </p>
          <p style="font-size: 12px; color: #777; margin: 0; line-height: 1.6;">
            © ${new Date().getFullYear()} All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;
};

const accountRejectedEmail = (fullName: string) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background-color: #b71c1c; padding: 36px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Application Rejected</h1>
        </div>

        <!-- Body -->
        <div style="padding: 36px 30px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 16px 0;">Dear <strong>${fullName}</strong>,</p>

          <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 20px 0;">
            After careful review, we regret to inform you that your Account application has been <strong style="color: #b71c1c;">rejected</strong> by our team.
          </p>

          <div style="background-color: #fce4e4; border-left: 4px solid #b71c1c; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #7f1d1d; margin: 0; line-height: 1.6;">
              Your account and all associated data have been removed from our platform in accordance with our policies.
            </p>
          </div>

          <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0;">
            If you believe this decision was made in error or have any questions, please reach out to our support team for further assistance.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 13px; color: #888; margin: 0 0 6px 0;">This is an automated notification. Please do not reply to this email.</p>
          <p style="font-size: 12px; color: #aaa; margin: 0;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>

      </div>
    </div>
  `;
};

export { generateOtpEmail, forgetPasswordEmail, resendOtpEmail, inviteUserEmail, generateSupportMessageEmail, accountRejectedEmail };