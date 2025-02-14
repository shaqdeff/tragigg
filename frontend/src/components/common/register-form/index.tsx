'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from './phone-input';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

// schema for registration form
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*]/,
      'Password must contain at least one special character'
    ),
  // confirmPassword: z.string(),
});
// .refine((data) => data.password === data.confirmPassword, {
//   message: 'Passwords do not match',
//   path: ['confirmPassword'],
// });

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [backendError, setBackendError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;
    return strength;
  };

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setBackendError(null);
    try {
      const response = await axios.post(
        'http://localhost:5000/auth/register',
        data,
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        const redirectUrl = response.data.redirectUrl || '/login';
        router.push(redirectUrl);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          'Registration failed. Please try again.';
        console.error('Registration failed:', errorMessage);
        setBackendError(errorMessage);
      } else {
        console.error('Registration failed:', (error as Error).message);
        setBackendError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Register your account</h1>
        <p className="text-balance text-sm text-slate-500 dark:text-slate-400">
          Enter your details below to sign up for an account
        </p>
      </div>
      <div className="grid gap-6">
        {/* Backend Error Message */}
        {backendError && (
          <p className="text-sm text-red-500 text-center">{backendError}</p>
        )}

        {/* First Name */}
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="blah@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone No</Label>
          <Controller
            name="phone"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <PhoneInput
                {...field}
                id="phone"
                placeholder="Phone no (optional)"
                defaultCountry="KE"
                className="w-full"
              />
            )}
          />
          {/* No error message for phone since it's optional */}
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              onChange={(e) => {
                setPasswordStrength(calculatePasswordStrength(e.target.value));
              }}
            />
            <button
              type="button"
              className="absolute right-2 top-2.5"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className={`h-full ${
                passwordStrength === 3
                  ? 'bg-green-500'
                  : passwordStrength === 2
                  ? 'bg-yellow-500'
                  : passwordStrength === 1
                  ? 'bg-red-500'
                  : 'bg-gray-200'
              } rounded`}
              style={{ width: `${(passwordStrength / 3) * 100}%` }}
            ></div>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        {/* <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              {...register('confirmPassword')}
            />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div> */}

        {/* Submit Button */}
        <Button type="submit" className="w-full">
          Sign Up
        </Button>

        {/* Google Sign-Up Button */}
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-slate-200 dark:after:border-slate-800">
          <span className="relative z-10 bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Or continue with
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = 'http://localhost:5000/auth/google';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Sign Up with Google
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{''}
        <a href="/login" className="underline underline-offset-4">
          Login
        </a>
      </div>
    </form>
  );
}
