const express = require('express');
const app = express();
const router = express.Router();

router.get('/admin', (req, res) => {
    res.send('thank you admin');
});

module.exports = router;
