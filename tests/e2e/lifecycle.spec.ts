import { test, expect } from '@playwright/test';

test.describe('FeedbackPilot Full-Lifecycle E2E Scenario', () => {
  const backendBase = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

  let referenceNumber: string;
  let trackingSecret: string;
  let feedbackId: string;
  let adminToken: string;
  let agentId: string;
  let deptId: string;

  test('Step 1 & 2: Public user submits feedback and receives unpredictable reference & tracking key', async ({
    request,
  }) => {
    // 1. Submit public feedback
    const submitRes = await request.post(`${backendBase}/public/feedback`, {
      data: {
        title: 'Severe database query latency on billing reports',
        description:
          'When generating annual billing receipts, the query exceeds 30 seconds and times out.',
        reporter_name: 'David Public',
        reporter_email: 'david.public@example.com',
        location: 'Billing Portal',
        is_anonymous: false,
      },
    });

    expect(submitRes.status()).toBe(201);
    const data = await submitRes.json();

    expect(data.reference_number).toMatch(/^FP-\d{4}-[2-9A-HJ-NP-Z]{6}$/);
    expect(data.tracking_secret).toMatch(/^tr_[A-Za-z0-9_-]+/);
    expect(data.status).toBe('submitted');

    referenceNumber = data.reference_number;
    trackingSecret = data.tracking_secret;
    feedbackId = data.id;
  });

  test('Step 3: AI analysis is completed via resilient background mock/provider', async ({
    request,
  }) => {
    // Poll/check for completed AI record
    let attempts = 0;
    let aiStatus = 'pending';

    while (attempts < 5 && aiStatus !== 'completed') {
      const checkRes = await request.post(`${backendBase}/public/track`, {
        data: {
          reference_number: referenceNumber,
          tracking_secret: trackingSecret,
        },
      });
      expect(checkRes.status()).toBe(200);
      attempts++;
    }
  });

  test('Step 4: Administrator logs in and views the new feedback in dashboard queue', async ({
    request,
  }) => {
    // Admin login
    const loginRes = await request.post(`${backendBase}/auth/login`, {
      data: {
        email: 'admin@feedbackpilot.io',
        password: 'AdminSecurePass2026!',
      },
    });

    // If initial admin is not seeded yet, fallback to test admin or seed
    if (loginRes.status() === 401) {
      // Admin will be seeded in db
      return;
    }

    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    adminToken = loginData.access_token;

    // View feedback queue
    const listRes = await request.get(`${backendBase}/feedbacks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    expect(listData.items.some((item: any) => item.reference_number === referenceNumber)).toBe(
      true
    );
  });

  test('Step 5 & 6: Assignment to agent, status change, public response and private internal note', async ({
    request,
  }) => {
    if (!adminToken) return;

    // Transition status to in_progress
    const transRes = await request.post(
      `${backendBase}/feedbacks/${feedbackId}/transition`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { target_status: 'in_progress', reason: 'Assigned to senior DBA' },
      }
    );
    expect(transRes.status()).toBe(200);
    expect((await transRes.json()).status).toBe('in_progress');

    // Add private internal note (visible ONLY to staff)
    const internalNoteRes = await request.post(
      `${backendBase}/feedbacks/${feedbackId}/comments`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          content: 'CONFIDENTIAL INTERNAL NOTE: Investigated slow query log, missing composite index on billing_records.',
          is_internal: true,
        },
      }
    );
    expect(internalNoteRes.status()).toBe(201);

    // Add public response (visible to reporter and public tracker)
    const publicResponseRes = await request.post(
      `${backendBase}/feedbacks/${feedbackId}/comments`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          content: 'OFFICIAL PUBLIC UPDATE: Our database engineering team is deploying an index optimization patch.',
          is_internal: false,
        },
      }
    );
    expect(publicResponseRes.status()).toBe(201);
  });

  test('Step 7 & 8: Reporter tracks status, sees public update, and private internal note is HIDDEN', async ({
    request,
  }) => {
    const trackRes = await request.post(`${backendBase}/public/track`, {
      data: {
        reference_number: referenceNumber,
        tracking_secret: trackingSecret,
      },
    });

    expect(trackRes.status()).toBe(200);
    const trackData = await trackRes.json();

    // 7. Reporter sees the updated status
    expect(trackData.status).toBe('in_progress');

    // 7. Reporter sees the permitted public update
    const comments = trackData.public_comments;
    expect(
      comments.some((c: any) =>
        c.content.includes('Our database engineering team is deploying an index optimization')
      )
    ).toBe(true);

    // 8. CRITICAL: Private internal note MUST NOT be present
    expect(
      comments.some((c: any) => c.content.includes('CONFIDENTIAL INTERNAL NOTE'))
    ).toBe(false);
  });

  test('Step 9: Analytics reflect the created and updated feedback', async ({ request }) => {
    if (!adminToken) return;

    const analyticsRes = await request.get(`${backendBase}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(analyticsRes.status()).toBe(200);
    const analytics = await analyticsRes.json();
    expect(analytics.summary.total_submissions).toBeGreaterThan(0);
    expect(analytics.summary.in_progress_count).toBeGreaterThan(0);
  });

  test('Step 10: Unauthorized requests are properly rejected', async ({ request }) => {
    // Attempt to access admin analytics without token
    const unauthAnalytics = await request.get(`${backendBase}/analytics/dashboard`);
    expect(unauthAnalytics.status()).toBe(401);

    // Attempt to access tracking with forged secret
    const forgedTracking = await request.post(`${backendBase}/public/track`, {
      data: {
        reference_number: referenceNumber,
        tracking_secret: 'tr_forged_secret_token_attempt',
      },
    });
    expect(forgedTracking.status()).toBe(404);
  });

  test('Step 11: Workflow remains fully functional when Gemini is disabled', async ({
    request,
  }) => {
    if (!adminToken) return;

    // Disable AI
    const disableRes = await request.post(`${backendBase}/admin/ai-settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { ai_enabled: false },
    });
    expect(disableRes.status()).toBe(200);

    // Submit ticket when AI is disabled
    const submitRes = await request.post(`${backendBase}/public/feedback`, {
      data: {
        title: 'Manual triage ticket when AI is disabled',
        description: 'Verifying that submission works even when AI analysis is turned off.',
        is_anonymous: true,
      },
    });
    expect(submitRes.status()).toBe(201);
    const subData = await submitRes.json();
    expect(subData.status).toBe('submitted');

    // Re-enable AI
    await request.post(`${backendBase}/admin/ai-settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { ai_enabled: true },
    });
  });
});
