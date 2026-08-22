import { Request, Response, NextFunction } from 'express';
import expenseService from '../services/expense.service';
import budgetRecommendationService from '../services/budgetRecommendation.service';
import {
  updateBudgetSchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from '../validators/expense.validator';
import { budgetRecommendationQuerySchema } from '../validators/budgetRecommendation.validator';

/**
 * PUT /api/trips/:tripId/budget
 */
export const updateBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const validated = updateBudgetSchema.parse(req.body);

    const budget = await expenseService.updateBudget(tripId, userId, validated);

    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/budget
 */
export const getBudgetSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;

    const summary = await expenseService.getBudgetSummary(tripId, userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/budget/categories
 */
export const getCategoryAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;

    const analytics = await expenseService.getCategoryAnalytics(tripId, userId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/budget/daily
 */
export const getDailyAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;

    const analytics = await expenseService.getDailyAnalytics(tripId, userId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/trips/:tripId/expenses
 */
export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const validated = createExpenseSchema.parse(req.body);

    const expense = await expenseService.createExpense(tripId, userId, validated);

    res.status(201).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/expenses
 */
export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const query = expenseQuerySchema.parse(req.query);

    const result = await expenseService.getExpenses(tripId, userId, query);

    res.json({
      success: true,
      data: {
        expenses: result.items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/expenses/:expenseId
 */
export const getExpenseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const expenseId = req.params.expenseId as string;

    const expense = await expenseService.getExpenseById(tripId, expenseId, userId);

    res.json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:tripId/expenses/:expenseId
 */
export const updateExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const expenseId = req.params.expenseId as string;
    const validated = updateExpenseSchema.parse(req.body);

    const expense = await expenseService.updateExpense(
      tripId,
      expenseId,
      userId,
      validated
    );

    res.json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:tripId/expenses/:expenseId
 */
export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const expenseId = req.params.expenseId as string;

    await expenseService.deleteExpense(tripId, expenseId, userId);

    res.json({
      success: true,
      data: { message: 'Expense deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/budget/recommendation
 */
export const getBudgetRecommendation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const tripId = req.params.tripId as string;
    const validatedQuery = budgetRecommendationQuerySchema.parse(req.query);

    const recommendation =
      await budgetRecommendationService.getBudgetRecommendation(
        tripId,
        userId,
        validatedQuery
      );

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};
