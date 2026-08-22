import mongoose from 'mongoose';
import Trip, { ITrip } from '../models/Trip';
import Expense, { IExpense } from '../models/Expense';
import {
  UpdateBudgetInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQuery,
} from '../validators/expense.validator';
import { PaginatedResult } from './city.service';

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  currency: string;
  expenseCount: number;
  overBudget: boolean;
}

export interface CategoryAnalyticsItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface DailyAnalyticsItem {
  date: string;
  amount: number;
}

class ExpenseService {
  /**
   * Helper: Verifies that a trip exists and belongs to the authenticated user.
   */
  async verifyTripOwnership(tripId: string, userId: string): Promise<ITrip> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      const error = new Error('Invalid trip ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      const error = new Error('Trip not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (trip.user.toString() !== userId) {
      const error = new Error('You do not have permission to access this trip');
      (error as any).statusCode = 403;
      throw error;
    }

    return trip;
  }

  /**
   * PUT /api/trips/:tripId/budget
   * Updates totalBudget and currency for a trip.
   */
  async updateBudget(
    tripId: string,
    userId: string,
    data: UpdateBudgetInput
  ): Promise<BudgetSummary> {
    await this.verifyTripOwnership(tripId, userId);

    await Trip.findByIdAndUpdate(
      tripId,
      {
        $set: {
          'budget.totalBudget': data.totalBudget,
          'budget.currency': data.currency,
        },
      },
      { new: true, runValidators: true }
    );

    return this.getBudgetSummary(tripId, userId);
  }

  /**
   * GET /api/trips/:tripId/budget
   * Returns comprehensive budget summary and analytics metrics.
   */
  async getBudgetSummary(tripId: string, userId: string): Promise<BudgetSummary> {
    const trip = await this.verifyTripOwnership(tripId, userId);

    const tripObjectId = new mongoose.Types.ObjectId(tripId);

    const [spentResult, expenseCount] = await Promise.all([
      Expense.aggregate([
        { $match: { trip: tripObjectId } },
        { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
      ]),
      Expense.countDocuments({ trip: tripId }),
    ]);

    const totalBudget = trip.budget?.totalBudget || 0;
    const currency = trip.budget?.currency || 'USD';
    const totalSpent = spentResult.length > 0 ? spentResult[0].totalSpent : 0;
    const remainingBudget = totalBudget - totalSpent;

    let percentageUsed = 0;
    if (totalBudget > 0) {
      percentageUsed = Number(((totalSpent / totalBudget) * 100).toFixed(2));
    } else if (totalSpent > 0) {
      percentageUsed = 100;
    }

    const overBudget = totalBudget > 0 ? totalSpent > totalBudget : totalSpent > 0;

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      percentageUsed,
      currency,
      expenseCount,
      overBudget,
    };
  }

  /**
   * GET /api/trips/:tripId/budget/categories
   * Returns spending breakdown grouped by category using MongoDB aggregation.
   */
  async getCategoryAnalytics(
    tripId: string,
    userId: string
  ): Promise<{ categories: CategoryAnalyticsItem[] }> {
    await this.verifyTripOwnership(tripId, userId);

    const tripObjectId = new mongoose.Types.ObjectId(tripId);

    const results = await Expense.aggregate([
      { $match: { trip: tripObjectId } },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totalSpent = results.reduce((sum, item) => sum + item.amount, 0);

    const categories: CategoryAnalyticsItem[] = results.map((item) => ({
      category: item._id,
      amount: item.amount,
      percentage: totalSpent > 0 ? Number(((item.amount / totalSpent) * 100).toFixed(2)) : 0,
    }));

    return { categories };
  }

  /**
   * GET /api/trips/:tripId/budget/daily
   * Returns daily spending totals sorted chronologically using MongoDB aggregation.
   */
  async getDailyAnalytics(
    tripId: string,
    userId: string
  ): Promise<{ daily: DailyAnalyticsItem[] }> {
    await this.verifyTripOwnership(tripId, userId);

    const tripObjectId = new mongoose.Types.ObjectId(tripId);

    const results = await Expense.aggregate([
      { $match: { trip: tripObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const daily: DailyAnalyticsItem[] = results.map((item) => ({
      date: item._id,
      amount: item.amount,
    }));

    return { daily };
  }

  /**
   * POST /api/trips/:tripId/expenses
   * Creates a new expense for the trip.
   */
  async createExpense(
    tripId: string,
    userId: string,
    data: CreateExpenseInput
  ): Promise<IExpense> {
    const trip = await this.verifyTripOwnership(tripId, userId);

    const currency = data.currency || trip.budget?.currency || 'USD';

    const expense = await Expense.create({
      trip: tripId,
      user: userId,
      title: data.title,
      amount: data.amount,
      currency,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes || '',
    });

    return expense;
  }

  /**
   * GET /api/trips/:tripId/expenses
   * Retrieves paginated list of expenses with optional category and date filtering.
   */
  async getExpenses(
    tripId: string,
    userId: string,
    query: ExpenseQuery
  ): Promise<PaginatedResult<IExpense>> {
    await this.verifyTripOwnership(tripId, userId);

    const filter: Record<string, any> = { trip: tripId };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.fromDate || query.toDate) {
      filter.date = {};
      if (query.fromDate) {
        filter.date.$gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        filter.date.$lte = new Date(query.toDate);
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(query.limit),
      Expense.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * GET /api/trips/:tripId/expenses/:expenseId
   * Retrieves a single expense by ID.
   */
  async getExpenseById(
    tripId: string,
    expenseId: string,
    userId: string
  ): Promise<IExpense> {
    await this.verifyTripOwnership(tripId, userId);

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      const error = new Error('Invalid expense ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      const error = new Error('Expense not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (expense.trip.toString() !== tripId) {
      const error = new Error('Expense not found for this trip');
      (error as any).statusCode = 404;
      throw error;
    }

    if (expense.user.toString() !== userId) {
      const error = new Error('You do not have permission to access this expense');
      (error as any).statusCode = 403;
      throw error;
    }

    return expense;
  }

  /**
   * PUT /api/trips/:tripId/expenses/:expenseId
   * Updates an existing expense.
   */
  async updateExpense(
    tripId: string,
    expenseId: string,
    userId: string,
    data: UpdateExpenseInput
  ): Promise<IExpense> {
    await this.verifyTripOwnership(tripId, userId);

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      const error = new Error('Invalid expense ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      const error = new Error('Expense not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (expense.trip.toString() !== tripId) {
      const error = new Error('Expense not found for this trip');
      (error as any).statusCode = 404;
      throw error;
    }

    if (expense.user.toString() !== userId) {
      const error = new Error('You do not have permission to update this expense');
      (error as any).statusCode = 403;
      throw error;
    }

    const updateFields: Record<string, any> = {};
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.amount !== undefined) updateFields.amount = data.amount;
    if (data.currency !== undefined) updateFields.currency = data.currency;
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.date !== undefined) updateFields.date = new Date(data.date);
    if (data.notes !== undefined) updateFields.notes = data.notes;

    const updated = await Expense.findByIdAndUpdate(expenseId, updateFields, {
      new: true,
      runValidators: true,
    });

    return updated!;
  }

  /**
   * DELETE /api/trips/:tripId/expenses/:expenseId
   * Deletes an expense from the trip.
   */
  async deleteExpense(
    tripId: string,
    expenseId: string,
    userId: string
  ): Promise<void> {
    await this.verifyTripOwnership(tripId, userId);

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      const error = new Error('Invalid expense ID');
      (error as any).statusCode = 400;
      throw error;
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      const error = new Error('Expense not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (expense.trip.toString() !== tripId) {
      const error = new Error('Expense not found for this trip');
      (error as any).statusCode = 404;
      throw error;
    }

    if (expense.user.toString() !== userId) {
      const error = new Error('You do not have permission to delete this expense');
      (error as any).statusCode = 403;
      throw error;
    }

    await Expense.findByIdAndDelete(expenseId);
  }
}

export default new ExpenseService();
