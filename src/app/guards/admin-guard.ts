import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const token = localStorage.getItem('adminToken');

  if (token) {
    return true;
  }

 router.navigate(['/admin-login']);

  return false;
};