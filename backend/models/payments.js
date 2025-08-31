import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./User.js";
import Gig from "./GIG.js";

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "pending",
  },
  paymentProviderId: {
    type: DataTypes.STRING, // e.g., Stripe payment intent ID
    allowNull: false,
    unique: true,
  },
});

// Associations
Payment.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Payment, { foreignKey: "userId" });

Payment.belongsTo(Gig, { foreignKey: "gigId" });
Gig.hasMany(Payment, { foreignKey: "gigId" });

export default Payment;
