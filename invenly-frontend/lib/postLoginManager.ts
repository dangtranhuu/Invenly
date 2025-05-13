let _callback: (() => Promise<void>) | null = null;

export const setPostLoginCallback = (cb: () => Promise<void>) => {
  _callback = cb;
};

export const runPostLoginCallback = async (): Promise<boolean> => {
  if (_callback) {
    await _callback();
    _callback = null;
    return true;
  }
  
  console.log('⛔️ No callback registered');
  return false;
};