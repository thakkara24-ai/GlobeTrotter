import mongoose, { Schema, Document } from 'mongoose';

export enum ExpenseCategory {
  TRANSPORT = 'TRANSPORT',
  ACCOMMODATION = 'ACCOMMODATION',
  FOOD = 'FOOD',
  ACTIVITY = 'ACTIVITY',
  SHOPPING = 'SHOPPING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export interface IExpense extends Document {
  trip: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [300, 'Title must be at most 300 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Currency must be a 3-letter code'],
      maxlength: [3, 'Currency must be a 3-letter code'],
      default: 'USD',
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: [true, 'Expense category is required'],
      default: ExpenseCategory.OTHER,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes must be at most 2000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics and querying
expenseSchema.index({ trip: 1, date: -1 });
expenseSchema.index({ trip: 1, category: 1 });

const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;
