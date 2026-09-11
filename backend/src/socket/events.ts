/**
 * ReCarbo Real-Time Socket.IO Events
 * Single Source of Truth for all real-time events.
 * Naming convention: resource:action (all lowercase)
 */

export const SOCKET_EVENTS = {
  // Connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',

  // Marketplace & Listings
  LISTING_CREATED: 'listing:created',
  LISTING_UPDATED: 'listing:updated',
  LISTING_CLOSED: 'listing:closed',

  // Quotes & RFQ
  QUOTE_REQUEST_CREATED: 'quote_request:created',
  QUOTE_SUBMITTED: 'quote:submitted',
  QUOTE_ACCEPTED: 'quote:accepted',
  QUOTE_REJECTED: 'quote:rejected',
  ALLOCATION_RESOLVED: 'allocation:resolved',

  // Orders
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_DELIVERED: 'order:delivered',

  // Notifications & Alerts
  NOTIFICATION_NEW: 'notification:new',
  ALERT_BROADCAST: 'alert:broadcast',
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
