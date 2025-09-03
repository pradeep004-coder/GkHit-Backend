import express from "express"
import mongoose from "mongoose"
import cors from "cors"
const app = express()
const port = 8222
const mongoURL = "mongodb://localhost:27017/MERN_Projects"

app.use(express.json());
app.use(cors());

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connection Successful.");
}).catch((err) => {
    console.log("connection failed", err);
})

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    score: { type: Number, required: true },
    duration: { type: Number, required: true }
});

const userModel = mongoose.model('gkhit_leaderboard', userSchema);

app.get('/', async (req, res) => {
    try {
        const leaderboard = await userModel.find().sort({ score: -1, duration: 1 });
        if (!leaderboard) {
            return res.status(403).json({ message: 'Leaderbord data not found', success: false });
        }
        if (leaderboard.length === 0) {
            return res.status(404).json({ message: 'Leaderboard is empty', success: false });
        }

        res.status(200).json(leaderboard);
    } catch (err) {
        console.error('loading failed: ', err);
        res.status(500).json({ message: 'Internal server error, get failed!!!', success: false });
    }
})
app.post('/', async (req, res) => {
    try {
        const { name, score, duration } = req.body;
        const leaderboard = await userModel.find();
        const user = await userModel.findOne({ name });
        if (!user) {
            if (leaderboard.length === 10) {
                leaderboard.sort((a, b) => a.score === b.score ? b.duration - a.duration : a.score - b.score );
                const lowest = leaderboard[0];
                if (score > lowest.score || (score === lowest.score && duration < lowest.duration)) {
                    lowest.name = name;
                    lowest.score = score;
                    lowest.duration = duration;
                    await lowest.save()
                } else {
                    return res.status(200).json({ message: 'Score too low to enter leaderboard', success: false });
                }
            } else {
                // If collection is empty, create new user
                const newUser = new userModel({ name, score, duration });
                await newUser.save();
                return res.status(201).json({ message: 'New user added!', success: true });
            }
        }
        if (score > user.score || (score >= user.score && duration < user.duration)) {
            user.score = score;
            user.duration = duration;
            await user.save()
            return res.status(201).json({ message: 'Leaderboard updated successful!', success: true });
        }
        return res.status(200).json({ message: 'No update needed', success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error, post failed!!!", success: false });
    }
})
app.listen(port)