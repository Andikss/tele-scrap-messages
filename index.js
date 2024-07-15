import { fetchDatabase } from './src/database.js';
import express from 'express';
import './src/telegram.js';

const app = express();

app.get('/', async (req, res) => {
    const group    = req.query?.group;
    const province = req.query?.province;
    const date     = req.query?.date;

    const results  = await fetchDatabase(group, province, date);
    res.send(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});