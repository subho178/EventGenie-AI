import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../index.js';

describe('EventGenie AI - API Integration Tests', () => {
  let createdEventId = null;

  it('GET /api/health should return 200 healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.service, 'EventGenie AI API');
  });

  it('GET /api/ai/status should return current AI engine configuration', async () => {
    const res = await request(app).get('/api/ai/status');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.modelName);
    assert.ok(res.body.activeMode);
  });

  it('GET /api/events should return list of events', async () => {
    const res = await request(app).get('/api/events');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/events with invalid payload should reject with 400 and validation errors', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        eventName: 'A', // too short
        guestCount: -5 // negative
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.details);
  });

  it('POST /api/events should create, personalize and generate complete event plan', async () => {
    const payload = {
      eventType: 'college event',
      eventName: 'HackGenie 2026 Inter-College Hackathon',
      eventDate: '2026-11-15',
      startTime: '09:00',
      endTime: '21:00',
      location: 'Student Innovation Center, Boston',
      guestCount: 200,
      totalBudget: 12000,
      currency: 'USD',
      theme: 'Cyberpunk Neon & AI Innovation',
      foodPreferences: 'Midnight energy drinks, pizza slices, vegan wraps',
      specialRequirements: 'High-speed gigabit Wi-Fi and 50 charging extension strips'
    };

    const res = await request(app)
      .post('/api/events')
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.eventName, payload.eventName);

    // Verify budget calculations
    assert.equal(res.body.data.budget.totalBudget, 12000);
    assert.ok(res.body.data.budget.categories.length > 0);
    assert.ok(typeof res.body.data.budget.remainingBalance === 'number');

    // Verify timeline
    assert.ok(res.body.data.timeline.tasks.length > 0);
    assert.ok(typeof res.body.data.timeline.progressPercent === 'number');

    // Verify vendors
    assert.ok(res.body.data.vendors.vendors.length > 0);

    // Verify creative ideas
    assert.ok(res.body.data.creativeIdeas.themeConcepts.length > 0);

    createdEventId = res.body.data.id;
  });

  it('GET /api/events/:id should return created event details', async () => {
    assert.ok(createdEventId, 'Created event id must be present');
    const res = await request(app).get(`/api/events/${createdEventId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, createdEventId);
  });

  it('PUT /api/events/:id should update budget and recalculate balances programmatically', async () => {
    assert.ok(createdEventId, 'Created event id must be present');
    
    // Modify category allocation to test financial recalculation
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .send({
        budget: {
          categories: [
            { id: 'cat-1', name: 'Stage & Sound', allocatedAmount: 5000 },
            { id: 'cat-2', name: 'Food & Refreshments', allocatedAmount: 4000 }
          ]
        }
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.budget.totalAllocated, 9000);
    assert.equal(res.body.data.budget.remainingBalance, 3000);
    assert.equal(res.body.data.budget.isOverBudget, false);
  });

  it('DELETE /api/events/:id should delete the event plan', async () => {
    assert.ok(createdEventId, 'Created event id must be present');
    const res = await request(app).delete(`/api/events/${createdEventId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Confirm it is no longer found
    const getRes = await request(app).get(`/api/events/${createdEventId}`);
    assert.equal(getRes.status, 404);
  });
});
