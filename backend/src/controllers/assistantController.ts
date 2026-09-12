import { Request, Response, NextFunction } from 'express';
import { AIAssistantService } from '../services/aiAssistantService';

export class AssistantController {
  /**
   * Main AI Chat Interface
   */
  static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Message text is required' },
        });
      }

      const result = await AIAssistantService.handleChatQuery(
        message,
        history || [],
        req.user?.userId
      );

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Free-text search parser endpoint
   */
  static async parseSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Query string is required' },
        });
      }

      const filters = AIAssistantService.parseNaturalLanguageQuery(query);
      const result = await AIAssistantService.handleChatQuery(query);

      return res.status(200).json({
        filters,
        result,
      });
    } catch (error) {
      next(error);
    }
  }
}
