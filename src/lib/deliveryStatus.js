// Customer-facing simplified status labels for delivery tracking.
// Mirrors the backend CUSTOMER_STATUS_MAP in deliveryUtils.ts.
export const CUSTOMER_STATUS_MAP = {
  pending: "Preparing Order",
  assigned: "Rider Assigned",
  accepted: "Rider Assigned",
  preparing: "Preparing Order",
  ready_for_pickup: "Preparing Order",
  picked_up: "On the Way",
  on_the_way: "On the Way",
  arriving_soon: "Arriving Soon",
  arrived: "Rider Has Arrived",
  otp_verified: "Delivery Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Customer-facing status flow order (for progress indicators)
export const CUSTOMER_STATUS_FLOW = [
  "Preparing Order",
  "Rider Assigned",
  "On the Way",
  "Arriving Soon",
  "Rider Has Arrived",
  "Delivery Confirmed",
  "Delivered",
];