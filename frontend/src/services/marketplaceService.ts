import api from './api';
import { CO2Listing, CO2Requirement, MatchBreakdown, NotificationItem, PlatformSettings } from '../types';

export const marketplaceService = {
  async getListings(params?: any): Promise<CO2Listing[]> {
    const { data } = await api.get<{ listings: CO2Listing[] }>('/marketplace/listings', { params });
    return data.listings;
  },

  async getListingById(id: string): Promise<CO2Listing> {
    const { data } = await api.get<{ listing: CO2Listing }>(`/marketplace/listings/${id}`);
    return data.listing;
  },

  async createListing(payload: any): Promise<CO2Listing> {
    const { data } = await api.post<{ listing: CO2Listing }>('/marketplace/listings', payload);
    return data.listing;
  },

  async getRequirements(): Promise<CO2Requirement[]> {
    const { data } = await api.get<{ requirements: CO2Requirement[] }>('/marketplace/requirements');
    return data.requirements;
  },

  async createRequirement(payload: any): Promise<CO2Requirement> {
    const { data } = await api.post<{ requirement: CO2Requirement }>('/marketplace/requirements', payload);
    return data.requirement;
  },

  async getMatches(): Promise<MatchBreakdown[]> {
    const { data } = await api.get<{ matches: MatchBreakdown[] }>('/marketplace/matches');
    return data.matches;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const { data } = await api.get<{ notifications: NotificationItem[] }>('/notifications');
    return data.notifications;
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async getPlatformSettings(): Promise<PlatformSettings> {
    const { data } = await api.get<{ settings: PlatformSettings }>('/settings');
    return data.settings;
  },

  async getOverviewStats(): Promise<any> {
    const { data } = await api.get('/admin/overview');
    return data.stats;
  },
};
