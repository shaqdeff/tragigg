'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/profile', {
          withCredentials: true,
        });

        if (!response.data.user?.isVerified) {
          router.push('/verify-email');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
};

export default ProtectedRoute;
