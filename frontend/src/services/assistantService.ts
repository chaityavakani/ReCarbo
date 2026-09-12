import api from './api';
import { AssistantChatResponse } from '../types';

export const assistantService = {
  sendMessage: async (
    message: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<AssistantChatResponse> => {
    const res = await api.post('/assistant/chat', { message, history });
    return res.data;
  },

  parseSearch: async (query: string): Promise<{ filters: any; result: AssistantChatResponse }> => {
    const res = await api.post('/assistant/parse-search', { query });
    return res.data;
  },
};
