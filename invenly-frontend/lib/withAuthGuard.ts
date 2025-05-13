export const withAuthGuard = async (
  logic: (token: string) => Promise<void>,
  router: any,
  loginRedirectPath = '/login',
  returnToPath?: string
) => {
  const token = localStorage.getItem('invenly_token');
  if (!token) {
    if (returnToPath) {
      localStorage.setItem('redirectAfterLogin', returnToPath);
    }
    router.push(loginRedirectPath);
    return;
  }

  try {
    await logic(token);
  } catch (err: any) {
    if (err?.status === 401 || err?.response?.status === 401) {
      if (returnToPath) {
        localStorage.setItem('redirectAfterLogin', returnToPath);
      }
      router.push(loginRedirectPath);
    } else {
      throw err;
    }
  }
};
