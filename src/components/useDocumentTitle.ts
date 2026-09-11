import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetSchoolByIdQuery } from '../features/Apis/School.Api';
import type { RootState } from '../App/store';

export const useDocumentTitle = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Consistent with your Redux shape checks
  const schoolId = user?.schoolId || user?.user?.schoolId;
  const userData = user?.user || user;

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !isAuthenticated || !user || !schoolId,
  });

  useEffect(() => {
    // 1. Update Document Title
    if (isAuthenticated && school?.name) {
      document.title = `${school.name} | ElimuHub`;
    } else if (isAuthenticated && userData?.name) {
      document.title = `${userData.name}'s Dashboard | ElimuHub`;
    } else {
      document.title = 'ElimuHub | Smart Multi-Tenant School Management Platform';
    }

    // 2. Dynamically Update Favicon
    let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'shortcut icon';
      document.head.appendChild(favicon);
    }

    if (school?.faviconUrl) {
      favicon.href = school.faviconUrl;
    } else {
      // Default fallback favicon
      favicon.href = './src/assets/school-books-young-adult-education.jpg';
    }
  }, [isAuthenticated, school, userData]);
};