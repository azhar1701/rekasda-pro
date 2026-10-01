import { set, get, keys, del } from 'idb-keyval';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY_PREFIX = 'offline_queue_';

/**
 * Utility to show a simple plain DOM toast notification adhering strictly
 * to the Flattened Design aesthetic (no drop shadows, 1px solid border, flat colors).
 */
const showFlatToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  const toast = document.createElement('div');
  
  // Flattened Design styles
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 24px';
  toast.style.border = '1px solid #cbd5e1'; // slate-300
  toast.style.backgroundColor = type === 'success' ? '#f0fdf4' : type === 'error' ? '#fef2f2' : '#f8fafc';
  toast.style.color = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#334155';
  toast.style.fontFamily = 'system-ui, sans-serif';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '500';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = 'none'; // Critical constraint: no drop shadows
  toast.style.transition = 'opacity 0.2s linear';
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 200);
  }, 4000);
};

/**
 * Adds a request to the IndexedDB offline queue.
 * @param url The endpoint URL
 * @param method HTTP Method
 * @param body Payload body
 */
export const addToQueue = async (url: string, method: QueuedRequest['method'], body: any) => {
  const id = `${QUEUE_KEY_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const queuedRequest: QueuedRequest = {
    id,
    url,
    method,
    body,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  await set(id, queuedRequest);
  showFlatToast('You are offline. Data saved locally and will sync later.', 'info');
  return id;
};

/**
 * Retrieves all queued requests from IndexedDB, sorted by oldest first.
 */
export const getQueue = async (): Promise<QueuedRequest[]> => {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((key: IDBValidKey) => typeof key === 'string' && key.startsWith(QUEUE_KEY_PREFIX));
  
  const requests: QueuedRequest[] = [];
  for (const key of queueKeys) {
    const req = await get<QueuedRequest>(key as string);
    if (req) requests.push(req);
  }
  
  return requests.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Clears the entire offline queue.
 */
export const clearQueue = async () => {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((key: IDBValidKey) => typeof key === 'string' && key.startsWith(QUEUE_KEY_PREFIX));
  
  for (const key of queueKeys) {
    await del(key);
  }
};

/**
 * Attempts to flush the queue by sending all stored requests to the server.
 * Used internally or by a background sync manager.
 */
export const syncQueue = async (fetchClient: (url: string, options: any) => Promise<Response> = window.fetch) => {
  if (!navigator.onLine) return; // Prevent sync attempt if clearly offline

  const requests = await getQueue();
  if (requests.length === 0) return;

  showFlatToast(`Syncing ${requests.length} pending offline submissions...`, 'info');
  
  let successCount = 0;

  for (const req of requests) {
    try {
      const response = await fetchClient(req.url, {
        method: req.method,
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await del(req.id);
        successCount++;
      } else {
        // Increment retry logic manually
        const updatedReq = { ...req, retryCount: req.retryCount + 1 };
        await set(req.id, updatedReq);
      }
    } catch (e) {
      const updatedReq = { ...req, retryCount: req.retryCount + 1 };
      await set(req.id, updatedReq);
    }
  }

  if (successCount > 0) {
    showFlatToast(`Successfully synced ${successCount} offline submissions.`, 'success');
  }
};

// Auto-sync listener simply when online event triggers
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue();
  });
}
