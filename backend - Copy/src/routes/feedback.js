import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Feedback from '../models/Feedback.js';
import Application from '../models/Application.js';
import Internship from '../models/Internship.js';

const router = express.Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  try {
    const { internshipId, studentRating, providerRating, completionStatus, performanceNote } = req.body;
    if (!internshipId) return res.status(400).json({ success: false, message: 'internshipId required' });

    const app = await Application.findOne({
      internship: internshipId,
      student: req.user._id,
      status: 'accepted',
    });
    if (!app) return res.status(400).json({ success: false, message: 'No accepted application found' });

    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

    const feedback = await Feedback.findOneAndUpdate(
      { student: req.user._id, internship: internshipId },
      {
        studentRating,
        providerRating,
        completionStatus: completionStatus || 'completed',
        performanceNote,
        organization: internship.organization,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
