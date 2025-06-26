const Review = require('../models/Review');

exports.createReview = async (req, res) => {
  try {
    const review = await Review.create({
      ...req.body,
      user: req.userId
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  const { professionalId } = req.params;
  const reviews = await Review.find({ professional: professionalId }).populate('user', 'name');
  res.json(reviews);
};
