import Link from 'next/link';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import RegistrationForm from './components/RegistrationForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Register your business
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>
          
          <RegistrationForm />
          
          <div className="text-center mt-4">
            <Link 
              href="/"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
} 