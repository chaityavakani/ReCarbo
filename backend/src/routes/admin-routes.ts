import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Protect all admin routes
router.use(authMiddleware, roleMiddleware(['ADMIN']));

// 1. Overview KPIs & Analytics
router.get('/overview', AdminController.getOverview);

// 2. User Governance
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);

// 3. Organization Verification & Trust
router.get('/companies', AdminController.getCompanies);
router.patch('/companies/:id/verify', AdminController.verifyCompany);
router.patch('/companies/:id/trust-score', AdminController.updateCompanyTrustScore);

// 4. Marketplace Governance
router.get('/listings', AdminController.getListings);
router.patch('/listings/:id/moderate', AdminController.moderateListing);
router.get('/rfqs', AdminController.getRfqs);
router.get('/orders', AdminController.getOrders);

// 5. Audit Trail Logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;

