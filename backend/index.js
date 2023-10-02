const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require('nodemailer');

const UserModal = require("./User");
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3003"];

app.use(express.json());
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
}));

mongoose.connect('mongodb://127.0.0.1:27017/employee');



// app.post('/register', async (req, res) => {
//     const { name, email, password } = req.body;

//     UserModal.create({ name, email, password })

//         .then(user => res.json("Success"))
//         .catch(err => res.json(err));
//         console.log(req.body);

// });




app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const user = await UserModal.create({ name, email, password });

        // Send a message to Microsoft Teams
        const message = `New user registered: ${name} (${email})`;
        await sendTeamsMessage(message);

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: 'jgupta324@gmail.com',
                pass: 'xhmx zflf pxnq dmbj',
            },
        });

        const mailOptions = {
            from: 'jgupta324@gmail.com',
            to: email,
            subject: 'Registration Confirmation',
            text: `Hello ${name},\n\nThank you for registering with us!\n\nRegards,\nYour Office Team`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Error creating user or sending email:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function sendTeamsMessage(message) {
    try {
        const teamsWebhookUrl = 'YOUR_MICROSOFT_TEAMS_WEBHOOK_URL';
        const response = await axios.post(teamsWebhookUrl, {
            text: message,
        });

        console.log('Message sent to Microsoft Teams:', response.data);
    } catch (error) {
        console.error('Error sending message to Microsoft Teams:', error);
    }
}





app.get('/updateUserData', async (req, res) => {
    try {
        const users = await UserModal.find({})
            .sort({ _id: -1 })
            .limit(5);

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

cron.schedule('*/1 * * * * ', async () => {

    try {
        const users = await UserModal.find({})
            .sort({ _id: -1 })
            .limit(5);

        const response = await axios.post('http://localhost:3002/updateUserData', users);
        console.log('Response from frontend:', response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});


app.post('/updateUserData', async (req, res) => {
    try {
        console.log('updateUserData was accessed.');
        const users = await UserModal.find({})
            .sort({ _id: -1 })
            .limit(5);

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

console.log("__dirname", __dirname)
console.log("__filename", __filename)

app.listen(3002, () => {
    console.log("Server is running on port 3002");
});
