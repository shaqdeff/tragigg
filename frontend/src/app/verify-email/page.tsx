'use client';
import { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Component() {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    // If no email in URL, redirect to login
    if (!userEmail) {
      router.push('/login');
    }
  }, [userEmail, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;

    e.target.value = value.charAt(0);

    // Move to next input
    if (index < inputRefs.current.length - 1 && value) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const code = inputRefs.current.map((input) => input?.value).join('');
      if (code.length === 6) {
        handleSubmit(e);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasteData.length !== 6) return;

    pasteData.split('').forEach((digit, i) => {
      if (inputRefs.current[i]) {
        inputRefs.current[i]!.value = digit;
      }
    });

    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const code = inputRefs.current.map((input) => input?.value).join('');

      if (!userEmail) {
        setError('Email not found in the URL.');
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify`,
        {
          email: userEmail,
          code,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setVerificationSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            'Verification failed. Please try again.'
        );
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSuccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Email Verified Successfully!
          </h2>
          <p>Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen">
      <div className="flex justify-center pt-10 md:block md:p-10">
        <a href="/" className="flex items-center gap-2 font-medium">
          <Image src="/logo/logo.png" alt="Logo" width={160} height={160} />
        </a>
      </div>
      <div className="flex items-center justify-center mt-32">
        <div className="mx-auto max-w-[400px] space-y-6 py-12 px-6 md:px-0">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Verify your email</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Enter the 6-digit code sent to your email address to verify your
              account.
            </p>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-6 items-center gap-4">
              {[...Array(6)].map((_, i) => (
                <Input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onPaste={handlePaste}
                  className="h-12 w-full border border-gray-300 bg-transparent px-3 text-center text-lg font-medium shadow-sm transition-colors focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:focus:border-gray-500 dark:focus:ring-gray-500"
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
