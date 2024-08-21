const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const xlsx = require('xlsx');
const WaterUsage = require('./model/Water');
require('dotenv').config();

const app = express();
app.use(express.json());

const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error(err));

app.get("/",(req,res)=>{
    res.send("whatsApp ChatBot app")
})

const sendWaterUsagePrompt = () => {
    client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        body: "Please send today's Water Usage Data.",
        to: process.env.USER_WHATSAPP_NUMBER
    })
        .then(message => console.log(`Message sent: ${message.sid}`))
        .catch(err => console.error('Failed to send message:', err));
};

setInterval(()=>{
    sendWaterUsagePrompt();
},300000)


// Endpoint to receive messages from users
app.post('/webhook', async (req, res) => {
    try {
        const incomingMessage = req.body.Body;
        const from = req.body.From;

       
        const waterUsage = new WaterUsage({ value: incomingMessage });
        await waterUsage.save();

     
        saveToExcel(incomingMessage);

       
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            body: `Thank you! You've recorded: ${incomingMessage}`,
            to: from
        });

        res.status(200).json({"msg":"message recieved"});
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500);
    }
});

const saveToExcel = (value) => {
    let workbook;
    const fileName = 'water_usage.xlsx';
    try {
        workbook = xlsx.readFile(fileName);
    } catch (e) {
        workbook = xlsx.utils.book_new();
    }

    const sheetName = 'WaterUsage';
    let worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        worksheet = xlsx.utils.aoa_to_sheet([['Date', 'Value']]);
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const newRow = [new Date().toLocaleString(), value];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    data.push(newRow);

    worksheet = xlsx.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = worksheet;
    xlsx.writeFile(workbook, fileName);
};

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

