/**
 * EventGenie Validation Schemas
 * Enforces input validation and sanitization using Zod.
 */

import { z } from 'zod';

export const EventInputSchema = z.object({
  eventType: z.string().min(1, 'Event type is required').default('wedding'),
  eventName: z.string().min(2, 'Event name must be at least 2 characters').max(100, 'Event name too long'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format'),
  startTime: z.string().optional().default(''),
  endTime: z.string().optional().default(''),
  location: z.string().min(2, 'Location is required').max(150, 'Location too long'),
  guestCount: z.coerce.number().int().min(1, 'Guest count must be at least 1').max(100000, 'Exceeded max guest count'),
  totalBudget: z.coerce.number().min(0, 'Budget must be a non-negative amount'),
  currency: z.string().min(1).max(5).default('USD'),
  theme: z.string().max(200).optional().default(''),
  foodPreferences: z.string().max(300).optional().default(''),
  decorationPreferences: z.string().max(300).optional().default(''),
  entertainmentPreferences: z.string().max(300).optional().default(''),
  specialRequirements: z.string().max(500).optional().default('')
});

export const BudgetCategoryUpdateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Category name is required').max(80),
  allocatedAmount: z.coerce.number().min(0, 'Amount must be non-negative'),
  notes: z.string().optional().default(''),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional().default('Medium')
});

export const TaskUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().optional().default(''),
  suggestedDeadline: z.string().optional().default(''),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  assignedTo: z.string().optional().default('')
});

export const VendorUpdateSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1).max(80),
  serviceName: z.string().min(1).max(100),
  isRequired: z.boolean().default(true),
  status: z.enum(['needed', 'researching', 'contacted', 'booked', 'confirmed']).default('needed'),
  estimatedCost: z.coerce.number().min(0).default(0),
  contactName: z.string().optional().default(''),
  contactDetails: z.string().optional().default(''),
  contractNotes: z.string().optional().default('')
});
