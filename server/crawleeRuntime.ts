import { RequestQueue as CrawleeRequestQueue } from 'crawlee';

export class CrawleeRuntime {
  private static queuePromise: Promise<CrawleeRequestQueue> | null = null;

  private static async queue(): Promise<CrawleeRequestQueue> {
    if (!this.queuePromise) {
      this.queuePromise = CrawleeRequestQueue.open('morfemail-local');
    }
    return this.queuePromise;
  }

  public static async enqueue(url: string, userData: Record<string, unknown> = {}): Promise<boolean> {
    const queue = await this.queue();
    const result = await queue.addRequest({ url, userData });
    return !result.wasAlreadyPresent;
  }

  public static async stats(): Promise<{ pending: number; handled: number }> {
    const queue = await this.queue();
    const info = await queue.getInfo();
    return {
      pending: info?.pendingRequestCount || 0,
      handled: info?.handledRequestCount || 0
    };
  }

  public static async clear(): Promise<void> {
    const queue = await this.queue();
    await queue.drop();
    this.queuePromise = null;
  }
}
