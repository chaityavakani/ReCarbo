import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', CompanyController.listCompanies);
router.post('/verify-request', authMiddleware, CompanyController.submitVerificationRequest);
router.get('/:id', CompanyController.getCompany);
router.get('/:id/trust-breakdown', CompanyController.getTrustBreakdown);
router.put('/:id', authMiddleware, CompanyController.updateCompany);
router.patch('/:id/verify', authMiddleware, roleMiddleware(['ADMIN']), CompanyController.verifyCompany);

export default router;
