const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

mongoose.connect('mongodb+srv://movi:movi@movi.muqtx3v.mongodb.net/movi', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const depositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    profitBalance: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const Deposit = mongoose.model('Deposit', depositSchema);
const User = mongoose.model('User', userSchema);

app.use(express.json());
app.use(helmet());

app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user._id;
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.get('/api/protected', requireAuth, (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
});

app.post('/api/deposit', requireAuth, async (req, res) => {
    const { amount } = req.body;
    try {
        const deposit = new Deposit({ userId: req.session.userId, amount });
        await deposit.save();
        res.status(201).json({ message: 'Deposit saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/deposit', requireAuth, async (req, res) => {
    try {
        const latestDeposit = await Deposit.findOne({ userId: req.session.userId }).sort({ timestamp: -1 });
        if (latestDeposit) {
            const secondsPassed = Math.floor((Date.now() - latestDeposit.timestamp) / 1000);
            const profitEarned = latestDeposit.amount * (Math.pow(1.3, secondsPassed / (24 * 60 * 60)) - 1);
            const profitBalance = latestDeposit.profitBalance + profitEarned;
            res.json({ amount: latestDeposit.amount, profitBalance });
        } else {
            res.json({ amount: 0, profitBalance: 0 });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




//         "dest": "client/dist/index.html"
//       }
//     ]
//   }
  
