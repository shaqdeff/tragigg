import ProtectedRoute from './protected-route';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <main>Welcome to the homepage!</main>
    </ProtectedRoute>
  );
}
