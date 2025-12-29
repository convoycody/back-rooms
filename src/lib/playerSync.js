let channel = null;

const getChannel = () => {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel('player-sync');
  return channel;
};

export const broadcastPlayerUpdate = (payload = {}) => {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage({ type: 'player-update', ...payload, ts: Date.now() });
  } catch (err) {
    console.warn('Broadcast player update skipped', err);
  }
};

export const listenPlayerUpdates = (callback) => {
  const ch = getChannel();
  if (!ch || typeof callback !== 'function') return () => {};
  const handler = (event) => {
    if (event.data?.type === 'player-update') {
      callback(event.data);
    }
  };
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
};
