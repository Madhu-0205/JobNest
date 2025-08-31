const Gig = require('./models/GIG');
const User = require('./models/User');

module.exports = {
  async handlePaymentSuccess(paymentData) {
    try {
      const { paymentId, amount, userId, gigId } = paymentData;

      // Update gig status to 'paid'
      await Gig.update(
        { status: 'paid', paymentId },
        { where: { id: gigId } }
      );

      // Fetch user and safely update points
      const user = await User.findByPk(userId);
      if (user) {
        user.points = (user.points || 0) + Math.floor(amount / 100);
        await user.save();
      }

      console.log(`✅ Payment ${paymentId} succeeded for gig ${gigId} and user ${userId}`);
    } catch (error) {
      console.error(`❌ Error handling successful payment: ${error.message}`);
    }
  },

  async handlePaymentFailure(paymentData) {
    try {
      const { paymentId, gigId } = paymentData;

      // Update gig status to 'payment_failed'
      await Gig.update(
        { status: 'payment_failed' },
        { where: { id: gigId } }
      );

      console.log(`⚠️ Payment ${paymentId} failed for gig ${gigId}`);
    } catch (error) {
      console.error(`❌ Error handling failed payment: ${error.message}`);
    }
  }
};
