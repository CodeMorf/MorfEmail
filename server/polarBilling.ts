import { Polar } from '@polar-sh/sdk';
import { validateEvent } from '@polar-sh/sdk/webhooks';
import type { DbBillingState } from '../engine/database/models';
import type { PolarBillingState, PolarBillingStatus, PolarPlan } from '../src/types';
import { LocalDb } from './localDb';

type PolarWebhookEvent = {
  type: string;
  timestamp?: string;
  data?: Record<string, unknown>;
};

type BillingPlanDefinition = {
  key: string;
  productId: string;
};

type BillingCheckoutInput = {
  planKey: string;
  customerEmail?: string;
};

const PLAN_ENVIRONMENT_KEYS = [
  ['starter', 'POLAR_PRODUCT_STARTER_ID'],
  ['pro', 'POLAR_PRODUCT_PRO_ID'],
  ['business', 'POLAR_PRODUCT_BUSINESS_ID'],
  ['enterprise', 'POLAR_PRODUCT_ENTERPRISE_ID']
] as const;

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function mapStatus(status: string, eventType: string): string {
  if (eventType === 'subscription.canceled' && status === 'active') return 'active';
  if (['incomplete', 'trialing', 'active', 'past_due', 'canceled', 'revoked', 'paused'].includes(status)) return status;
  return status || 'unknown';
}

function publicStatus(status: string): PolarBillingStatus {
  if (['unconfigured', 'inactive', 'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'revoked', 'paused'].includes(status)) {
    return status as PolarBillingStatus;
  }
  return 'unknown';
}

export class PolarBillingService {
  private readonly environment: 'production' | 'sandbox';
  private readonly accessToken: string;
  private readonly webhookSecret: string;
  private readonly appUrl: string;
  private readonly planDefinitions: BillingPlanDefinition[];
  private readonly client: Polar | null;
  private cachedPlans: { expiresAt: number; plans: PolarPlan[]; errors: string[] } | null = null;

  constructor() {
    this.environment = process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox';
    this.accessToken = process.env.POLAR_ACCESS_TOKEN?.trim() || '';
    this.webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim() || '';
    this.appUrl = (process.env.MORFEMAIL_APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
    this.planDefinitions = PLAN_ENVIRONMENT_KEYS
      .map(([key, envKey]) => ({ key, productId: process.env[envKey]?.trim() || '' }))
      .filter((plan) => Boolean(plan.productId));
    this.client = this.accessToken
      ? new Polar({ accessToken: this.accessToken, server: this.environment })
      : null;
  }

  public getPublicConfig(): {
    configured: boolean;
    webhookConfigured: boolean;
    environment: 'production' | 'sandbox';
    configuredPlanKeys: string[];
  } {
    return {
      configured: Boolean(this.client && this.planDefinitions.length),
      webhookConfigured: Boolean(this.webhookSecret),
      environment: this.environment,
      configuredPlanKeys: this.planDefinitions.map((plan) => plan.key)
    };
  }

  public getPublicState(db: LocalDb): PolarBillingState {
    const stored = db.getBillingState();
    const config = this.getPublicConfig();
    return {
      configured: config.configured,
      webhookConfigured: config.webhookConfigured,
      environment: this.environment,
      status: config.configured ? publicStatus(stored?.status || 'inactive') : 'unconfigured',
      planName: stored?.plan_name || undefined,
      productId: stored?.product_id || undefined,
      polarCustomerId: stored?.polar_customer_id || undefined,
      polarSubscriptionId: stored?.polar_subscription_id || undefined,
      currentPeriodStart: stored?.current_period_start || undefined,
      currentPeriodEnd: stored?.current_period_end || undefined,
      cancelAtPeriodEnd: Boolean(stored?.cancel_at_period_end),
      lastEventAt: stored?.last_event_at || undefined,
      portalAvailable: Boolean(this.client && stored?.polar_customer_id)
    };
  }

  public async getPlans(): Promise<{ configured: boolean; plans: PolarPlan[]; errors: string[] }> {
    const config = this.getPublicConfig();
    if (!config.configured || !this.client) return { configured: false, plans: [], errors: [] };
    if (this.cachedPlans && this.cachedPlans.expiresAt > Date.now()) return { configured: true, ...this.cachedPlans };

    const plans: PolarPlan[] = [];
    const errors: string[] = [];
    for (const definition of this.planDefinitions) {
      try {
        const product = await this.client.products.get({ id: definition.productId });
        if (product.isArchived) continue;
        plans.push({
          key: definition.key,
          productId: product.id,
          name: product.name,
          description: product.description,
          isRecurring: product.isRecurring,
          recurringInterval: product.recurringInterval,
          recurringIntervalCount: product.recurringIntervalCount,
          prices: product.prices
            .filter((price) => !Boolean((price as unknown as Record<string, unknown>).isArchived))
            .map((price) => {
              const raw = price as unknown as Record<string, unknown>;
              return {
                id: asText(raw.id),
                amountType: asText(raw.amountType) || 'unknown',
                currency: asText(raw.priceCurrency),
                amount: typeof raw.priceAmount === 'number' ? raw.priceAmount : null
              };
            })
        });
      } catch (error) {
        errors.push(`${definition.key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.cachedPlans = { expiresAt: Date.now() + 30_000, plans, errors };
    return { configured: true, plans, errors };
  }

  public async createCheckout(input: BillingCheckoutInput): Promise<{ id: string; url: string; planKey: string }> {
    if (!this.client || !this.planDefinitions.length) {
      throw new Error('Polar no está configurado: faltan POLAR_ACCESS_TOKEN y al menos un POLAR_PRODUCT_*_ID');
    }
    const definition = this.planDefinitions.find((plan) => plan.key === input.planKey);
    if (!definition) throw new Error('El plan solicitado no está configurado en Polar');

    const customerEmail = input.customerEmail?.trim().toLowerCase() || undefined;
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      throw new Error('El correo de compra no es válido');
    }

    const checkout = await this.client.checkouts.create({
      products: [definition.productId],
      customerEmail,
      successUrl: `${this.appUrl}/?polar=success&checkout_id={CHECKOUT_ID}`,
      returnUrl: `${this.appUrl}/?polar=return`,
      externalCustomerId: customerEmail ? `morfemail:${customerEmail}` : undefined,
      metadata: { app: 'morfemail', plan_key: definition.key }
    });

    return { id: checkout.id, url: checkout.url, planKey: definition.key };
  }

  public async createCustomerPortal(db: LocalDb): Promise<{ url: string }> {
    if (!this.client) throw new Error('Polar no está configurado');
    const customerId = db.getBillingState()?.polar_customer_id;
    if (!customerId) throw new Error('Todavía no hay un cliente Polar sincronizado en este equipo');
    const session = await this.client.customerSessions.create({
      customerId,
      returnUrl: `${this.appUrl}/?polar=portal`
    });
    return { url: session.customerPortalUrl };
  }

  public handleWebhook(body: Buffer, headers: Record<string, string>, db: LocalDb): { eventType: string; duplicate: boolean } {
    if (!this.webhookSecret) throw new Error('POLAR_WEBHOOK_SECRET no está configurado');
    const event = validateEvent(body, headers, this.webhookSecret) as unknown as PolarWebhookEvent;
    const eventId = asText(headers['webhook-id']) || `${event.type}:${asText(event.data?.id)}:${asText(event.timestamp)}`;
    const inserted = db.recordBillingEvent({
      event_id: eventId,
      event_type: event.type,
      payload_json: body.toString('utf8'),
      received_at: new Date().toISOString()
    });
    if (inserted) this.persistEvent(event, db);
    return { eventType: event.type, duplicate: !inserted };
  }

  private persistEvent(event: PolarWebhookEvent, db: LocalDb): void {
    const data = event.data || {};
    const previous = db.getBillingState();
    const eventTimestamp = asText(event.timestamp) || new Date().toISOString();
    const subscriptionEvent = event.type.startsWith('subscription.');
    const customerEvent = event.type.startsWith('customer.');
    if (!subscriptionEvent && !customerEvent) return;

    const product = asRecord(data.product);
    const status = subscriptionEvent
      ? mapStatus(asText(data.status).toLowerCase(), event.type)
      : previous?.status || 'inactive';
    const customerId = asText(data.customer_id) || asText(asRecord(data.customer)?.id) || previous?.polar_customer_id;
    const subscriptionId = asText(data.id) || previous?.polar_subscription_id;
    const productId = asText(data.product_id) || asText(product?.id) || previous?.product_id;
    const planName = asText(product?.name) || asText(data.product_name) || previous?.plan_name;

    const currentPeriodStart = asText(data.current_period_start) || previous?.current_period_start;
    const currentPeriodEnd = asText(data.current_period_end) || previous?.current_period_end;
    const cancelAtPeriodEnd = typeof data.cancel_at_period_end === 'boolean'
      ? data.cancel_at_period_end
      : Boolean(previous?.cancel_at_period_end);

    const state: DbBillingState = {
      id: 1,
      status,
      environment: this.environment,
      plan_name: planName,
      product_id: productId,
      polar_customer_id: customerId,
      polar_subscription_id: subscriptionId,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd ? 1 : 0,
      last_event_at: eventTimestamp,
      updated_at: new Date().toISOString()
    };
    db.saveBillingState(state);
  }
}
