// frontend/src/api/parcels.js
import client from './client'

export const parcelsApi = {
  // Create a new parcel with images (multipart/form-data)
  create: (formData) =>
    client.post('/api/parcels', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  // List parcels with filters
  list: (params = {}) =>
    client.get('/api/parcels', { params }).then((r) => r.data),

  // Get single parcel
  get: (id) =>
    client.get(`/api/parcels/${id}`).then((r) => r.data),

  // Track by tracking number
  track: (trackingNumber) =>
    client.get(`/api/parcels/track/${trackingNumber}`).then((r) => r.data),

  // Update parcel fields
  update: (id, data) =>
    client.patch(`/api/parcels/${id}`, data).then((r) => r.data),

  // Upload X-ray image separately
  uploadXray: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post(`/api/parcels/${id}/upload-xray`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  // Get checkpoints for a parcel
  getCheckpoints: (id) =>
    client.get(`/api/parcels/${id}/checkpoints`).then((r) => r.data),
}

// frontend/src/api/verification.js
export const verificationApi = {
  // Create a delivery checkpoint scan
  createCheckpoint: (formData) =>
    client.post('/api/verification/checkpoint', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  // Get checkpoints for a parcel
  getCheckpoints: (parcelId) =>
    client.get(`/api/verification/checkpoints/${parcelId}`).then((r) => r.data),

  // List sellers (for dropdowns)
  getSellers: () =>
    client.get('/api/verification/sellers').then((r) => r.data),

  // List couriers
  getCouriers: () =>
    client.get('/api/verification/couriers').then((r) => r.data),

  // Courier recent activity
  getCourierRecent: (courierId) =>
    client.get(`/api/verification/courier/${courierId}/recent`).then((r) => r.data),
}

// frontend/src/api/fraud.js
export const fraudApi = {
  analyze: (parcelId) =>
    client.post('/api/fraud/analyze', { parcel_id: parcelId }).then((r) => r.data),

  listEvents: (params = {}) =>
    client.get('/api/fraud/events', { params }).then((r) => r.data),

  getEvent: (id) =>
    client.get(`/api/fraud/events/${id}`).then((r) => r.data),

  getParcelEvents: (parcelId) =>
    client.get(`/api/fraud/parcel/${parcelId}`).then((r) => r.data),

  updateStatus: (id, status, notes) =>
    client.patch(`/api/fraud/events/${id}/status`, null, {
      params: { new_status: status, admin_notes: notes },
    }).then((r) => r.data),

  getSummary: () =>
    client.get('/api/fraud/stats/summary').then((r) => r.data),
}

// frontend/src/api/admin.js
export const adminApi = {
  getDashboard: () =>
    client.get('/api/admin/dashboard').then((r) => r.data),

  flagSeller: (id, flag) =>
    client.patch(`/api/admin/sellers/${id}/flag`, null, {
      params: { is_flagged: flag },
    }).then((r) => r.data),

  suspendCourier: (id, suspend) =>
    client.patch(`/api/admin/couriers/${id}/suspend`, null, {
      params: { is_suspended: suspend },
    }).then((r) => r.data),
}

// frontend/src/api/trust.js
export const trustApi = {
  getSellers: (params = {}) =>
    client.get('/api/trust/sellers', { params }).then((r) => r.data),

  getCouriers: (params = {}) =>
    client.get('/api/trust/couriers', { params }).then((r) => r.data),

  getSellerHistory: (id) =>
    client.get(`/api/trust/seller/${id}/history`).then((r) => r.data),

  getCourierHistory: (id) =>
    client.get(`/api/trust/courier/${id}/history`).then((r) => r.data),
}

// frontend/src/api/inquiry.js
export const inquiryApi = {
  list: (params = {}) =>
    client.get('/api/inquiry', { params }).then((r) => r.data),

  get: (id) =>
    client.get(`/api/inquiry/${id}`).then((r) => r.data),

  create: (data) =>
    client.post('/api/inquiry', data).then((r) => r.data),

  update: (id, data) =>
    client.patch(`/api/inquiry/${id}`, data).then((r) => r.data),

  addNote: (id, note) =>
    client.post(`/api/inquiry/${id}/note`, null, {
      params: { note },
    }).then((r) => r.data),
}

// frontend/src/api/heatmap.js
export const heatmapApi = {
  getGeoJSON: (params = {}) =>
    client.get('/api/heatmap/geojson', { params }).then((r) => r.data),

  getHotspots: () =>
    client.get('/api/heatmap/hotspots').then((r) => r.data),
}
