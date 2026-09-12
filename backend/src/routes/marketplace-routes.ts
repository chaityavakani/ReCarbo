import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplaceController';
import { RequirementController } from '../controllers/requirementController';
import { RFQController } from '../controllers/rfqController';
import { LogisticsController } from '../controllers/logisticsController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// ==========================================
// 1. CO2 LISTINGS (Module 1)
// ==========================================
router.get('/listings', MarketplaceController.getListings);
router.get('/listings/:id', MarketplaceController.getListingById);
router.post(
  '/listings',
  authMiddleware,
  roleMiddleware(['SUPPLIER', 'ADMIN']),
  MarketplaceController.createListing
);
router.put(
  '/listings/:id',
  authMiddleware,
  roleMiddleware(['SUPPLIER', 'ADMIN']),
  MarketplaceController.updateListing
);
router.patch(
  '/listings/:id/status',
  authMiddleware,
  roleMiddleware(['SUPPLIER', 'ADMIN']),
  MarketplaceController.setStatus
);
router.delete(
  '/listings/:id',
  authMiddleware,
  roleMiddleware(['SUPPLIER', 'ADMIN']),
  MarketplaceController.deleteListing
);

// ==========================================
// 2. BUYER REQUIREMENTS & MATCHING (Module 2)
// ==========================================
router.get('/requirements', RequirementController.getRequirements);
router.get('/requirements/:id', RequirementController.getRequirementById);
router.post(
  '/requirements',
  authMiddleware,
  roleMiddleware(['BUYER', 'ADMIN']),
  RequirementController.createRequirement
);
router.put(
  '/requirements/:id',
  authMiddleware,
  roleMiddleware(['BUYER', 'ADMIN']),
  RequirementController.updateRequirement
);
router.delete(
  '/requirements/:id',
  authMiddleware,
  roleMiddleware(['BUYER', 'ADMIN']),
  RequirementController.deleteRequirement
);

// AI Matching Engine Triggers
router.get('/requirements/:id/matches', optionalAuthMiddleware, RequirementController.findMatchesForRequirement);
router.get('/listings/:id/matches', optionalAuthMiddleware, RequirementController.findMatchesForListing);

// ==========================================
// 3. RFQ & ALLOCATION ENGINE (Module 3)
// ==========================================
router.get('/quote-requests', RFQController.getQuoteRequests);
router.get('/quote-requests/:id', RFQController.getQuoteRequestById);
router.post(
  '/quote-requests',
  authMiddleware,
  roleMiddleware(['SUPPLIER', 'ADMIN']),
  RFQController.createQuoteRequest
);
router.post(
  '/quote-requests/:id/quotes',
  authMiddleware,
  roleMiddleware(['BUYER', 'ADMIN']),
  RFQController.submitQuote
);
router.get(
  '/quote-requests/:id/preview-allocation',
  authMiddleware,
  RFQController.previewAllocation
);
router.post(
  '/quote-requests/:id/allocate',
  authMiddleware,
  roleMiddleware(['SUPPLIER', 'ADMIN']),
  RFQController.executeAllocation
);

// ==========================================
// 4. LOGISTICS & COST CALCULATOR (Module 4)
// ==========================================
router.post('/calculate-logistics', optionalAuthMiddleware, LogisticsController.calculateCost);
router.post('/calculate-product-demand', LogisticsController.estimateProductDemand);

export default router;
