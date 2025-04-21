import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  amount: Number,
  category: String,
  description: String,
  createdBy: String
});

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
