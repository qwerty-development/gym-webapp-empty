// src/app/api/sendAdminEmail/route.js
import nodemailer from 'nodemailer'

export async function POST(request) {
	const {
		user_name,
		activity_name,
		activity_date,
		start_time,
		end_time,
		coach_name
	} = await request.json()

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS
		}
	})

	const mailOptions = {
		from: 'noreply@notqwerty.com',
		to: 'asif.k.alam@net.usek.edu.lb', // Replace with your admin email
		subject: 'Cancel Booking',
		text: `
      Cancelled Booking
      User Name: ${user_name}
      User Email: ${user_email}
      Activity Name: ${activity_name}
      Activity Date: ${activity_date}
      Start Time: ${start_time}
      End Time: ${end_time}
      Coach Name: ${coach_name}

    `
	}

	try {
		await transporter.sendMail(mailOptions)
		return new Response(
			JSON.stringify({ message: 'Email sent successfully' }),
			{ status: 200 }
		)
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to send email' }), {
			status: 500
		})
	}
}
