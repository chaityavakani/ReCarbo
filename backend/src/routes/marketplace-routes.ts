import { Router } from 'express';
import { MarketplaceController } from '../controllers/stubControllers';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Listings
router.get('/listings', MarketplaceController.getListings);
router.get('/listings/:id', MarketplaceController.getListingById);
router.post('/listings', authMiddleware, roleMiddleware(['SUPPLIER', 'ADMIN']), MarketplaceController.createListing);

// Requirements
router.get('/requirements', MarketplaceController.getRequirements);
router.post('/requirements', authMiddleware, roleMiddleware(['BUYER', 'ADMIN']), MarketplaceController.createRequirement);

// Matches
router.get('/matches', authMiddleware, MarketplaceController.getMatches);

export default router;
