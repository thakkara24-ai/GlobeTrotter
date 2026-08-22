import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  updateBudget,
  getBudgetSummary,
  getCategoryAnalytics,
  getDailyAnalytics,
  getBudgetRecommendation,
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../controllers/expense.controller';

const router = Router({ mergeParams: true });

// All budget & expense routes require authentication
router.use(authenticate);

/**
 * Budget & Analytics Routes
 */
router.get('/:tripId/budget/recommendation', getBudgetRecommendation);
router.get('/:tripId/budget/categories', getCategoryAnalytics);
router.get('/:tripId/budget/daily', getDailyAnalytics);
router.get('/:tripId/budget', getBudgetSummary);
router.put('/:tripId/budget', updateBudget);

/**
 * Expense CRUD Routes
 */
router.post('/:tripId/expenses', createExpense);
router.get('/:tripId/expenses', getExpenses);
router.get('/:tripId/expenses/:expenseId', getExpenseById);
router.put('/:tripId/expenses/:expenseId', updateExpense);
router.delete('/:tripId/expenses/:expenseId', deleteExpense);

export default router;
