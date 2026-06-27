import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../auth/authSlice.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

// Base query attaches the access token from the store to every request.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: 'include', // send/receive the refresh-token cookie
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Wrapper: on a 401, try to silently refresh the access token once,
// then replay the original request. If refresh fails, log out.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refresh = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refresh.data?.accessToken) {
      api.dispatch(setCredentials({ accessToken: refresh.data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions); // retry
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Cache invalidation tags → automatic, surgical refetches (no manual reloads).
  tagTypes: ['Lead', 'Leads', 'Property', 'User', 'Note', 'FollowUp', 'Notification', 'Dashboard', 'Document', 'Payment', 'Payments', 'Profile'],
  endpoints: (builder) => ({
    // ---------- AUTH ----------
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    googleLogin: builder.mutation({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
    }),

    // ---------- PROFILE (self-service) ----------
    getMyProfile: builder.query({
      query: () => '/profile/me',
      transformResponse: (res) => res.user,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/profile', // PATCH /api/v1/profile (matches backend profileRouter)
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),


    getMe: builder.query({
      query: () => '/auth/me',
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),

    // ---------- DASHBOARD ----------
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),

    // ---------- LEADS ----------
    getLeads: builder.query({
      query: (params) => ({ url: '/leads', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((l) => ({ type: 'Lead', id: l._id })),
              { type: 'Leads', id: 'LIST' },
            ]
          : [{ type: 'Leads', id: 'LIST' }],
    }),
    getLead: builder.query({
      query: (id) => `/leads/${id}`,
      providesTags: (r, e, id) => [{ type: 'Lead', id }],
    }),
    createLead: builder.mutation({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      invalidatesTags: [{ type: 'Leads', id: 'LIST' }, 'Dashboard'],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Lead', id }, { type: 'Leads', id: 'LIST' }],
    }),
    assignLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/assign`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Lead', id }, { type: 'Leads', id: 'LIST' }, 'Dashboard'],
    }),
    updateLeadStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Lead', id }, { type: 'Leads', id: 'LIST' }, 'Dashboard'],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({ url: `/leads/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Leads', id: 'LIST' }, 'Dashboard'],
    }),

    // ---------- REQUIREMENT ANALYSIS & MATCHING ----------
    upsertRequirement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/requirement`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Lead', id }],
    }),
    getLeadMatches: builder.query({
      query: ({ id, limit = 10 }) => ({ url: `/leads/${id}/matches`, params: { limit } }),
    }),
    shareProperties: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/share`, method: 'POST', body }),
    }),

    // ---------- DOCUMENTS (KYC) ----------
    getLeadDocuments: builder.query({
      query: (leadId) => `/leads/${leadId}/documents`,
      providesTags: (r, e, leadId) => [{ type: 'Document', id: leadId }],
    }),
    uploadLeadDocuments: builder.mutation({
      // body is a FormData instance (multipart). leadId is used for the URL only.
      query: ({ leadId, formData }) => ({
        url: `/leads/${leadId}/documents`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (r, e, { leadId }) => [{ type: 'Document', id: leadId }, { type: 'Lead', id: leadId }],
    }),
    verifyDocument: builder.mutation({
      query: ({ id, leadId, ...body }) => ({ url: `/documents/${id}/verify`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { leadId }) => [{ type: 'Document', id: leadId }, { type: 'Lead', id: leadId }],
    }),
    deleteDocument: builder.mutation({
      query: ({ id }) => ({ url: `/documents/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, { leadId }) => [{ type: 'Document', id: leadId }],
    }),

    // ---------- AGREEMENT & APPROVAL ----------
    uploadAgreement: builder.mutation({
      query: ({ leadId, formData }) => ({
        url: `/leads/${leadId}/agreement`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (r, e, { leadId }) => [{ type: 'Lead', id: leadId }],
    }),
    approveSale: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/approve`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Lead', id },
        { type: 'Leads', id: 'LIST' },
        { type: 'Property', id: 'LIST' },
        'Dashboard',
      ],
    }),

    // ---------- PAYMENTS (Razorpay) ----------
    createPaymentOrder: builder.mutation({
      query: (body) => ({ url: '/payments/order', method: 'POST', body }),
    }),
    verifyPayment: builder.mutation({
      query: ({ leadId, ...body }) => ({ url: '/payments/verify', method: 'POST', body }),
      invalidatesTags: (r, e, { leadId }) => [
        { type: 'Lead', id: leadId },
        { type: 'Payments', id: 'LIST' },
        'Dashboard',
      ],
    }),
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((p) => ({ type: 'Payment', id: p._id })),
              { type: 'Payments', id: 'LIST' },
            ]
          : [{ type: 'Payments', id: 'LIST' }],
    }),
    getPayment: builder.query({
      query: (id) => `/payments/${id}`,
      providesTags: (r, e, id) => [{ type: 'Payment', id }],
    }),
    refundPayment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/refund`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Payments', id: 'LIST' }, 'Dashboard'],
    }),

    // ---------- NOTES ----------
    getNotes: builder.query({
      query: (leadId) => `/leads/${leadId}/notes`,
      providesTags: (r, e, leadId) => [{ type: 'Note', id: leadId }],
    }),
    addNote: builder.mutation({
      query: ({ leadId, note }) => ({ url: `/leads/${leadId}/notes`, method: 'POST', body: { note } }),
      invalidatesTags: (r, e, { leadId }) => [{ type: 'Note', id: leadId }],
    }),

    // ---------- FOLLOW-UPS ----------
    getLeadFollowUps: builder.query({
      query: (leadId) => `/leads/${leadId}/followups`,
      providesTags: (r, e, leadId) => [{ type: 'FollowUp', id: leadId }],
    }),
    addFollowUp: builder.mutation({
      query: ({ leadId, ...body }) => ({ url: `/leads/${leadId}/followups`, method: 'POST', body }),
      invalidatesTags: (r, e, { leadId }) => [{ type: 'FollowUp', id: leadId }],
    }),
    getMyFollowUps: builder.query({
      query: (params) => ({ url: '/followups/mine', params }),
      providesTags: [{ type: 'FollowUp', id: 'MINE' }],
    }),

    // ---------- PROPERTIES ----------
    getProperties: builder.query({
      query: (params) => ({ url: '/properties', params }),
      providesTags: [{ type: 'Property', id: 'LIST' }],
    }),
    // Public listing — no auth required. Backend reuses the listProperties controller.
    getPublicProperties: builder.query({
      query: (params) => ({ url: '/properties/public', params }),
      providesTags: [{ type: 'Property', id: 'PUBLIC_LIST' }],
    }),
    // Single property. Key is `getProperty` → hook auto-generated as useGetPropertyQuery.
    getProperty: builder.query({
      query: (id) => `/properties/${id}`,
      transformResponse: (res) => res.property,
      providesTags: (result, error, id) => [{ type: 'Property', id }],
    }),
    createProperty: builder.mutation({
      query: (body) => ({ url: '/properties', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Property', id: 'LIST' },
        { type: 'Property', id: 'PUBLIC_LIST' },
      ],
    }),
    updateProperty: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/properties/${id}`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Property', id: 'LIST' },
        { type: 'Property', id: 'PUBLIC_LIST' },
        { type: 'Property', id },
      ],
    }),
    deleteProperty: builder.mutation({
      query: (id) => ({ url: `/properties/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, id) => [
        { type: 'Property', id: 'LIST' },
        { type: 'Property', id: 'PUBLIC_LIST' },
        { type: 'Property', id },
      ],
    }),
    // Append images to an existing property (multipart FormData under "images").
    uploadPropertyImages: builder.mutation({
      query: ({ id, formData }) => ({ url: `/properties/${id}/images`, method: 'POST', body: formData }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'LIST' },
        { type: 'Property', id: 'PUBLIC_LIST' },
      ],
    }),
    // Delete one image. key may contain "/" (Cloudinary public_id) so encode it.
    deletePropertyImage: builder.mutation({
      query: ({ id, key }) => ({
        url: `/properties/${id}/images/${key.split('/').map(encodeURIComponent).join('/')}`,
        method: 'DELETE',
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'LIST' },
        { type: 'Property', id: 'PUBLIC_LIST' },
      ],
    }),

    // ---------- USERS ----------
    getUsers: builder.query({
      query: (params) => ({ url: '/users', params }),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    getAssignable: builder.query({
      query: () => '/users/assignable',
      providesTags: [{ type: 'User', id: 'ASSIGNABLE' }],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'User', id: 'ASSIGNABLE' }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // ---------- NOTIFICATIONS ----------
    getNotifications: builder.query({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    // ---------- PUBLIC ENQUIRY ----------
    submitEnquiry: builder.mutation({
      query: (body) => ({ url: '/enquiries', method: 'POST', body }),
      invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useGetDashboardQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useAssignLeadMutation,
  useUpdateLeadStatusMutation,
  useDeleteLeadMutation,
  useGetNotesQuery,
  useAddNoteMutation,
  useGetLeadFollowUpsQuery,
  useAddFollowUpMutation,
  useGetMyFollowUpsQuery,
  useGetPropertiesQuery,
  useGetPublicPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useUploadPropertyImagesMutation,
  useDeletePropertyImageMutation,
  useGetUsersQuery,
  useGetAssignableQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSubmitEnquiryMutation,
  useUpdateProfileMutation,
  useGetMyProfileQuery,
  // Workflow extensions
  useUpsertRequirementMutation,
  useGetLeadMatchesQuery,
  useSharePropertiesMutation,
  useGetLeadDocumentsQuery,
  useUploadLeadDocumentsMutation,
  useVerifyDocumentMutation,
  useDeleteDocumentMutation,
  useUploadAgreementMutation,
  useApproveSaleMutation,
  // Payments
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useRefundPaymentMutation,
} = apiSlice;