const express = require('express');
const router = express.Router();

// Replace this with real logic or AI/ML recommender later!
router.post('/gigs', async (req, res) => {
  const { skills } = req.body;
  const allGigs = [
    { id: 1, title: 'React Website Development', skills: ['React', 'JavaScript'] },
    { id: 2, title: 'Data Analysis Report', skills: ['Python', 'Data Analysis'] },
    { id: 3, title: 'Logo Design', skills: ['Design', 'Photoshop'] },
  ];
  const recommendations = allGigs.filter(gig =>
    skills && skills.some(skill => gig.skills.includes(skill))
  );
  res.json({ recommendations });
});

module.exports = router;
